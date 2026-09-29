"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  CircleAlert,
  Copy,
  Cookie,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Link2,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

type Group = {
  JID: string;
  Name: string;
  Topic?: string;
  ParticipantCount?: number;
  OwnerCanSendMessage?: boolean;
  image_preview_url?: string;
};

type Role = "source" | "destination" | "ignored";

type GroupConfig = {
  jid: string;
  name: string;
  role: Role;
  category: string;
  destinationJid: string;
  enabled: boolean;
};

type AffiliateSettings = {
  amazonTrackingId: string;
  mercadoLivreLabel: string;
  redirectDomain: string;
  amazonEnabled: boolean;
  mercadoLivreEnabled: boolean;
};

type MercadoLivreTestResult = {
  ok: boolean;
  connected?: boolean;
  cookieCount?: number;
  upstreamStatus?: number;
  message: string;
  results?: Array<{
    originUrl: string;
    shortUrl: string;
    longUrl: string;
    created: boolean;
  }>;
};

type ModelContext = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => Promise<unknown>;
  }, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

const categories = [
  ["geral", "Ofertas gerais"],
  ["tecnologia", "Celulares e tecnologia"],
  ["games", "Games"],
  ["casa", "Casa e cozinha"],
  ["eletro", "Eletrodomésticos"],
  ["tv", "TVs"],
  ["pc", "PCs e notebooks"],
] as const;

