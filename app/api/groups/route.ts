import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

const demoGroups = [
  { JID: "120363001@g.us", Name: "Ofertas Tech Brasil", Topic: "Celulares, notebooks e acessórios", ParticipantCount: 824, OwnerCanSendMessage: true },
  { JID: "120363002@g.us", Name: "Achadinhos Games", Topic: "Consoles e jogos", ParticipantCount: 516, OwnerCanSendMessage: true },
  { JID: "120363003@g.us", Name: "Promozap | Tecnologia", Topic: "Grupo oficial Promozap", ParticipantCount: 148, OwnerCanSendMessage: true },
  { JID: "120363004@g.us", Name: "Casa com Desconto", Topic: "Casa e eletrodomésticos", ParticipantCount: 632, OwnerCanSendMessage: true },
  { JID: "120363005@g.us", Name: "Promozap | Casa", Topic: "Grupo oficial Promozap", ParticipantCount: 93, OwnerCanSendMessage: true },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const baseUrl = env.UAZAPI_SERVER_URL?.replace(/\/$/, "");
  const token = env.UAZAPI_INSTANCE_TOKEN;

  if (!baseUrl || !token) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ groups: demoGroups, demo: true });
    }
    return NextResponse.json({ error: "A conexão com o WhatsApp ainda não foi configurada." }, { status: 503 });
  }

  try {
    const response = await fetch(`${baseUrl}/group/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ search, limit: 500, offset: 0, noParticipants: true, force: false }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível carregar os grupos agora.", providerStatus: response.status }, { status: 502 });
    }

    const data = await response.json() as { groups?: unknown[]; pagination?: unknown };
    return NextResponse.json({ groups: Array.isArray(data.groups) ? data.groups : [], pagination: data.pagination });
  } catch {
    return NextResponse.json({ error: "A conexão com o WhatsApp não respondeu." }, { status: 502 });
  }
}
