import { NextResponse } from "next/server";

const endpoint = "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";
const allowedHosts = new Set([
  "www.mercadolivre.com.br",
  "produto.mercadolivre.com.br",
  "mercadolivre.com.br",
]);

type BrowserCookie = {
  name?: unknown;
  value?: unknown;
  domain?: unknown;
  expirationDate?: unknown;
};

type GeneratedLink = {
  origin_url?: string;
  short_url?: string;
  long_url?: string;
  created?: boolean;
};

function validProductUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
}

function decodeResponse(value: string) {
  try {
    return JSON.parse(value) as { status?: number; urls?: GeneratedLink[]; message?: string };
  } catch {
    try {
      return JSON.parse(atob(value)) as { status?: number; urls?: GeneratedLink[]; message?: string };
    } catch {
      return null;
    }
  }
}

function parseCookies(value: unknown) {
  if (typeof value !== "string" || value.length > 100_000) return null;
  let parsed: BrowserCookie[];
  try {
    parsed = JSON.parse(value) as BrowserCookie[];
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 200) return null;

  const now = Date.now() / 1000;
  const valid = parsed.filter((item) => {
    if (typeof item.name !== "string" || typeof item.value !== "string") return false;
    if (/[;\r\n]/.test(item.name) || /[\r\n]/.test(item.value)) return false;
    const domain = typeof item.domain === "string" ? item.domain.replace(/^\./, "") : "";
    if (domain !== "mercadolivre.com.br" && domain !== "www.mercadolivre.com.br") return false;
    if (typeof item.expirationDate === "number" && item.expirationDate < now) return false;
    return true;
  });
  if (!valid.length) return null;
  const header = valid.map((item) => `${item.name}=${item.value}`).join("; ");
  return header.length <= 32_000 ? { header, count: valid.length } : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { urls?: unknown; tag?: unknown; cookies?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean)
    : [];
  const tag = typeof body?.tag === "string" ? body.tag.trim() : "";
  const session = parseCookies(body?.cookies);

  if (!urls.length || urls.length > 20 || urls.some((url) => !validProductUrl(url))) {
    return NextResponse.json({ ok: false, message: "Envie de 1 a 20 URLs válidas de produtos do Mercado Livre." }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{2,50}$/i.test(tag)) {
    return NextResponse.json({ ok: false, message: "A tag de afiliado não é válida." }, { status: 400 });
  }
  if (!session) {
    return NextResponse.json({ ok: false, message: "Cole o JSON de cookies exportado da sua sessão do Mercado Livre." }, { status: 400 });
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: session.header,
        Origin: "https://www.mercadolivre.com.br",
        Referer: "https://www.mercadolivre.com.br/afiliados/linkbuilder",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
        "X-CSRF-Token": crypto.randomUUID(),
      },
      body: JSON.stringify({ urls, tag }),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    const responseText = await upstream.text();
    const decoded = decodeResponse(responseText);

    if (upstream.ok && decoded?.status === 200 && Array.isArray(decoded.urls)) {
      return NextResponse.json({
        ok: true,
        connected: true,
        cookieCount: session.count,
        upstreamStatus: upstream.status,
        message: `${decoded.urls.length} link(s) gerado(s) com a tag ${tag}.`,
        results: decoded.urls.map((item) => ({
          originUrl: item.origin_url || "",
          shortUrl: item.short_url || "",
          longUrl: item.long_url || "",
          created: Boolean(item.created),
        })),
      });
    }

    const expired = upstream.status === 401 || upstream.status === 403 || upstream.status === 302;
    return NextResponse.json({
      ok: false,
      connected: false,
      upstreamStatus: upstream.status,
      message: expired
        ? "A sessão foi recusada ou expirou. Exporte cookies novos com sua conta do Mercado Livre conectada."
        : decoded?.message || "O Mercado Livre recebeu a chamada, mas não gerou os links.",
    }, { status: 200 });
  } catch {
    return NextResponse.json({
      ok: false,
      connected: false,
      message: "Não foi possível acessar o Mercado Livre agora. Tente novamente em alguns instantes.",
    }, { status: 200 });
  }
}
