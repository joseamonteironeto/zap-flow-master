import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { searchAmazonProducts } from "@/lib/amazon-creators";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre-oauth";

function numberParam(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function mlImage(url: unknown) {
  return typeof url === "string" ? url.replace(/^http:/, "https:").replace(/-I\.jpg$/i, "-O.jpg") : null;
}

async function searchMercadoLivre(params: URLSearchParams) {
  const token = await getMercadoLivreAccessToken();
  if (!token) throw new Error("Conecte o aplicativo do Mercado Livre nesta aba para liberar a consulta oficial.");
  const headers: HeadersInit = { Accept: "application/json", Authorization: `Bearer ${token}` };
  let query = params.get("q")?.trim() || "";
  if (!query) {
    const trendsResponse = await fetch("https://api.mercadolibre.com/trends/MLB?limit=20", { headers, signal: AbortSignal.timeout(10_000) });
    if (trendsResponse.ok) {
      const trends = await trendsResponse.json() as Array<{ keyword?: string }>;
      query = trends.find((item) => item.keyword)?.keyword || "ofertas";
    } else query = "ofertas";
  }
  const target = new URL("https://api.mercadolibre.com/products/search");
  target.searchParams.set("status", "active");
  target.searchParams.set("site_id", "MLB");
  target.searchParams.set("q", query);
  target.searchParams.set("limit", "24");
  const domainId = params.get("domain_id");
  if (domainId) target.searchParams.set("domain_id", domainId);
  const minPrice = numberParam(params.get("minPrice"));
  const maxPrice = numberParam(params.get("maxPrice"));
  const response = await fetch(target, { headers, signal: AbortSignal.timeout(15_000) });
  const data = await response.json().catch(() => ({})) as Record<string, any>;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("A conexão do Mercado Livre expirou ou não tem permissão para consultar o catálogo. Reconecte a conta.");
    throw new Error(data.message || `O Mercado Livre recusou a consulta (HTTP ${response.status}).`);
  }
  const summaries = Array.isArray(data.results) ? data.results as Record<string, any>[] : [];
  const details: Record<string, any>[] = [];
  for (let index = 0; index < summaries.length; index += 6) {
    const chunk = summaries.slice(index, index + 6);
    details.push(...await Promise.all(chunk.map(async (summary) => {
      const detailResponse = await fetch(`https://api.mercadolibre.com/products/${encodeURIComponent(String(summary.id))}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      if (!detailResponse.ok) return summary;
      return { ...summary, ...await detailResponse.json() as Record<string, any> };
    })));
  }
  const items = details.map((product) => {
    const winner = product.buy_box_winner || {};
    const price = Number(winner.price);
    const originalPrice = Number(winner.original_price);
    return {
      id: product.id,
      title: product.name || winner.title || "Produto sem título",
      imageUrl: mlImage(product.pictures?.[0]?.url || product.pictures?.[0]?.secure_url || winner.thumbnail),
      url: product.permalink || winner.permalink || `https://www.mercadolivre.com.br/p/${product.id}`,
      price: Number.isFinite(price) ? price : null,
      originalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
      currency: winner.currency_id || "BRL",
      condition: winner.condition || null,
      availableQuantity: winner.available_quantity ?? null,
      soldQuantity: winner.sold_quantity ?? null,
      freeShipping: Boolean(winner.shipping?.free_shipping),
      seller: winner.seller?.nickname || winner.seller_id || winner.seller?.id || null,
      categoryId: winner.category_id || product.domain_id || null,
      officialStore: winner.official_store_name || winner.official_store_id || null,
      installments: winner.installments || null,
      attributes: product.attributes || [],
      domainId: product.domain_id || null,
      winnerItemId: winner.item_id || null,
      catalogStatus: product.status || null,
      raw: product,
    };
  }).filter((item) => (!minPrice || (item.price != null && item.price >= minPrice)) && (!maxPrice || (item.price != null && item.price <= maxPrice)));
  const domains = [...new Map(details.filter((item) => item.domain_id).map((item) => [item.domain_id, item.domain_name || item.domain_id])).entries()];
  return {
    store: "mercadolivre",
    query,
    items,
    total: data.paging?.total || items.length,
    filters: domains.length ? [{ id: "domain_id", name: "Tipo de produto", values: domains.map(([id, name]) => ({ id, name })) }] : [],
    appliedFilters: domainId ? [{ id: "domain_id", value: domainId }] : [],
    sorts: [],
    source: "catalog-products",
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const store = params.get("store") || "mercadolivre";
  try {
    if (store === "amazon") {
      if (!env.DB) return NextResponse.json({ error: "Banco de dados indisponível." }, { status: 503 });
      const settings = await env.DB.prepare("SELECT amazon_tracking_id AS amazonTrackingId FROM affiliate_settings WHERE id = 1")
        .first<{ amazonTrackingId: string }>();
      if (!settings?.amazonTrackingId) return NextResponse.json({ error: "Informe primeiro seu Tracking ID da Amazon em Afiliados." }, { status: 412 });
      const q = params.get("q")?.trim();
      if (!q) return NextResponse.json({ error: "Na Amazon, informe uma palavra-chave para consultar o catálogo oficial." }, { status: 400 });
      const result = await searchAmazonProducts({
        keywords: q,
        partnerTag: settings.amazonTrackingId,
        searchIndex: params.get("searchIndex") || "All",
        sortBy: params.get("sort") || undefined,
        brand: params.get("brand") || undefined,
        minPrice: numberParam(params.get("minPrice")),
        maxPrice: numberParam(params.get("maxPrice")),
      });
      return NextResponse.json({ store: "amazon", query: q, sorts: ["Relevance", "Price:LowToHigh", "Price:HighToLow", "AvgCustomerReviews", "Featured"], ...result });
    }
    return NextResponse.json(await searchMercadoLivre(params));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o catálogo.";
    const credentialsRequired = message === "AMAZON_CREDENTIALS_REQUIRED";
    return NextResponse.json({ error: credentialsRequired ? "A Creators API da Amazon ainda não está conectada. Salve o Credential ID e o Secret quando sua conta for aprovada." : message, credentialsRequired }, { status: credentialsRequired ? 412 : 502 });
  }
}
