import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { extractUrls, resolveProductUrl } from "@/lib/link-resolver";
import { generateMercadoLivreLinks } from "@/lib/mercadolivre-affiliate";

type ProductStatus = "found" | "converted" | "waiting_credentials" | "unsupported" | "error" | "sent";

function cleanText(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function fingerprint(store: string, productCode: string | null, sourceUrl: string) {
  const value = productCode ? `${store}:${productCode}` : `url:${sourceUrl}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

async function getAffiliateSettings() {
  if (!env.DB) return null;
  return env.DB.prepare(`
    SELECT amazon_tracking_id AS amazonTrackingId,
      mercado_livre_label AS mercadoLivreLabel,
      amazon_enabled AS amazonEnabled,
      mercado_livre_enabled AS mercadoLivreEnabled
    FROM affiliate_settings WHERE id = 1
  `).first<{ amazonTrackingId: string; mercadoLivreLabel: string; amazonEnabled: number; mercadoLivreEnabled: number }>();
}

async function saveProduct(product: {
  sourceUrl: string; resolvedUrl: string; affiliateUrl: string | null; store: string; productCode: string | null;
  title: string | null; imageUrl: string | null; status: ProductStatus; sourceGroup: string; destinationGroup: string;
  messageExcerpt: string; redirectCount: number; errorMessage: string | null;
}) {
  if (!env.DB) throw new Error("Banco de dados indisponível.");
  const now = new Date().toISOString();
  const key = await fingerprint(product.store, product.productCode, product.sourceUrl);
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO product_events
      (id, fingerprint, store, product_code, title, image_url, source_url, resolved_url, affiliate_url, status,
       source_group, destination_group, message_excerpt, redirect_count, occurrences, error_message, found_at, last_seen_at, sent_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, NULL, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET
      title = COALESCE(excluded.title, product_events.title),
      image_url = COALESCE(excluded.image_url, product_events.image_url),
      source_url = excluded.source_url,
      resolved_url = excluded.resolved_url,
      affiliate_url = COALESCE(excluded.affiliate_url, product_events.affiliate_url),
      status = excluded.status,
      source_group = COALESCE(excluded.source_group, product_events.source_group),
      destination_group = COALESCE(excluded.destination_group, product_events.destination_group),
      message_excerpt = excluded.message_excerpt,
      redirect_count = excluded.redirect_count,
      occurrences = product_events.occurrences + 1,
      error_message = excluded.error_message,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at
  `).bind(
    id, key, product.store, product.productCode, product.title, product.imageUrl, product.sourceUrl, product.resolvedUrl,
    product.affiliateUrl, product.status, product.sourceGroup || null, product.destinationGroup || null,
    product.messageExcerpt || null, product.redirectCount, product.errorMessage, now, now, now,
  ).run();
  return env.DB.prepare(`
    SELECT id, store, product_code AS productCode, title, image_url AS imageUrl, source_url AS sourceUrl,
      resolved_url AS resolvedUrl, affiliate_url AS affiliateUrl, status, source_group AS sourceGroup,
      destination_group AS destinationGroup, message_excerpt AS messageExcerpt, redirect_count AS redirectCount,
      occurrences, error_message AS errorMessage, found_at AS foundAt, last_seen_at AS lastSeenAt,
      sent_at AS sentAt, updated_at AS updatedAt
    FROM product_events WHERE fingerprint = ?
  `).bind(key).first();
}

