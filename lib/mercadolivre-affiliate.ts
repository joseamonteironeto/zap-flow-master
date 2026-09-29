const endpoint = "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";

type BrowserCookie = {
  name?: unknown;
  value?: unknown;
  domain?: unknown;
  expirationDate?: unknown;
};

export type GeneratedLink = {
  origin_url?: string;
  short_url?: string;
  long_url?: string;
  created?: boolean;
};

export function parseMercadoLivreCookies(value: unknown) {
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

export async function generateMercadoLivreLinks(urls: string[], tag: string, cookies: unknown) {
  const session = parseMercadoLivreCookies(cookies);
  if (!session) return { ok: false as const, connected: false, message: "A sessão do Mercado Livre não foi informada, é inválida ou expirou." };

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
    const decoded = decodeResponse(await upstream.text());
    if (upstream.ok && decoded?.status === 200 && Array.isArray(decoded.urls)) {
      return { ok: true as const, connected: true, cookieCount: session.count, upstreamStatus: upstream.status, results: decoded.urls };
    }
    const expired = upstream.status === 401 || upstream.status === 403 || upstream.status === 302;
    return {
      ok: false as const,
      connected: false,
      upstreamStatus: upstream.status,
      message: expired ? "A sessão foi recusada ou expirou. Exporte cookies novos." : decoded?.message || "O Mercado Livre não gerou o link.",
    };
  } catch {
    return { ok: false as const, connected: false, message: "Não foi possível acessar o Mercado Livre agora." };
  }
}
