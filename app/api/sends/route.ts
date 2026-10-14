import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!env.DB) return NextResponse.json({ history: [], summary: [] });
  try {
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").trim().slice(0, 100);
    const pattern = `%${search}%`;
    const where = search ? "WHERE product_id LIKE ? OR product_title LIKE ? OR destination_name LIKE ?" : "";
    const bindings = search ? [pattern, pattern, pattern] : [];
    const [history, summary] = await Promise.all([
      env.DB.prepare(`SELECT id, product_id AS productId, product_title AS productTitle, product_url AS productUrl,
        destination_jid AS destinationJid, destination_name AS destinationName, monitor_id AS monitorId,
        send_mode AS sendMode, sent_at AS sentAt FROM offer_sends ${where} ORDER BY sent_at DESC LIMIT 300`)
        .bind(...bindings).all(),
      env.DB.prepare(`SELECT product_id AS productId, MAX(product_title) AS productTitle,
        COUNT(*) AS sendCount, COUNT(DISTINCT destination_jid) AS groupCount, MAX(sent_at) AS lastSentAt
        FROM offer_sends ${where} GROUP BY product_id ORDER BY lastSentAt DESC LIMIT 200`)
        .bind(...bindings).all(),
    ]);
    return NextResponse.json({ history: history.results, summary: summary.results });
  } catch (error) {
    console.error("sends.list", error);
    return NextResponse.json({ error: "O histórico de envios não pôde ser carregado." }, { status: 500 });
  }
}