export async function GET(request: Request) {
  if (!env.DB) return NextResponse.json({ products: [], totals: {} });
  const url = new URL(request.url);
  const store = cleanText(url.searchParams.get("store"), 30);
  const status = cleanText(url.searchParams.get("status"), 30);
  const search = cleanText(url.searchParams.get("search"), 100);
  const clauses: string[] = [];
  const values: string[] = [];
  if (["amazon", "mercadolivre", "unknown"].includes(store)) { clauses.push("store = ?"); values.push(store); }
  if (["found", "converted", "waiting_credentials", "unsupported", "error", "sent"].includes(status)) { clauses.push("status = ?"); values.push(status); }
  if (search) { clauses.push("(title LIKE ? OR product_code LIKE ? OR source_url LIKE ?)"); values.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [products, totals] = await Promise.all([
    env.DB.prepare(`
      SELECT id, store, product_code AS productCode, title, image_url AS imageUrl, source_url AS sourceUrl,
        resolved_url AS resolvedUrl, affiliate_url AS affiliateUrl, status, source_group AS sourceGroup,
        destination_group AS destinationGroup, message_excerpt AS messageExcerpt, redirect_count AS redirectCount,
        occurrences, error_message AS errorMessage, found_at AS foundAt, last_seen_at AS lastSeenAt,
        sent_at AS sentAt, updated_at AS updatedAt
      FROM product_events ${where} ORDER BY last_seen_at DESC LIMIT 100
    `).bind(...values).all(),
    env.DB.prepare(`SELECT status, COUNT(*) AS total FROM product_events GROUP BY status`).all(),
  ]);
  return NextResponse.json({ products: products.results, totals: Object.fromEntries(totals.results.map((row) => [String(row.status), Number(row.total)])) });
}

export async function POST(request: Request) {
  if (!env.DB) return NextResponse.json({ error: "Banco de dados indisponível." }, { status: 503 });
  const body = await request.json().catch(() => null) as { input?: unknown; sourceGroup?: unknown; destinationGroup?: unknown; cookies?: unknown } | null;
  const input = cleanText(body?.input, 8_000);
  const urls = extractUrls(input);
  if (!urls.length) return NextResponse.json({ error: "Nenhum link foi encontrado na mensagem." }, { status: 400 });
  const settings = await getAffiliateSettings();
  const sourceGroup = cleanText(body?.sourceGroup, 160);
  const destinationGroup = cleanText(body?.destinationGroup, 160);
  const messageExcerpt = input.slice(0, 500);
  const runtime = env as unknown as { MERCADOLIVRE_SESSION_COOKIES?: string };
  const cookies = typeof body?.cookies === "string" && body.cookies.trim() ? body.cookies : runtime.MERCADOLIVRE_SESSION_COOKIES;

  const saved = [];
  for (const sourceUrl of urls) {
    const resolved = await resolveProductUrl(sourceUrl);
    let affiliateUrl: string | null = null;
    let status: ProductStatus = resolved.store === "unknown" ? "unsupported" : "found";
    let errorMessage = resolved.errorMessage;

    if (resolved.store === "amazon" && resolved.productCode && settings?.amazonEnabled && settings.amazonTrackingId) {
      affiliateUrl = `https://www.amazon.com.br/dp/${resolved.productCode}?tag=${encodeURIComponent(settings.amazonTrackingId)}`;
      status = "converted";
      errorMessage = null;
    } else if (resolved.store === "mercadolivre" && resolved.productCode && settings?.mercadoLivreEnabled && settings.mercadoLivreLabel) {
      if (!cookies) {
        status = "waiting_credentials";
        errorMessage = "Informe os cookies da sessão do Mercado Livre para gerar o link.";
      } else {
        const generated = await generateMercadoLivreLinks([resolved.resolvedUrl], settings.mercadoLivreLabel, cookies);
        if (generated.ok && generated.results[0]) {
          affiliateUrl = generated.results[0].long_url || generated.results[0].short_url || null;
          status = affiliateUrl ? "converted" : "error";
          errorMessage = affiliateUrl ? null : "O Mercado Livre não retornou o link gerado.";
        } else {
          status = "waiting_credentials";
          errorMessage = generated.message;
        }
      }
    }

    saved.push(await saveProduct({ ...resolved, affiliateUrl, status, sourceGroup, destinationGroup, messageExcerpt, errorMessage }));
  }
  return NextResponse.json({ ok: true, products: saved });
}

export async function PATCH(request: Request) {
  if (!env.DB) return NextResponse.json({ error: "Banco de dados indisponível." }, { status: 503 });
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown; destinationGroup?: unknown } | null;
  const id = cleanText(body?.id, 80);
  const status = cleanText(body?.status, 30);
  if (!id || !["found", "converted", "waiting_credentials", "unsupported", "error", "sent"].includes(status)) {
    return NextResponse.json({ error: "Atualização inválida." }, { status: 400 });
  }
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE product_events SET status = ?, destination_group = COALESCE(?, destination_group),
      sent_at = CASE WHEN ? = 'sent' THEN ? ELSE sent_at END, updated_at = ? WHERE id = ?
  `).bind(status, cleanText(body?.destinationGroup, 160) || null, status, now, now, id).run();
  return NextResponse.json({ ok: true });
}
