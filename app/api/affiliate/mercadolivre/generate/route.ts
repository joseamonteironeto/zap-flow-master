import { NextResponse } from "next/server";
import { generateMercadoLivreLinks } from "@/lib/mercadolivre-affiliate";

const allowedHosts = new Set(["www.mercadolivre.com.br", "produto.mercadolivre.com.br", "mercadolivre.com.br"]);

function validProductUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.has(url.hostname) && /\bMLB-?\d{7,}\b/i.test(url.pathname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { urls?: unknown; tag?: unknown; cookies?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean)
    : [];
  const tag = typeof body?.tag === "string" ? body.tag.trim() : "";

  if (!urls.length || urls.length > 20 || urls.some((url) => !validProductUrl(url))) {
    return NextResponse.json({ ok: false, message: "Envie de 1 a 20 URLs válidas de produtos do Mercado Livre." }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{2,50}$/i.test(tag)) {
    return NextResponse.json({ ok: false, message: "A tag de afiliado não é válida." }, { status: 400 });
  }

  const result = await generateMercadoLivreLinks(urls, tag, body?.cookies);
  if (!result.ok) return NextResponse.json(result);
  return NextResponse.json({
    ...result,
    message: `${result.results.length} link(s) gerado(s) com a tag ${tag}.`,
    results: result.results.map((item) => ({
      originUrl: item.origin_url || "",
      shortUrl: item.short_url || "",
      longUrl: item.long_url || "",
      created: Boolean(item.created),
    })),
  });
}