const emptyAffiliate: AffiliateSettings = {
  amazonTrackingId: "",
  mercadoLivreLabel: "",
  redirectDomain: "",
  amazonEnabled: true,
  mercadoLivreEnabled: false,
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function roleLabel(role: Role) {
  if (role === "source") return "Monitorar";
  if (role === "destination") return "Meu grupo";
  return "Ignorar";
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [configs, setConfigs] = useState<Record<string, GroupConfig>>({});
  const [affiliate, setAffiliate] = useState<AffiliateSettings>(emptyAffiliate);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [testUrl, setTestUrl] = useState("https://www.amazon.com.br/dp/B0D1234567");
  const [mlTestUrls, setMlTestUrls] = useState("https://produto.mercadolivre.com.br/MLB-1010954920");
  const [mlSessionCookies, setMlSessionCookies] = useState("");
  const [mlCookiesVisible, setMlCookiesVisible] = useState(false);
  const [mlTestLoading, setMlTestLoading] = useState(false);
  const [mlTestResult, setMlTestResult] = useState<MercadoLivreTestResult | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [groupsResponse, configResponse, affiliateResponse] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/config"),
        fetch("/api/affiliate"),
      ]);
      const groupsData = await groupsResponse.json() as { groups?: Group[]; demo?: boolean; error?: string };
      const configData = await configResponse.json() as { configs?: GroupConfig[] };
      const affiliateData = await affiliateResponse.json() as { settings?: Partial<AffiliateSettings> };
      if (!groupsResponse.ok) throw new Error(groupsData.error || "Não foi possível carregar os grupos.");
      const nextGroups = groupsData.groups || [];
      const saved = new Map<string, GroupConfig>((configData.configs || []).map((item: GroupConfig) => [item.jid, item]));
      const merged: Record<string, GroupConfig> = {};
      for (const group of nextGroups) {
        const item = saved.get(group.JID);
        merged[group.JID] = item ? { ...item, enabled: Boolean(item.enabled), destinationJid: item.destinationJid || "" } : {
          jid: group.JID,
          name: group.Name || group.JID,
          role: "ignored",
          category: "geral",
          destinationJid: "",
          enabled: false,
        };
      }
      setGroups(nextGroups);
      setConfigs(merged);
      setAffiliate({ ...emptyAffiliate, ...(affiliateData.settings || {}), amazonEnabled: Boolean(affiliateData.settings?.amazonEnabled ?? true), mercadoLivreEnabled: Boolean(affiliateData.settings?.mercadoLivreEnabled) });
      setDemo(Boolean(groupsData.demo));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool || groups.length === 0) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "configure_group_route",
      title: "Configurar rota de grupo",
      description: "Define um grupo existente como fonte, destino ou ignorado e atualiza sua categoria no painel.",
      inputSchema: {
        type: "object",
        properties: {
          jid: { type: "string" },
          role: { type: "string", enum: ["source", "destination", "ignored"] },
          category: { type: "string", enum: categories.map(([value]) => value) },
          destinationJid: { type: "string" },
        },
        required: ["jid", "role", "category"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = input as Partial<GroupConfig>;
        const group = groups.find((item) => item.JID === value.jid);
        if (!group || !["source", "destination", "ignored"].includes(value.role || "")) throw new Error("Grupo ou função inválida.");
        const next: GroupConfig = {
          ...configs[group.JID],
          role: value.role as Role,
          category: value.category || "geral",
          destinationJid: value.destinationJid || "",
          enabled: value.role !== "ignored",
        };
        setConfigs((current) => ({ ...current, [group.JID]: next }));
        return { jid: group.JID, name: group.Name, role: next.role, category: next.category, destinationJid: next.destinationJid };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [groups, configs]);

  const destinationGroups = useMemo(() => groups.filter((group) => configs[group.JID]?.role === "destination"), [groups, configs]);
  const filteredGroups = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return groups;
    return groups.filter((group) => `${group.Name} ${group.Topic || ""} ${group.JID}`.toLowerCase().includes(value));
  }, [groups, search]);

  const stats = useMemo(() => ({
    sources: Object.values(configs).filter((item) => item.role === "source" && item.enabled).length,
    destinations: Object.values(configs).filter((item) => item.role === "destination").length,
    routes: Object.values(configs).filter((item) => item.role === "source" && item.destinationJid).length,
  }), [configs]);
  const statItems = [
    { value: stats.sources, label: "fontes ativas", Icon: Activity },
    { value: stats.destinations, label: "meus grupos", Icon: MessageCircleMore },
    { value: stats.routes, label: "rotas prontas", Icon: ArrowRight },
  ];

  const convertedAmazonUrl = useMemo(() => {
    const asin = testUrl.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase();
    if (!asin || !affiliate.amazonTrackingId) return "";
    return `https://www.amazon.com.br/dp/${asin}?tag=${encodeURIComponent(affiliate.amazonTrackingId)}`;
  }, [testUrl, affiliate.amazonTrackingId]);

  function patchConfig(jid: string, patch: Partial<GroupConfig>) {
    setConfigs((current) => ({ ...current, [jid]: { ...current[jid], ...patch } }));
  }

  async function saveGroups() {
    setSaving(true);
    try {
      const response = await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ configs: Object.values(configs) }) });
      if (!response.ok) throw new Error();
      toast.success("Organização dos grupos salva.");
    } catch {
      toast.error("Não foi possível salvar os grupos.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAffiliate() {
    setSaving(true);
    try {
      const response = await fetch("/api/affiliate", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(affiliate) });
      if (!response.ok) throw new Error();
      toast.success("Configurações de afiliado salvas.");
    } catch {
      toast.error("Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function testMercadoLivreRequest() {
    const urls = mlTestUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    if (!urls.length) {
      toast.error("Cole pelo menos um link de produto.");
      return;
    }
    if (!mlSessionCookies.trim()) {
      toast.error("Cole os cookies da sessão do Mercado Livre.");
      return;
    }
    setMlTestLoading(true);
    setMlTestResult(null);
    try {
      const response = await fetch("/api/affiliate/mercadolivre/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, tag: affiliate.mercadoLivreLabel.trim() || "promozap", cookies: mlSessionCookies }),
      });
      const result = await response.json() as MercadoLivreTestResult;
      setMlTestResult(result);
      if (result.ok) toast.success("Links gerados com sua sessão do Mercado Livre.");
      else toast.warning(result.message);
    } catch {
      setMlTestResult({ ok: false, message: "O painel não conseguiu concluir o teste agora." });
      toast.error("Não foi possível executar o teste.");
    } finally {
      setMlTestLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8f5] text-[#071416]">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#00c853] shadow-[0_6px_20px_rgba(0,200,83,.22)]">
              <Image src="/favicon.svg" width={34} height={34} alt="" />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-[-0.03em]">Promozap</p>
              <p className="text-xs text-[#66736c]">Operação de grupos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#dce7df] bg-[#f8fbf9] px-3 py-2 text-xs font-semibold text-[#287249]">
            <span className="h-2 w-2 rounded-full bg-[#00c853] shadow-[0_0_0_4px_rgba(0,200,83,.12)]" />
            WhatsApp conectado
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-[#071416] p-4 text-white shadow-[0_18px_50px_rgba(7,20,22,.16)]">
            <p className="px-2 pb-3 text-xs font-semibold text-white/50">PAINEL PRIVADO</p>
            <nav className="space-y-1 text-sm">
              <button onClick={() => setActiveTab("groups")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold ${activeTab === "groups" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/7"}`}><UsersRound className={`size-4 ${activeTab === "groups" ? "text-[#25e83f]" : ""}`} /> Grupos</button>
              <button onClick={() => setActiveTab("affiliates")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold ${activeTab === "affiliates" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/7"}`}><Link2 className={`size-4 ${activeTab === "affiliates" ? "text-[#25e83f]" : ""}`} /> Afiliados</button>
              <button onClick={() => setActiveTab("mercadolivre")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold ${activeTab === "mercadolivre" ? "bg-[#ffe600] text-[#231f00]" : "text-white/70 hover:bg-white/7"}`}><KeyRound className="size-4" /> Gerador ML</button>
              <button onClick={() => setActiveTab("automation")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold ${activeTab === "automation" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/7"}`}><Bot className={`size-4 ${activeTab === "automation" ? "text-[#25e83f]" : ""}`} /> Automação</button>
            </nav>
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center gap-3 rounded-xl bg-[#00c853]/12 p-3">
                <ShieldCheck className="size-5 text-[#25e83f]" />
                <p className="text-xs leading-5 text-white/72">Credenciais protegidas no servidor.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-sm font-semibold text-[#008f3d]">Central de distribuição</p>
              <h1 className="max-w-2xl text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Escolha de onde as ofertas vêm e para onde elas vão.</h1>
            </div>
            <Button onClick={() => void loadData()} variant="outline" className="h-11 rounded-xl bg-white"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar grupos</Button>
          </div>

          <div className="mb-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#dce7df] bg-white shadow-[0_10px_30px_rgba(7,20,22,.05)]">
            {statItems.map(({ value, label, Icon }, index) => (
              <div key={label} className={`px-3 py-4 sm:px-5 ${index ? "border-l border-[#e4ece7]" : ""}`}>
                <Icon className="mb-2 size-4 text-[#00a947]" />
                <p className="text-2xl font-extrabold tracking-tight">{value}</p>
                <p className="text-xs text-[#66736c] sm:text-sm">{label}</p>
              </div>
            ))}
          </div>

          {demo && <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>Prévia com grupos de exemplo. Na versão publicada, o painel usa os grupos da sua instância.</span></div>}
          {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
            <TabsList className="h-12 w-full justify-start overflow-x-auto rounded-xl border border-[#dce7df] bg-white p-1 sm:w-fit">
              <TabsTrigger value="groups" className="h-10 min-w-28 rounded-lg px-4">Grupos</TabsTrigger>
              <TabsTrigger value="affiliates" className="h-10 min-w-28 rounded-lg px-4">Afiliados</TabsTrigger>
              <TabsTrigger value="mercadolivre" className="h-10 min-w-32 rounded-lg px-4 data-[state=active]:bg-[#ffe600] data-[state=active]:text-[#231f00]">Gerador ML</TabsTrigger>
              <TabsTrigger value="automation" className="h-10 min-w-28 rounded-lg px-4">Automação</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" id="grupos">
              <Card className="gap-0 overflow-hidden border-[#dce7df] py-0 shadow-[0_10px_30px_rgba(7,20,22,.05)]">
                <CardHeader className="border-b border-[#e4ece7] px-4 py-5 sm:px-6">
                  <CardTitle className="text-xl">Seus grupos do WhatsApp</CardTitle>
                  <CardDescription>Marque os grupos-fonte, seus grupos de destino e a categoria de cada rota.</CardDescription>
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7a8880]" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar grupo pelo nome" className="h-11 rounded-xl border-[#dce7df] bg-[#f8fbf9] pl-10" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#66736c]"><LoaderCircle className="size-5 animate-spin text-[#00c853]" /> Carregando grupos...</div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><UsersRound className="mb-3 size-8 text-[#9bad9f]" /><p className="font-semibold">Nenhum grupo encontrado</p><p className="mt-1 text-sm text-[#66736c]">Confira a conexão ou tente outra busca.</p></div>
                  ) : filteredGroups.map((group) => {
                    const config = configs[group.JID];
                    if (!config) return null;
                    return (
                      <div key={group.JID} className="border-b border-[#edf2ee] p-4 last:border-0 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f9ee] text-sm font-extrabold text-[#008f3d]">{initials(group.Name || "G")}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-bold">{group.Name || "Grupo sem nome"}</p>
                              {config.role !== "ignored" && <Badge className={config.role === "source" ? "bg-[#e7f9ed] text-[#087c39]" : "bg-[#071416] text-white"}>{roleLabel(config.role)}</Badge>}
                            </div>
                            <p className="mt-1 truncate text-xs text-[#7a8880]">{group.Topic || `${group.ParticipantCount || 0} participantes`}</p>
                          </div>
                          <Switch checked={config.enabled} onCheckedChange={(enabled) => patchConfig(group.JID, { enabled })} disabled={config.role === "ignored"} aria-label={`Ativar ${group.Name}`} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <label className="space-y-1.5 text-xs font-semibold text-[#526159]">
                            Função do grupo
                            <NativeSelect value={config.role} onChange={(event) => patchConfig(group.JID, { role: event.target.value as Role, enabled: event.target.value !== "ignored" })} className="h-11 w-full rounded-xl bg-white text-sm">
                              <NativeSelectOption value="ignored">Ignorar</NativeSelectOption>
                              <NativeSelectOption value="source">Monitorar como fonte</NativeSelectOption>
                              <NativeSelectOption value="destination">Meu grupo de destino</NativeSelectOption>
                            </NativeSelect>
                          </label>
                          <label className="space-y-1.5 text-xs font-semibold text-[#526159]">
                            Categoria
                            <NativeSelect value={config.category} onChange={(event) => patchConfig(group.JID, { category: event.target.value })} disabled={config.role === "ignored"} className="h-11 w-full rounded-xl bg-white text-sm">
                              {categories.map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
                            </NativeSelect>
                          </label>
                          <label className="space-y-1.5 text-xs font-semibold text-[#526159]">
                            Enviar as ofertas para
                            <NativeSelect value={config.destinationJid} onChange={(event) => patchConfig(group.JID, { destinationJid: event.target.value })} disabled={config.role !== "source"} className="h-11 w-full rounded-xl bg-white text-sm">
                              <NativeSelectOption value="">Escolher meu grupo</NativeSelectOption>
                              {destinationGroups.map((destination) => <NativeSelectOption key={destination.JID} value={destination.JID}>{destination.Name}</NativeSelectOption>)}
                            </NativeSelect>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => void saveGroups()} disabled={saving} className="h-12 w-full rounded-xl bg-[#00c853] px-6 text-[#04140a] shadow-[0_10px_30px_rgba(0,200,83,.28)] hover:bg-[#16dc61] sm:w-auto">{saving ? <LoaderCircle className="animate-spin" /> : <Check />} Salvar organização</Button>
              </div>
            </TabsContent>

            <TabsContent value="affiliates" id="afiliados">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Card className="border-[#dce7df] shadow-[0_10px_30px_rgba(7,20,22,.05)]">
                  <CardHeader>
                    <CardTitle className="text-xl">Links de afiliado</CardTitle>
                    <CardDescription>Defina como os links encontrados serão convertidos antes da publicação.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-2xl border border-[#e2eae5] p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div><p className="font-bold">Amazon</p><p className="mt-1 text-sm text-[#66736c]">Conversão automática pelo ASIN do produto.</p></div>
                        <Switch checked={affiliate.amazonEnabled} onCheckedChange={(amazonEnabled) => setAffiliate((value) => ({ ...value, amazonEnabled }))} aria-label="Ativar Amazon" />
                      </div>
                      <label className="mt-4 block space-y-2 text-sm font-semibold">Tracking ID da Amazon<Input value={affiliate.amazonTrackingId} onChange={(event) => setAffiliate((value) => ({ ...value, amazonTrackingId: event.target.value }))} placeholder="Ex.: promozap-20" className="h-12 rounded-xl" /></label>
                      <p className="mt-2 text-xs leading-5 text-[#66736c]">O painel encontra o ASIN e monta um link limpo com o seu Tracking ID.</p>
                    </div>

                    <div className="rounded-2xl border border-[#e2eae5] p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div><p className="font-bold">Mercado Livre</p><p className="mt-1 text-sm text-[#66736c]">Identificação do MLB ID e rastreamento da campanha.</p></div>
                        <Switch checked={affiliate.mercadoLivreEnabled} onCheckedChange={(mercadoLivreEnabled) => setAffiliate((value) => ({ ...value, mercadoLivreEnabled }))} aria-label="Ativar Mercado Livre" />
                      </div>
                      <label className="mt-4 block space-y-2 text-sm font-semibold">Etiqueta da campanha<Input value={affiliate.mercadoLivreLabel} onChange={(event) => setAffiliate((value) => ({ ...value, mercadoLivreLabel: event.target.value }))} placeholder="Ex.: promozap-whatsapp" className="h-12 rounded-xl" /></label>
                      <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" /><p>O Mercado Livre não usa um código simples na URL. O painel prepara o produto, mas o link precisa vir do Gerador oficial até existir uma integração autorizada.</p></div>
                    </div>

                    <label className="block space-y-2 text-sm font-semibold">Seu domínio de redirecionamento<Input value={affiliate.redirectDomain} onChange={(event) => setAffiliate((value) => ({ ...value, redirectDomain: event.target.value }))} placeholder="https://go.promozap.com.br" className="h-12 rounded-xl" /></label>
                    <Button onClick={() => void saveAffiliate()} disabled={saving} className="h-12 w-full rounded-xl bg-[#00c853] text-[#04140a] hover:bg-[#16dc61] sm:w-auto">{saving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Salvar afiliados</Button>
                  </CardContent>
                </Card>

                <Card className="h-fit border-[#dce7df] bg-[#071416] text-white shadow-[0_18px_50px_rgba(7,20,22,.16)]">
                  <CardHeader><CardTitle className="text-lg">Testar conversão</CardTitle><CardDescription className="text-white/55">Cole um link direto da Amazon para conferir.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <Input value={testUrl} onChange={(event) => setTestUrl(event.target.value)} className="h-12 rounded-xl border-white/15 bg-white/8 text-white" />
                    <div className="min-h-24 rounded-xl border border-white/10 bg-white/6 p-4">
                      <p className="text-xs font-semibold text-white/45">RESULTADO</p>
                      <p className="mt-2 break-all text-sm leading-6 text-[#7cff94]">{convertedAmazonUrl || "Informe um ASIN válido e seu Tracking ID."}</p>
                    </div>
                    {convertedAmazonUrl && <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(convertedAmazonUrl); toast.success("Link copiado."); }} className="h-11 w-full border-white/15 bg-white/8 text-white hover:bg-white/14"><Copy /> Copiar resultado</Button>}
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            <TabsContent value="mercadolivre" id="mercadolivre">
              <div className="overflow-hidden rounded-2xl border border-[#d5c300] bg-[#ffe600] shadow-[0_14px_40px_rgba(93,82,0,.14)]">
                <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#231f00] text-[#ffe600]"><KeyRound className="size-5" /></div>
                    <div><h2 className="text-xl font-extrabold tracking-[-0.03em] text-[#231f00]">Gerador Mercado Livre</h2><p className="mt-1 text-sm text-[#655b00]">Converta links usando sua tag e sua sessão de afiliado.</p></div>
                  </div>
                  <div className={`flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${mlTestResult?.connected ? "bg-[#0b6b35] text-white" : "bg-[#231f00]/10 text-[#4c4500]"}`}>
                    <span className={`size-2 rounded-full ${mlTestResult?.connected ? "bg-[#62ef8b]" : "bg-[#8b800e]"}`} />
                    {mlTestResult?.connected ? "Sessão conectada" : mlSessionCookies ? "Sessão pronta" : "Aguardando cookies"}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.72fr)]">
                <Card className="border-[#dce7df] shadow-[0_10px_30px_rgba(7,20,22,.05)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Cookie className="size-5 text-[#008f3d]" /> Credenciais da sessão</CardTitle>
                    <CardDescription>A tag pode ficar salva. Os cookies ficam somente nesta página e são apagados quando ela é fechada.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <label className="block space-y-2 text-sm font-semibold">Tag de afiliado<Input value={affiliate.mercadoLivreLabel} onChange={(event) => setAffiliate((value) => ({ ...value, mercadoLivreLabel: event.target.value }))} placeholder="promozap" className="h-12 rounded-xl" /></label>
                    <label className="block space-y-2 text-sm font-semibold">
                      <span className="flex items-center justify-between gap-3"><span>Cookies da sessão</span><button type="button" onClick={() => setMlCookiesVisible((value) => !value)} className="flex items-center gap-1.5 text-xs font-semibold text-[#008f3d] hover:underline">{mlCookiesVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{mlCookiesVisible ? "Ocultar" : "Mostrar"}</button></span>
                      <Textarea value={mlSessionCookies} onChange={(event) => { setMlSessionCookies(event.target.value); setMlTestResult(null); }} rows={10} spellCheck={false} placeholder={'Cole aqui o JSON exportado: [{ "domain": "...", "name": "...", "value": "..." }]'} className={`min-h-56 resize-y rounded-xl font-mono text-xs leading-5 ${mlCookiesVisible ? "text-[#071416]" : "text-transparent caret-[#071416] selection:bg-[#bdecca]"}`} />
                    </label>
                    <div className="flex gap-2 rounded-xl border border-[#bfe9cc] bg-[#ebfaef] p-3 text-sm leading-6 text-[#356044]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#008f3d]" /><p>Use apenas cookies da sua conta. Eles são enviados ao Mercado Livre somente ao gerar o link e não são salvos no painel.</p></div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button onClick={() => void saveAffiliate()} disabled={saving} variant="outline" className="h-11 rounded-xl bg-white">{saving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Salvar tag</Button>
                      {mlSessionCookies && <Button onClick={() => { setMlSessionCookies(""); setMlTestResult(null); }} variant="ghost" className="h-11 rounded-xl text-[#8b2e1b]">Limpar sessão</Button>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-fit border-[#dce7df] bg-[#071416] text-white shadow-[0_18px_50px_rgba(7,20,22,.16)]">
                  <CardHeader><CardTitle className="text-xl">Produtos para converter</CardTitle><CardDescription className="text-white/55">Cole até 20 links, um em cada linha.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea value={mlTestUrls} onChange={(event) => setMlTestUrls(event.target.value)} rows={7} placeholder="https://produto.mercadolivre.com.br/MLB-..." className="min-h-44 resize-y rounded-xl border-white/15 bg-white/8 text-white placeholder:text-white/35" />
                    <Button onClick={() => void testMercadoLivreRequest()} disabled={mlTestLoading} className="h-12 w-full rounded-xl bg-[#ffe600] font-bold text-[#231f00] hover:bg-[#fff05a]">{mlTestLoading ? <LoaderCircle className="animate-spin" /> : <Link2 />} Gerar links de afiliado</Button>
                    <Button asChild variant="outline" className="h-11 w-full rounded-xl border-white/15 bg-white/8 text-white hover:bg-white/14"><a href="https://www.mercadolivre.com.br/afiliados/linkbuilder#hub" target="_blank" rel="noreferrer"><ExternalLink /> Abrir gerador oficial</a></Button>
                  </CardContent>
                </Card>

                {mlTestResult && (
                  <Card className={`xl:col-span-2 ${mlTestResult.ok ? "border-[#8fd9a5] bg-[#effbf2]" : "border-[#e4b5a8] bg-[#fff3ef]"}`}>
                    <CardHeader><CardTitle className="text-lg">{mlTestResult.ok ? "Links gerados" : `Não foi possível gerar${mlTestResult.upstreamStatus ? ` · HTTP ${mlTestResult.upstreamStatus}` : ""}`}</CardTitle><CardDescription>{mlTestResult.message}</CardDescription></CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {mlTestResult.results?.map((item) => (
                        <div key={item.originUrl} className="rounded-xl border border-black/8 bg-white p-4">
                          <p className="break-all text-xs leading-5 text-[#6b756e]">{item.originUrl}</p>
                          <a href={item.shortUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm font-bold text-[#087c39] underline underline-offset-2">{item.shortUrl}</a>
                          <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(item.longUrl || item.shortUrl); toast.success("Link copiado."); }} className="mt-4 rounded-lg bg-white"><Copy /> Copiar link completo</Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="automation" id="automacao">
              <Card className="border-[#dce7df] shadow-[0_10px_30px_rgba(7,20,22,.05)]">
                <CardHeader><CardTitle className="text-xl">Fluxo de automação</CardTitle><CardDescription>Visão do que acontecerá com cada mensagem recebida.</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-4">
                    {[
                      ["1", "Capturar", "Receber ofertas dos grupos marcados como fonte."],
                      ["2", "Validar", "Encontrar Amazon ou Mercado Livre e evitar duplicados."],
                      ["3", "Converter", "Aplicar seu link e montar o texto Promozap."],
                      ["4", "Publicar", "Enviar para o grupo escolhido na categoria."],
                    ].map(([step, title, description]) => (
                      <div key={step} className="relative rounded-2xl border border-[#e2eae5] bg-[#f8fbf9] p-4">
                        <span className="mb-6 flex size-8 items-center justify-center rounded-lg bg-[#071416] text-sm font-bold text-[#25e83f]">{step}</span>
                        <p className="font-bold">{title}</p><p className="mt-2 text-sm leading-6 text-[#66736c]">{description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#bfe9cc] bg-[#ebfaef] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3"><Settings2 className="mt-0.5 size-5 text-[#008f3d]" /><div><p className="font-bold">Pronto para receber o webhook</p><p className="mt-1 text-sm text-[#52705d]">A próxima etapa liga a captura de mensagens às regras configuradas neste painel.</p></div></div>
                    <Button variant="outline" className="h-11 rounded-xl border-[#91d7a8] bg-white"><ExternalLink /> Ver configuração</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
