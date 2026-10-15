import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function finite(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function productCode(value: Record<string, unknown>) {
  const direct = clean(value.itemId || value.productId || value.id, 100).toUpperCase().match(/\bMLBU?-?\d{7,}\b/)?.[0];
  if (direct) return direct.replace(/^MLB-/, "MLB");
  const url = clean(value.url, 4000);
  return url.match(/\/(?:p|up)\/(MLBU?\d{7,})(?:[/?#]|$)/i)?.[1]?.toUpperCase()
    || url.match(/\b(MLB-?\d{7,})\b/i)?.[1]?.toUpperCase().replace("MLB-", "MLB")
    || "";
}

function fallbackId(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ml-${(hash >>> 0).toString(16)}`;
}

export async function GET(request: Request) {
  if (!env.DB) return NextResponse.json({ products: [], categories: [] });
  try {
    const url = new URL(request.url);
    const id = clean(url.searchParams.get("id"), 120);
    if (id) {
      const [product, history] = await Promise.all([
        env.DB.prepare(`SELECT id, store, category, product_code AS productCode, title, image_url AS imageUrl,
          product_url AS productUrl, current_price AS currentPrice, previous_price AS previousPrice,
          original_price AS originalPrice, discount_percentage AS discountPercentage,
          free_shipping AS freeShipping, rating, sold_text AS soldText, payload_json AS payloadJson,
          first_seen_at AS firstSeenAt, last_seen_at AS lastSeenAt, updated_at AS updatedAt
          FROM catalog_products WHERE id = ?`).bind(id).first(),
        env.DB.prepare(`SELECT price, original_price AS originalPrice, observed_at AS observedAt
          FROM catalog_price_history WHERE product_id = ? ORDER BY observed_at ASC LIMIT 500`).bind(id).all(),
      ]);
      return NextResponse.json({ product, history: history.results });
    }
    const search = clean(url.searchParams.get("search"), 100);
    const category = clean(url.searchParams.get("category"), 100);
    const clauses: string[] = [];
    const bindings: string[] = [];
    if (search) { clauses.push("(title LIKE ? OR product_code LIKE ?)"); bindings.push(`%${search}%`, `%${search}%`); }
    if (category && category !== "Todas") { clauses.push("category = ?"); bindings.push(category); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const [products, categories] = await Promise.all([
      env.DB.prepare(`SELECT id, store, category, product_code AS productCode, title, image_url AS imageUrl,
        product_url AS productUrl, current_price AS currentPrice, previous_price AS previousPrice,
        original_price AS originalPrice, discount_percentage AS discountPercentage,
        free_shipping AS freeShipping, rating, sold_text AS soldText,
        first_seen_at AS firstSeenAt, last_seen_at AS lastSeenAt, updated_at AS updatedAt
        FROM catalog_products ${where} ORDER BY last_seen_at DESC LIMIT 500`).bind(...bindings).all(),
      env.DB.prepare(`SELECT category, COUNT(*) AS total FROM catalog_products GROUP BY category ORDER BY category`).all(),
    ]);
    return NextResponse.json({ products: products.results, categories: categories.results });
  } catch (error) {
    console.error("catalog.products.list", error);
    return NextResponse.json({ error: "Não foi possível carregar os produtos catalogados." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const runtime = env as unknown as { UAZAPI_INSTANCE_TOKEN?: string };
  const adminToken = request.headers.get("x-promozap-admin-token") || "";
  if (!runtime.UAZAPI_INSTANCE_TOKEN || adminToken !== runtime.UAZAPI_INSTANCE_TOKEN) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const db = env.DB;
  if (!db) return NextResponse.json({ error: "Banco de dados indisponível." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { category?: unknown; products?: unknown };
  const category = clean(body.category, 100) || "Geral";
  const products = Array.isArray(body.products) ? body.products.slice(0, 1000) : [];
  const now = new Date().toISOString();
  let saved = 0;
  for (let start = 0; start < products.length; start += 40) {
    const statements = products.slice(start, start + 40).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const value = raw as Record<string, unknown>;
      const title = clean(value.title, 300);
      const productUrl = clean(value.url, 4000);
      if (!title || !productUrl) return [];
      const code = productCode(value);
      const id = code || fallbackId(`${title.toLocaleLowerCase("pt-BR")}|${productUrl.split("?")[0]}`);
      const price = finite(value.effectivePrice ?? value.price);
      const originalPrice = finite(value.originalPrice);
      const imageUrl = clean(value.imageUrl, 4000) || null;
      const discount = Math.max(0, Math.min(100, Math.round(Number(value.discountPercentage) || 0)));
      const rating = finite(value.rating);
      const soldText = clean(value.soldText, 120) || null;
      const payload = JSON.stringify(value).slice(0, 60_000);
      saved += 1;
      return [
        db.prepare(`INSERT INTO catalog_price_history (id, product_id, price, original_price, observed_at)
          SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (
            SELECT 1 FROM catalog_products WHERE id = ? AND current_price IS ? AND original_price IS ?
          )`).bind(crypto.randomUUID(), id, price, originalPrice, now, id, price, originalPrice),
        db.prepare(`INSERT INTO catalog_products
          (id, store, category, product_code, title, image_url, product_url, current_price, previous_price,
           original_price, discount_percentage, free_shipping, rating, sold_text, payload_json, first_seen_at, last_seen_at, updated_at)
          VALUES (?, 'mercadolivre', ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            category = excluded.category, product_code = COALESCE(excluded.product_code, catalog_products.product_code),
            title = excluded.title, image_url = COALESCE(excluded.image_url, catalog_products.image_url),
            product_url = excluded.product_url,
            previous_price = CASE WHEN excluded.current_price IS NOT catalog_products.current_price THEN catalog_products.current_price ELSE catalog_products.previous_price END,
            current_price = excluded.current_price, original_price = excluded.original_price,
            discount_percentage = excluded.discount_percentage, free_shipping = excluded.free_shipping,
            rating = excluded.rating, sold_text = excluded.sold_text, payload_json = excluded.payload_json,
            last_seen_at = excluded.last_seen_at, updated_at = excluded.updated_at`)
          .bind(id, category, code || null, title, imageUrl, productUrl, price, originalPrice, discount,
            value.freeShipping ? 1 : 0, rating, soldText, payload, now, now, now),
      ];
    });
    if (statements.length) await db.batch(statements);
  }
  return NextResponse.json({ ok: true, saved });
}
