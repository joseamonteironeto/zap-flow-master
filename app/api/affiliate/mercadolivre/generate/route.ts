import { NextResponse } from "next/server";

const endpoint = "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";
const allowedHosts = new Set([
  "www.mercadolivre.com.br",
  "produto.mercadolivre.com.br",
  "mercadolivre.com.br",
]);

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
    return JSON.parse(value) as { status?: number; urls?: GeneratedLink[] };
  } catch {
    try {
      return JSON.parse(atob(value)) as { status?: number; urls?: GeneratedLink[] };
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { urls?: unknown; tag?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean)
    : [];
  const tag = typeof body?.tag === "string" ? body.tag.trim() : "";

  if (!urls.length || urls.length > 20 || urls.some((url) => !validProductUrl(url))) {
    return NextResponse.json({ ok: false, message: "Envie de 1 a 20 URLs válidas de produtos do Mercado Livre." }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{2,50}$/i.test(tag)) {
    return NextResponse.json({ ok: false, message: "A etiqueta informada não é válida." }, { status: 400 });
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ urls, tag }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const responseText = await upstream.text();
    const decoded = decodeResponse(responseText);

    if (upstream.ok && decoded?.status === 200 && Array.isArray(decoded.urls)) {
      return NextResponse.json({
        ok: true,
        upstreamStatus: upstream.status,
        message: `O Mercado Livre devolveu ${decoded.urls.length} link(s).`,
        results: decoded.urls.map((item) => ({
          originUrl: item.origin_url || "",
          shortUrl: item.short_url || "",
          longUrl: item.long_url || "",
          created: Boolean(item.created),
        })),
      });
    }

    const message = upstream.status === 401 || upstream.status === 403
      ? "O endpoint exige uma sessão autenticada, CSRF e a validação do navegador do Mercado Livre. Nenhum cookie foi enviado por este painel."
      : "O endpoint respondeu, mas não aceitou a chamada sem a sessão do Gerador de Links.";
    return NextResponse.json({ ok: false, upstreamStatus: upstream.status, message }, { status: 200 });
  } catch {
    return NextResponse.json({
      ok: false,
      message: "A chamada não foi concluída. O Mercado Livre pode estar bloqueando acessos fora do navegador autenticado.",
    }, { status: 200 });
  }
}
