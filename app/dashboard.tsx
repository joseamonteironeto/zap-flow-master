"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CircleAlert,
  Copy,
  Cookie,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Link2,
  LoaderCircle,
  MessageCircleMore,
  PackageSearch,
  LayoutTemplate,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Smartphone,
  ScrollText,
  UsersRound,
  Webhook,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

type WhatsAppSettings = {
  serverUrl: string;
  instanceToken: string;
};

type AutomationButtonSettings = {
  enabled: boolean;
  labels: string[];
};

type OfferTemplatePreset = {
  id: string;
  name: string;
  content: string;
};

type MercadoLivreTestResult = {
  ok: boolean;
  connected?: boolean;
  sessionRefreshed?: boolean;
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

type ProductRecord = {
  id: string;
  store: "amazon" | "mercadolivre" | "unknown";
  productCode?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  productDataJson?: string | null;
  dataSource?: string | null;
  sourceUrl: string;
  resolvedUrl?: string | null;
  affiliateUrl?: string | null;
  status: "found" | "converted" | "waiting_credentials" | "unsupported" | "error" | "sent";
  sourceGroup?: string | null;
  destinationGroup?: string | null;
  messageExcerpt?: string | null;
  redirectCount: number;
  occurrences: number;
  errorMessage?: string | null;
  foundAt: string;
  lastSeenAt: string;
  sentAt?: string | null;
  updatedAt?: string | null;
};

type AutomationLog = {
  id: string;
  level: "info" | "success" | "warning" | "error";
  stage: string;
  message: string;
  detailsJson?: string | null;
  groupJid?: string | null;
  productId?: string | null;
  createdAt: string;
};

type CatalogItem = {
  id: string;
  itemId?: string | null;
  catalogProductId?: string | null;
  title: string;
  imageUrl?: string | null;
  url?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  brand?: string | null;
  condition?: string | null;
  availability?: string | null;
  availableQuantity?: number | null;
  soldQuantity?: number | null;
  freeShipping?: boolean;
  seller?: string | number | null;
  categoryId?: string | null;
  officialStore?: string | null;
  discountPercentage?: number;
  full?: boolean;
  logisticType?: string | null;
  sellerId?: string | number | null;
  sellerReputation?: string | null;
  categoryName?: string | null;
  installments?: Record<string, unknown> | null;
  warranty?: string | null;
  attributes?: Array<Record<string, unknown>>;
  pictures?: Array<Record<string, unknown>>;
  saleTerms?: Array<Record<string, unknown>>;
  tags?: string[];
  bestSellerPosition?: number | null;
  promotionType?: string | null;
  promotionId?: string | null;
  priceId?: string | null;
  priceSource?: "sale_price" | "prices" | "buy_box" | "item" | "catalog" | "marketplace_page";
  priceUpdatedAt?: string | null;
  promotions?: Array<Record<string, unknown>>;
  coupon?: Record<string, unknown> | null;
  source?: "item" | "buy_box" | "best_seller" | "catalog" | "web_search";
  raw?: Record<string, unknown>;
  priceHistory?: Array<{ capturedAt: string; price: number; pixPrice?: number | null; standardPrice?: number | null; originalPrice?: number | null; couponPrice?: number | null }>;
  reviews?: Array<{ position?: number; rating?: number | null; country?: string | null; date?: string | null; text?: string | null; images?: string[]; videos?: string[]; media?: Array<{ type: "image" | "video"; url: string }>; usefulCount?: number }>;
  reviewsTotal?: number | null;
};

type MonitoredDeal = CatalogItem & {
  dealScore?: number;
  effectivePrice?: number | null;
  scoreReasons?: string[];
  detectedAt?: string;
};

type AffiliateHubOffer = MonitoredDeal & {
  affiliateEarningsPercentage?: number | null;
  rating?: number | null;
  soldText?: string | null;
  badge?: string | null;
  isNew?: boolean;
  isInternational?: boolean;
};

type MonitorSource = { id: string; url: string; weight: number };
type OfferMonitor = {
  id: string;
  name: string;
  kind: "hub" | "urls";
  destinationJid: string;
  intervalMinutes: number;
  autoSend: boolean;
  minRating: number;
  minDiscount: number;
  maxPages: number;
  ignoreInternational: boolean;
  sources: MonitorSource[];
};
type MonitorRuntime = {
  offers: AffiliateHubOffer[];
  loading: boolean;
  error: string;
  lastScan: string | null;
  selectedSource?: string;
};
type SendSummary = { productId: string; productTitle?: string | null; sendCount: number; groupCount: number; lastSentAt: string };
type SendHistoryRow = { id: string; productId: string; productTitle?: string | null; destinationJid: string; destinationName?: string | null; monitorId?: string | null; sendMode: string; sentAt: string };

const defaultOfferMonitors: OfferMonitor[] = [
  {
    id: "geral-hub", name: "Ofertas gerais", kind: "hub", destinationJid: "", intervalMinutes: 5,
    autoSend: false, minRating: 0, minDiscount: 0, maxPages: 10, ignoreInternational: true,
    sources: [{ id: "hub", url: "https://www.mercadolivre.com.br/afiliados/hub", weight: 100 }],
  },
  {
    id: "smartphones", name: "Celulares e Smartphones", kind: "urls", destinationJid: "", intervalMinutes: 5,
    autoSend: false, minRating: 4.7, minDiscount: 20, maxPages: 10, ignoreInternational: true,
    sources: [
      { id: "smartphones-busca", url: "https://lista.mercadolivre.com.br/smartphone?sb=all_mercadolibre", weight: 50 },
      { id: "smartphones-ofertas", url: "https://lista.mercadolivre.com.br/_Container_lp-smfs-geral-26_NoIndex_True", weight: 30 },
      { id: "carregadores", url: "https://lista.mercadolivre.com.br/carregador-celular?sb=all_mercadolibre", weight: 20 },
    ],
  },
];

const defaultOfferTemplate = `🔥 *{{titulo}}*

{{linha_preco_anterior}}✅ *Por: {{preco}}{{linha_desconto}}*
{{linha_cupom}}{{linha_frete}}
🛒 Garanta aqui: {{link}}`;

const offerTemplateVariables = [
  ["{{titulo}}", "Nome do produto"],
  ["{{preco}}", "Preço atual"],
  ["{{preco_anterior}}", "Preço anterior"],
  ["{{desconto}}", "Percentual de desconto"],
  ["{{economia}}", "Economia em reais"],
  ["{{cupom}}", "Código ou descrição do cupom"],
  ["{{link}}", "Link convertido da oferta"],
  ["{{loja}}", "Mercado Livre"],
  ["{{frete}}", "Frete grátis / envio Full"],
  ["{{vendedor}}", "Nome do vendedor"],
  ["{{marca}}", "Marca"],
  ["{{categoria}}", "Categoria"],
  ["{{id_produto}}", "ID do produto"],
  ["{{linha_preco_anterior}}", "Linha pronta, ocultada quando não houver preço anterior"],
  ["{{linha_desconto}}", "Trecho pronto, ocultado quando não houver desconto"],
  ["{{linha_cupom}}", "Linha pronta, ocultada quando não houver cupom"],
  ["{{linha_frete}}", "Linha pronta, ocultada quando não houver benefício de entrega"],
] as const;

type CatalogSearchResponse = {
  store?: "mercadolivre";
  query?: string;
  items?: CatalogItem[];
  total?: number;
  filters?: unknown;
  sorts?: Array<string | { id: string; name: string }>;
  error?: string;
  credentialsRequired?: boolean;
  warning?: string | null;
};

type LocalCollectorProduct = {
  ok?: boolean;
  needsUserAction?: boolean;
  userActionMessage?: string | null;
  capturedAt?: string;
  canonicalUrl?: string | null;
  url?: string | null;
  title?: string | null;
  itemId?: string | null;
  userProductId?: string | null;
  brand?: string | null;
  currency?: string | null;
  price?: number | null;
  pixPrice?: number | null;
  standardPrice?: number | null;
  originalPrice?: number | null;
  discountPercentage?: number | null;
  discountText?: string | null;
  coupon?: { text?: string | null; price?: number | null } | null;
  installments?: Record<string, unknown> | null;
  availability?: string | null;
  condition?: string | null;
  soldText?: string | null;
  availableQuantity?: number | null;
  stockText?: string | null;
  seller?: string | null;
  sellerSales?: string | null;
  officialStore?: string | null;
  deliveryText?: string | null;
  freeShipping?: boolean;
  ratingText?: string | null;
  imageUrl?: string | null;
  images?: string[];
  categories?: string[];
  highlighted?: string[];
  attributes?: Array<{ name?: string; value_name?: string }>;
  description?: string | null;
  personalizedContext?: Record<string, unknown>;
  structuredData?: Record<string, unknown>;
  priceHistory?: Array<{ capturedAt: string; price: number; pixPrice?: number | null; standardPrice?: number | null; originalPrice?: number | null; couponPrice?: number | null }>;
  reviews?: Array<{ position?: number; rating?: number | null; country?: string | null; date?: string | null; text?: string | null; images?: string[]; videos?: string[]; media?: Array<{ type: "image" | "video"; url: string }>; usefulCount?: number }>;
  reviewsTotal?: number | null;
};

type MercadoLivreCategory = { id: string; name: string };

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
  amazonEnabled: false,
  mercadoLivreEnabled: false,
};

const emptyWhatsApp: WhatsAppSettings = {
  serverUrl: "https://free.uazapi.com",
  instanceToken: "",
};

const defaultAutomationButtons: AutomationButtonSettings = {
  enabled: true,
  labels: ["VER OFERTA", "COMPRAR AGORA", "ADQUIRA JÁ", "LINK COM DESCONTO", "APROVEITAR OFERTA", "VER PROMOÇÃO"],
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function roleLabel(role: Role) {
  if (role === "source") return "Monitorar";
  if (role === "destination") return "Meu grupo";
  return "Ignorar";
}

function productStatusLabel(status: ProductRecord["status"]) {
  return ({
    found: "Identificado",
    converted: "Convertido",
    waiting_credentials: "Aguardando sessão",
    unsupported: "Não reconhecido",
    error: "Erro",
    sent: "Enviado",
  } as const)[status];
}

function productStatusClass(status: ProductRecord["status"]) {
  if (status === "sent") return "border-[#2d8a4b] bg-[#153520] text-[#8af3a5]";
  if (status === "converted") return "border-[#2b6840] bg-[#102a19] text-[#62ef8b]";
  if (status === "waiting_credentials") return "border-[#725f22] bg-[#2a230c] text-[#f4d35e]";
  if (status === "unsupported") return "border-[#4c5650] bg-[#202622] text-[#c0c9c3]";
  if (status === "error") return "border-[#764239] bg-[#2a1612] text-[#ff9b92]";
  return "border-[#365044] bg-[#17231c] text-[#b2c9ba]";
}

function renderWhatsAppLine(line: string, lineIndex: number) {
  const pattern = /(https?:\/\/[^\s]+|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
  const parts = line.split(pattern).filter((part) => part.length > 0);
  return (
    <span key={`line-${lineIndex}`}>
      {parts.map((part, index) => {
        const key = `${lineIndex}-${index}`;
        if (/^https?:\/\//i.test(part)) return <a key={key} href={part} target="_blank" rel="noreferrer" className="break-all text-[#53bdeb] underline decoration-[#427d91] underline-offset-2">{part}</a>;
        if (part.startsWith("*") && part.endsWith("*")) return <strong key={key} className="font-bold text-white">{part.slice(1, -1)}</strong>;
        if (part.startsWith("_") && part.endsWith("_")) return <em key={key}>{part.slice(1, -1)}</em>;
        if (part.startsWith("~") && part.endsWith("~")) return <s key={key} className="text-[#9caaa1]">{part.slice(1, -1)}</s>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={key} className="rounded bg-black/30 px-1 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
        return <span key={key}>{part}</span>;
      })}
    </span>
  );
}

function WhatsAppMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="whitespace-pre-wrap break-words text-[15px] leading-6 text-[#eef5f0]">
      {lines.map((line, index) => (
        <span key={index}>{renderWhatsAppLine(line, index)}{index < lines.length - 1 && <br />}</span>
      ))}
    </div>
  );
}

function parseProductData(value?: string | null) {
  if (!value) return null;
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
}

const productDataLabels: Record<string, string> = {
  id: "ID retornado", asin: "ASIN", siteId: "Site", title: "Título da API", name: "Nome", familyName: "Família",
  status: "Status", domainId: "Domínio", categoryId: "Categoria", sellerId: "Vendedor", officialStoreId: "Loja oficial",
  price: "Preço", basePrice: "Preço-base", originalPrice: "Preço original", currencyId: "Moeda", availableQuantity: "Quantidade disponível",
  soldQuantity: "Quantidade vendida", condition: "Condição", catalogProductId: "Produto de catálogo", parentId: "Produto-pai",
  permalink: "Página oficial", buyingMode: "Modo de compra", listingTypeId: "Tipo de anúncio", warranty: "Garantia", health: "Qualidade do anúncio",
  brand: "Marca", description: "Descrição", sku: "SKU", mpn: "MPN", gtin: "GTIN/EAN", category: "Categoria", color: "Cor",
  size: "Tamanho", material: "Material", model: "Modelo", apiStatus: "Situação da API", apiNote: "Observação da API",
};

function productDataValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function catalogFilterLabels(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => {
    const row = item as { name?: string; displayName?: string; id?: string };
    return row.name || row.displayName || row.id || "Filtro";
  }).filter(Boolean);
  if (value && typeof value === "object") {
    const rows = value as Record<string, { displayName?: string; id?: string }>;
    return Object.entries(rows).map(([key, item]) => item?.displayName || item?.id || key);
  }
  return [];
}

function formatMoney(value: number | null | undefined, currency = "BRL") {
  return value == null ? "Não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

async function retryOnce<T>(operation: () => Promise<T>, delayMs = 900) {
  try {
    return await operation();
  } catch {
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    return operation();
  }
}

function PriceHistoryPanel({ item }: { item: CatalogItem }) {
  const history = (item.priceHistory || []).filter((point) => Number.isFinite(point.price));
  const current = item.price ?? history.at(-1)?.price ?? null;
  const observed = history.map((point) => point.price);
  const reference = item.originalPrice && item.originalPrice > (current || 0) ? item.originalPrice : null;
  const values = [...observed, ...(reference ? [reference] : [])];
  if (!values.length) return null;
  const width = 820;
  const height = 220;
  const padX = 58;
  const padY = 26;
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min *= 0.95; max *= 1.05; }
  const gap = (max - min) * 0.14;
  min = Math.max(0, min - gap);
  max += gap;
  const x = (index: number) => history.length <= 1 ? width / 2 : padX + index * (width - padX * 2) / (history.length - 1);
  const y = (value: number) => height - padY - (value - min) * (height - padY * 2) / (max - min);
  const points = history.map((point, index) => [x(index), y(point.price)] as const);
  const line = points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
  const lowest = observed.length ? Math.min(...observed) : current;
  const highest = observed.length ? Math.max(...observed) : current;
  const saving = reference && current ? Math.round((1 - current / reference) * 100) : 0;
  return <section className="rounded-2xl border border-[#2b4934] bg-[#08120c] p-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-extrabold">Histórico de preço</h3><p className="mt-1 text-xs leading-5 text-[#8fa096]">{history.length > 1 ? `${history.length} medições reais salvas pelo coletor local.` : "Primeira medição salva. Novas consultas formarão a curva real."}</p></div>{saving > 0 && <Badge className="w-fit bg-[#153520] text-[#8af3a5]">Atual {saving}% abaixo da referência</Badge>}</div>
    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">{[["Atual", current], ["Menor observado", lowest], ["Maior observado", highest], ["Referência", reference]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[#27322b] bg-[#101812] p-3"><p className="text-xs text-[#718079]">{label}</p><p className="mt-1 font-extrabold text-[#62ef8b]">{formatMoney(value as number | null, item.currency || "BRL")}</p></div>)}</div>
    <div className="mt-4 overflow-hidden rounded-xl border border-[#27322b] bg-[#050a07] p-2"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de histórico de preço" className="h-auto w-full"><defs><linearGradient id="panelPriceArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#36d96b" stopOpacity=".32" /><stop offset="1" stopColor="#36d96b" stopOpacity="0" /></linearGradient></defs>{[0, .25, .5, .75, 1].map((step) => { const value = max - (max - min) * step; const gridY = padY + (height - padY * 2) * step; return <g key={step}><line x1={padX} y1={gridY} x2={width - padX} y2={gridY} stroke="#1f3526" /><text x="4" y={gridY + 4} fill="#91a696" fontSize="11">{formatMoney(value, item.currency || "BRL")}</text></g>; })}{reference && <><line x1={padX} y1={y(reference)} x2={width - padX} y2={y(reference)} stroke="#ffe600" strokeWidth="2" strokeDasharray="7 7" /><text x={width - 190} y={y(reference) - 7} fill="#c7bb42" fontSize="11">referência {formatMoney(reference, item.currency || "BRL")}</text></>}{points.length > 1 && <path d={`${line} L ${points.at(-1)?.[0]} ${height - padY} L ${points[0][0]} ${height - padY} Z`} fill="url(#panelPriceArea)" />}{line && <path d={line} fill="none" stroke="#36d96b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}{points.map((point, index) => <circle key={`${point[0]}-${index}`} cx={point[0]} cy={point[1]} r="5" fill="#050806" stroke="#69f08f" strokeWidth="4"><title>{new Date(history[index].capturedAt).toLocaleString("pt-BR")} — {formatMoney(history[index].price, item.currency || "BRL")}</title></circle>)}</svg></div>
  </section>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [configs, setConfigs] = useState<Record<string, GroupConfig>>({});
  const [affiliate, setAffiliate] = useState<AffiliateSettings>(emptyAffiliate);
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>(emptyWhatsApp);
  const [whatsappLoaded, setWhatsappLoaded] = useState(false);
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  const [whatsappTokenVisible, setWhatsappTokenVisible] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [mlSessionCookies, setMlSessionCookies] = useState("");
  const [mlCookiesLoaded, setMlCookiesLoaded] = useState(false);
  const [mlCookiesVisible, setMlCookiesVisible] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productTotals, setProductTotals] = useState<Record<string, number>>({});
  const [productSearch, setProductSearch] = useState("");
  const [productStatus, setProductStatus] = useState("all");
  const [catalogStore] = useState("mercadolivre");
  const [productsLoading, setProductsLoading] = useState(false);
  const [enrichingProductId, setEnrichingProductId] = useState("");
  const [productsError, setProductsError] = useState("");
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [webhookSettingUp, setWebhookSettingUp] = useState(false);
  const [webhookActive, setWebhookActive] = useState(false);
  const [buttonSettings, setButtonSettings] = useState<AutomationButtonSettings>(defaultAutomationButtons);
  const [buttonDraft, setButtonDraft] = useState("");
  const [buttonSettingsSaving, setButtonSettingsSaving] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogSearchStore] = useState<"mercadolivre" | "amazon">("mercadolivre");
  const [catalogSort, setCatalogSort] = useState("");
  const [catalogMinPrice, setCatalogMinPrice] = useState("");
  const [catalogMaxPrice, setCatalogMaxPrice] = useState("");
  const [catalogQuality, setCatalogQuality] = useState("all");
  const [catalogCategory, setCatalogCategory] = useState("");
  const [catalogSubcategory, setCatalogSubcategory] = useState("");
  const [mercadoLivreCategories, setMercadoLivreCategories] = useState<MercadoLivreCategory[]>([]);
  const [mercadoLivreSubcategories, setMercadoLivreSubcategories] = useState<MercadoLivreCategory[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<unknown>(null);
  const [catalogSorts, setCatalogSorts] = useState<Array<string | { id: string; name: string }>>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogSearching, setCatalogSearching] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogWarning, setCatalogWarning] = useState("");
  const [localCollectorUrl, setLocalCollectorUrl] = useState("http://127.0.0.1:8765");
  const [localCollectorToken, setLocalCollectorToken] = useState("");
  const [localCollectorInput, setLocalCollectorInput] = useState("https://www.mercadolivre.com.br/o-boticario-zaad-infinity-eau-de-parfum-95ml/up/MLBU4815336108");
  const [localCollectorConnected, setLocalCollectorConnected] = useState(false);
  const [localCollectorLoading, setLocalCollectorLoading] = useState(false);
  const [localCollectorError, setLocalCollectorError] = useState("");
  const [localCollectorResult, setLocalCollectorResult] = useState<LocalCollectorProduct | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [offerDestination, setOfferDestination] = useState("");
  const [offerIncludeImage, setOfferIncludeImage] = useState(true);
  const [offerPreparing, setOfferPreparing] = useState(false);
  const [offerSending, setOfferSending] = useState(false);
  const [offerTemplate, setOfferTemplate] = useState(defaultOfferTemplate);
  const [offerTemplates, setOfferTemplates] = useState<OfferTemplatePreset[]>([{ id: "padrao", name: "Padrão", content: defaultOfferTemplate }]);
  const [activeOfferTemplateId, setActiveOfferTemplateId] = useState("padrao");
  const [offerTemplateName, setOfferTemplateName] = useState("Padrão");
  const [templateSavedAt, setTemplateSavedAt] = useState<string | null>(null);
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselButtonLabel, setCarouselButtonLabel] = useState("VER OFERTA");
  const [promotionInput, setPromotionInput] = useState("");
  const [promotionItem, setPromotionItem] = useState<CatalogItem | null>(null);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotionRecordId, setPromotionRecordId] = useState("");
  const [promotionStore] = useState<"amazon" | "mercadolivre">("mercadolivre");
  const [promotionMessage, setPromotionMessage] = useState("");
  const [promotionIncludeImage, setPromotionIncludeImage] = useState(true);
  const [promotionGroups, setPromotionGroups] = useState<string[]>([]);
  const [promotionGroupSearch, setPromotionGroupSearch] = useState("");
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionSending, setPromotionSending] = useState(false);
  const [promotionDataWarning, setPromotionDataWarning] = useState("");
  const [promotionAffiliateError, setPromotionAffiliateError] = useState("");
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [monitoringCategory, setMonitoringCategory] = useState("Geral");
  const [monitoringIntervalMinutes, setMonitoringIntervalMinutes] = useState("2");
  const [monitoringMinDiscount, setMonitoringMinDiscount] = useState("20");
  const [monitoringCouponsOnly, setMonitoringCouponsOnly] = useState(false);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState("");
  const [monitoringDeals, setMonitoringDeals] = useState<MonitoredDeal[]>([]);
  const [monitoringLastScan, setMonitoringLastScan] = useState<string | null>(null);
  const monitoringSeen = useRef(new Set<string>());
  const [affiliateHubOffers, setAffiliateHubOffers] = useState<AffiliateHubOffer[]>([]);
  const [affiliateHubVisibleCount, setAffiliateHubVisibleCount] = useState(48);
  const [affiliateHubLoading, setAffiliateHubLoading] = useState(false);
  const [affiliateHubError, setAffiliateHubError] = useState("");
  const [affiliateHubLastScan, setAffiliateHubLastScan] = useState<string | null>(null);
  const [affiliateHubAutoSend, setAffiliateHubAutoSend] = useState(false);
  const [affiliateHubInterval, setAffiliateHubInterval] = useState("5");
  const [affiliateHubDestination, setAffiliateHubDestination] = useState("");
  const [affiliateHubSentRevision, setAffiliateHubSentRevision] = useState(0);
  const affiliateHubRunning = useRef(false);
  const [offerMonitors, setOfferMonitors] = useState<OfferMonitor[]>(defaultOfferMonitors);
  const [activeOfferMonitorId, setActiveOfferMonitorId] = useState(defaultOfferMonitors[0].id);
  const [monitorRuntimes, setMonitorRuntimes] = useState<Record<string, MonitorRuntime>>({});
  const offerMonitorRunning = useRef(new Set<string>());
  const [sendSummary, setSendSummary] = useState<SendSummary[]>([]);
  const [sendHistory, setSendHistory] = useState<SendHistoryRow[]>([]);
  const [sendHistoryLoading, setSendHistoryLoading] = useState(false);
  const [catalogCredentials, setCatalogCredentials] = useState({ mercadoLivreConfigured: false, mercadoLivreAppConfigured: false, mercadoLivreExpiresAt: null as string | null, mercadoLivreUserId: null as string | null });
  const [mercadoLivreAccessToken, setMercadoLivreAccessToken] = useState("");
  const [mercadoLivreClientId, setMercadoLivreClientId] = useState("1038957964690859");
  const [mercadoLivreClientSecret, setMercadoLivreClientSecret] = useState("");
  const [mercadoLivreConnecting, setMercadoLivreConnecting] = useState(false);
  const [catalogCredentialsSaving, setCatalogCredentialsSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const groupsRequest = whatsapp.instanceToken.trim()
        ? fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serverUrl: whatsapp.serverUrl, token: whatsapp.instanceToken, search }) })
        : fetch("/api/groups");
      const [groupsResponse, configResponse, affiliateResponse, buttonResponse] = await Promise.all([
        groupsRequest,
        fetch("/api/config"),
        fetch("/api/affiliate"),
        fetch("/api/automation/buttons"),
      ]);
      const groupsData = await groupsResponse.json() as { groups?: Group[]; demo?: boolean; connected?: boolean; error?: string };
      const configData = await configResponse.json() as { configs?: GroupConfig[] };
      const affiliateData = await affiliateResponse.json() as { settings?: Partial<AffiliateSettings> };
      const buttonData = await buttonResponse.json() as { settings?: Partial<AutomationButtonSettings> };
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
      setWhatsappConnected(Boolean(groupsData.connected));
      setConfigs(merged);
      setAffiliate({ ...emptyAffiliate, ...(affiliateData.settings || {}), amazonTrackingId: "", amazonEnabled: false, mercadoLivreEnabled: Boolean(affiliateData.settings?.mercadoLivreEnabled) });
      setButtonSettings({
        enabled: Boolean(buttonData.settings?.enabled ?? true),
        labels: Array.isArray(buttonData.settings?.labels) && buttonData.settings.labels.length ? buttonData.settings.labels : defaultAutomationButtons.labels,
      });
      setDemo(Boolean(groupsData.demo));
    } catch (caught) {
      setWhatsappConnected(false);
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("promozap.whatsapp.settings.v1");
    if (saved) {
      try { setWhatsapp({ ...emptyWhatsApp, ...JSON.parse(saved) as Partial<WhatsAppSettings> }); } catch {}
    }
    setWhatsappLoaded(true);
  }, []);

  useEffect(() => {
    const savedUrl = window.localStorage.getItem("promozap.localCollectorUrl");
    const savedToken = window.localStorage.getItem("promozap.localCollectorToken");
    const savedTemplate = window.localStorage.getItem("promozap.offerTemplate.v1");
    const savedTemplates = window.localStorage.getItem("promozap.offerTemplates.v2");
    const savedActiveTemplate = window.localStorage.getItem("promozap.offerTemplates.active.v2");
    const savedCarouselEnabled = window.localStorage.getItem("promozap.carousel.enabled.v1");
    const savedCarouselButton = window.localStorage.getItem("promozap.carousel.buttonLabel.v1");
    const savedHubSettings = window.localStorage.getItem("promozap.affiliateHub.settings.v1");
    const savedOfferMonitors = window.localStorage.getItem("promozap.offerMonitors.v1");
    if (savedUrl) setLocalCollectorUrl(savedUrl);
    if (savedToken) setLocalCollectorToken(savedToken);
    let initialTemplates: OfferTemplatePreset[] = [{ id: "padrao", name: "Padrão", content: savedTemplate || defaultOfferTemplate }];
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates) as OfferTemplatePreset[];
        const valid = Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && typeof item.content === "string").slice(0, 10) : [];
        if (valid.length) initialTemplates = valid;
      } catch {}
    }
    const initialActive = initialTemplates.find((item) => item.id === savedActiveTemplate) || initialTemplates[0];
    setOfferTemplates(initialTemplates);
    setActiveOfferTemplateId(initialActive.id);
    setOfferTemplateName(initialActive.name);
    setOfferTemplate(initialActive.content);
    if (savedCarouselEnabled === "false") setCarouselEnabled(false);
    if (savedCarouselButton?.trim()) setCarouselButtonLabel(savedCarouselButton.trim().slice(0, 25));
    if (savedHubSettings) {
      try {
        const settings = JSON.parse(savedHubSettings) as { interval?: string; destination?: string };
        if (settings.interval) setAffiliateHubInterval(settings.interval);
        if (settings.destination) setAffiliateHubDestination(settings.destination);
      } catch {}
    }
    if (savedOfferMonitors) {
      try {
        const parsed = JSON.parse(savedOfferMonitors) as OfferMonitor[];
        const valid = Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.name && Array.isArray(item.sources)) : [];
        if (valid.length) {
          setOfferMonitors(valid);
          setActiveOfferMonitorId(valid[0].id);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("promozap.affiliateHub.settings.v1", JSON.stringify({ interval: affiliateHubInterval, destination: affiliateHubDestination }));
  }, [affiliateHubInterval, affiliateHubDestination]);

  useEffect(() => {
    window.localStorage.setItem("promozap.offerMonitors.v1", JSON.stringify(offerMonitors));
  }, [offerMonitors]);

  useEffect(() => {
    if (!whatsappLoaded) return;
    window.localStorage.setItem("promozap.whatsapp.settings.v1", JSON.stringify(whatsapp));
  }, [whatsapp, whatsappLoaded]);

  useEffect(() => { if (whatsappLoaded) void loadData(); }, [whatsappLoaded]);

  useEffect(() => {
    const saved = window.localStorage.getItem("promozap.ml.sessionCookies.v1");
    if (saved) setMlSessionCookies(saved);
    setMlCookiesLoaded(true);
  }, []);

  useEffect(() => {
    if (!mlCookiesLoaded) return;
    if (mlSessionCookies) window.localStorage.setItem("promozap.ml.sessionCookies.v1", mlSessionCookies);
    else window.localStorage.removeItem("promozap.ml.sessionCookies.v1");
  }, [mlSessionCookies, mlCookiesLoaded]);

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
  const filteredPromotionGroups = useMemo(() => {
    const value = promotionGroupSearch.trim().toLowerCase();
    return value ? destinationGroups.filter((group) => `${group.Name} ${group.JID}`.toLowerCase().includes(value)) : destinationGroups;
  }, [destinationGroups, promotionGroupSearch]);
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
  const productStatItems = [
    { value: products.length, label: "produtos no histórico", Icon: PackageSearch },
    { value: productTotals.converted || 0, label: "links convertidos", Icon: Link2 },
    { value: productTotals.sent || 0, label: "ofertas enviadas", Icon: Send },
  ];
  const promotionStatItems = [
    { value: promotionItem ? 1 : 0, label: "promoção preparada", Icon: Sparkles },
    { value: promotionGroups.length, label: "grupos selecionados", Icon: UsersRound },
    { value: promotionItem?.imageUrl && promotionIncludeImage ? 1 : 0, label: "foto no envio", Icon: ShoppingBag },
  ];
  const catalogProducts = useMemo(() => products.filter((product) =>
    product.status === "sent"
    && product.store === "mercadolivre"
  ), [products, catalogStore]);
  const catalogStatItems = [
    { value: catalogProducts.length, label: "produtos enviados", Icon: Database },
    { value: catalogProducts.filter((product) => product.store === "mercadolivre").length, label: "Mercado Livre", Icon: ShoppingBag },
    { value: catalogProducts.filter((product) => Boolean(product.productDataJson)).length, label: "com dados completos", Icon: PackageSearch },
  ];
  const discoveryStatItems = [
    { value: catalogItems.length, label: "resultados exibidos", Icon: Search },
    { value: catalogTotal, label: "produtos encontrados", Icon: PackageSearch },
    { value: catalogSorts.length, label: "ordenações disponíveis", Icon: Settings2 },
  ];
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
      const response = await fetch("/api/affiliate", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...affiliate, amazonTrackingId: "", amazonEnabled: false }) });
      if (!response.ok) throw new Error();
      if (mlSessionCookies.trim()) {
        if (!whatsapp.instanceToken.trim()) throw new Error("Conecte a UAZAPI para autorizar o salvamento da sessão.");
        const sessionResponse = await fetch("/api/affiliate/mercadolivre/session", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
          body: JSON.stringify({ cookies: mlSessionCookies }),
        });
        const sessionResult = await sessionResponse.json() as { message?: string };
        if (!sessionResponse.ok) throw new Error(sessionResult.message || "Não foi possível salvar a sessão.");
      }
      toast.success(mlSessionCookies.trim() ? "Tag e sessão da automação salvas." : "Configurações de afiliado salvas.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError("");
    try {
      const params = new URLSearchParams();
      params.set("store", "mercadolivre");
      const requestedStatus = activeTab === "catalog" ? "sent" : productStatus;
      if (requestedStatus !== "all") params.set("status", requestedStatus);
      if (productSearch.trim()) params.set("search", productSearch.trim());
      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json() as { products?: ProductRecord[]; totals?: Record<string, number>; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar os produtos.");
      setProducts(result.products || []);
      setProductTotals(result.totals || {});
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Não foi possível carregar os produtos.";
      setProductsError(message);
      toast.error(message);
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadAutomationLogs() {
    setLogsLoading(true);
    try {
      const response = await fetch("/api/logs?limit=150", { cache: "no-store" });
      const result = await response.json() as { logs?: AutomationLog[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar os logs.");
      setAutomationLogs(result.logs || []);
    } catch (caught) {
      if (activeTab === "logs") toast.error(caught instanceof Error ? caught.message : "Não foi possível carregar os logs.");
    } finally {
      setLogsLoading(false);
    }
  }

  async function setupUazapiWebhook(showToast = true) {
    setWebhookSettingUp(true);
    try {
      const response = await fetch("/api/automation/uazapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: whatsapp.serverUrl, token: whatsapp.instanceToken }),
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "A UAZAPI recusou o webhook.");
      setWebhookActive(true);
      if (showToast) toast.success("Automação ativada na UAZAPI.");
      await loadAutomationLogs();
    } catch (caught) {
      setWebhookActive(false);
      if (showToast) toast.error(caught instanceof Error ? caught.message : "Não foi possível ativar o webhook.");
    } finally {
      setWebhookSettingUp(false);
    }
  }

  function addButtonLabel() {
    const label = buttonDraft.trim().replace(/\s+/g, " ");
    if (label.length < 2) return toast.error("Digite um texto para o botão.");
    if (label.length > 25) return toast.error("Use no máximo 25 caracteres.");
    if (label.includes("|")) return toast.error("O texto não pode conter o caractere |.");
    if (buttonSettings.labels.length >= 8) return toast.error("Você pode cadastrar até 8 opções.");
    if (buttonSettings.labels.some((item) => item.toLocaleUpperCase("pt-BR") === label.toLocaleUpperCase("pt-BR"))) return toast.error("Essa opção já foi adicionada.");
    setButtonSettings((current) => ({ ...current, labels: [...current.labels, label] }));
    setButtonDraft("");
  }

  async function saveButtonSettings() {
    if (!whatsapp.instanceToken.trim()) return toast.error("Informe o token da UAZAPI para autorizar o salvamento.");
    if (buttonSettings.enabled && buttonSettings.labels.length === 0) return toast.error("Adicione pelo menos uma opção de botão.");
    setButtonSettingsSaving(true);
    try {
      const response = await fetch("/api/automation/buttons", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
        body: JSON.stringify(buttonSettings),
      });
      const result = await response.json() as { error?: string; settings?: AutomationButtonSettings };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar os botões.");
      if (result.settings) setButtonSettings(result.settings);
      toast.success("Botões de compra salvos para a automação.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Não foi possível salvar os botões.");
    } finally {
      setButtonSettingsSaving(false);
    }
  }

  async function loadCatalogCredentialStatus() {
    try {
      const response = await fetch("/api/catalog/credentials");
      const result = await response.json() as typeof catalogCredentials;
      if (response.ok) setCatalogCredentials(result);
    } catch {}
  }

  async function saveCatalogCredentials() {
    if (!whatsapp.instanceToken.trim()) return toast.error("Informe o token da UAZAPI para autorizar o salvamento seguro.");
    setCatalogCredentialsSaving(true);
    try {
      const response = await fetch("/api/catalog/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
        body: JSON.stringify({ mercadoLivreClientId, mercadoLivreClientSecret, mercadoLivreAccessToken }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar as credenciais.");
      setMercadoLivreAccessToken("");
      setMercadoLivreClientSecret("");
      await loadCatalogCredentialStatus();
      toast.success("Credenciais de catálogo salvas com criptografia.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Não foi possível salvar as credenciais.");
    } finally {
      setCatalogCredentialsSaving(false);
    }
  }

  async function connectMercadoLivre() {
    if (!whatsapp.instanceToken.trim()) return toast.error("Informe o token da UAZAPI para autorizar a conexão.");
    setMercadoLivreConnecting(true);
    try {
      if (mercadoLivreClientId.trim() || mercadoLivreClientSecret.trim()) {
        const saveResponse = await fetch("/api/catalog/credentials", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
          body: JSON.stringify({ mercadoLivreClientId, mercadoLivreClientSecret }),
        });
        const saved = await saveResponse.json() as { error?: string };
        if (!saveResponse.ok) throw new Error(saved.error || "Não foi possível salvar as credenciais do aplicativo.");
        setMercadoLivreClientSecret("");
      }
      const response = await fetch("/api/oauth/mercadolivre/start", {
        method: "POST",
        headers: { "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
      });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error || "Não foi possível iniciar a autorização.");
      window.location.href = result.authorizationUrl;
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Não foi possível conectar o Mercado Livre.");
      setMercadoLivreConnecting(false);
    }
  }

  async function searchCatalog() {
    setCatalogSearching(true);
    setCatalogError("");
      setCatalogWarning("");
    try {
      const params = new URLSearchParams({ store: catalogSearchStore });
      if (catalogQuery.trim()) params.set("q", catalogQuery.trim());
      if (catalogSort) params.set("sort", catalogSort);
      if (catalogMinPrice) params.set("minPrice", catalogMinPrice);
      if (catalogMaxPrice) params.set("maxPrice", catalogMaxPrice);
      if (catalogQuality) params.set("quality", catalogQuality);
      const selectedCategory = mercadoLivreSubcategories.find((category) => category.id === catalogSubcategory)
        || mercadoLivreCategories.find((category) => category.id === catalogCategory);
      if (selectedCategory) params.set("q", `${selectedCategory.name} ${catalogQuery.trim()}`.trim());
      const response = await fetch(`/api/catalog/search?${params}`);
      const result = await response.json() as CatalogSearchResponse;
      if (!response.ok) throw new Error(result.error || "Não foi possível consultar os produtos.");
      setCatalogItems(result.items || []);
      setCatalogFilters(result.filters || null);
      setCatalogSorts(result.sorts || []);
      setCatalogTotal(result.total || 0);
      setCatalogWarning(result.warning || "");
      if (!catalogQuery.trim() && result.query) setCatalogQuery(result.query);
    } catch (caught) {
      setCatalogItems([]);
      setCatalogFilters(null);
      setCatalogWarning("");
      setCatalogError(caught instanceof Error ? caught.message : "Não foi possível consultar os produtos.");
    } finally {
      setCatalogSearching(false);
    }
  }

  async function checkLocalCollector(showToast = false) {
    try {
      const response = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/health`, { cache: "no-store" });
      const result = await response.json() as { ok?: boolean };
      const connected = response.ok && Boolean(result.ok);
      setLocalCollectorConnected(connected);
      if (showToast) connected ? toast.success("Coletor local conectado.") : toast.error("O coletor local não respondeu.");
      return connected;
    } catch {
      setLocalCollectorConnected(false);
      if (showToast) toast.error("Abra o arquivo iniciar-coletor.cmd no seu computador e tente novamente.");
      return false;
    }
  }

  function localProductToCatalog(product: LocalCollectorProduct): CatalogItem {
    const raw = product as unknown as Record<string, unknown>;
    const attributes = (product.attributes || []).map((attribute) => ({ ...attribute }));
    if (product.standardPrice != null) attributes.unshift({ name: "Preço normal", value_name: formatMoney(product.standardPrice, product.currency || "BRL") });
    if (product.pixPrice != null) attributes.unshift({ name: "Preço no Pix", value_name: formatMoney(product.pixPrice, product.currency || "BRL") });
    if (product.coupon?.price != null) attributes.unshift({ name: "Preço com cupom", value_name: formatMoney(product.coupon.price, product.currency || "BRL") });
    return {
      id: product.itemId || product.userProductId || crypto.randomUUID(),
      itemId: product.itemId,
      catalogProductId: product.userProductId,
      title: product.title || "Produto do Mercado Livre",
      imageUrl: product.imageUrl,
      url: product.canonicalUrl || product.url,
      price: product.pixPrice ?? product.price ?? product.standardPrice,
      originalPrice: product.originalPrice,
      currency: product.currency || "BRL",
      brand: product.brand,
      condition: product.condition,
      availability: product.availability,
      availableQuantity: product.availableQuantity,
      soldQuantity: null,
      freeShipping: product.freeShipping,
      seller: product.seller,
      officialStore: product.officialStore,
      discountPercentage: product.discountPercentage || 0,
      installments: product.installments,
      attributes,
      pictures: (product.images || []).map((url) => ({ url })),
      promotionType: product.coupon ? "Cupom disponível" : product.discountPercentage ? "Desconto na página" : null,
      priceSource: "marketplace_page",
      priceUpdatedAt: product.capturedAt,
      coupon: product.coupon || null,
      source: "web_search",
      priceHistory: product.priceHistory || [],
      reviews: product.reviews || [],
      reviewsTotal: product.reviewsTotal || null,
      raw,
    };
  }

  async function collectProductFromBrowser() {
    if (!localCollectorInput.trim()) return toast.error("Cole a URL do produto ou um código MLB.");
    if (!localCollectorToken.trim()) return toast.error("Cole o token exibido pela janela do coletor local.");
    setLocalCollectorLoading(true);
    setLocalCollectorError("");
    setLocalCollectorResult(null);
    localStorage.setItem("promozap.localCollectorUrl", localCollectorUrl);
    localStorage.setItem("promozap.localCollectorToken", localCollectorToken);
    try {
      const result = await retryOnce(async () => {
        const response = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Promozap-Local-Token": localCollectorToken.trim() },
          body: JSON.stringify({ input: localCollectorInput.trim() }),
        });
        const value = await response.json() as { ok?: boolean; product?: LocalCollectorProduct; error?: string };
        if (!response.ok || !value.product?.ok) throw new Error(value.product?.userActionMessage || value.error || "Não foi possível extrair esse produto.");
        return value;
      });
      setLocalCollectorConnected(true);
      setLocalCollectorResult(result.product);
      const item = localProductToCatalog(result.product);
      setCatalogItems([item]);
      setCatalogTotal(1);
      setCatalogWarning("");
      setSelectedCatalogItem(item);
      setOfferIncludeImage(Boolean(item.imageUrl));
      setOfferMessage(composeOfferMessage(item));
      toast.success("Produto lido diretamente da página do Mercado Livre.");
    } catch (caught) {
      setLocalCollectorConnected(false);
      const message = caught instanceof Error ? caught.message : "Não foi possível falar com o coletor local.";
      setLocalCollectorError(`${message} Se o navegador pedir acesso à rede local, clique em Permitir.`);
    } finally {
      setLocalCollectorLoading(false);
    }
  }

  async function loadMercadoLivreCategories(parent = "") {
    try {
      const response = await fetch(`/api/catalog/mercadolivre-categories${parent ? `?parent=${encodeURIComponent(parent)}` : ""}`);
      const result = await response.json() as { categories?: MercadoLivreCategory[] };
      if (!response.ok) return;
      if (parent) setMercadoLivreSubcategories(result.categories || []);
      else setMercadoLivreCategories(result.categories || []);
    } catch {
      // A busca continua utilizável mesmo se a árvore oficial estiver indisponível.
    }
  }

  function composeOfferMessage(item: CatalogItem, link = item.url || "", storeOverride?: "mercadolivre") {
    void storeOverride;
    const currency = item.currency || "BRL";
    const currentPrice = item.price != null ? formatMoney(item.price, currency) : "Consulte o preço no link";
    const hasPreviousPrice = Boolean(item.originalPrice && item.price && item.originalPrice > item.price);
    const previousPrice = hasPreviousPrice ? formatMoney(item.originalPrice, currency) : "";
    const savings = hasPreviousPrice ? formatMoney((item.originalPrice || 0) - (item.price || 0), currency) : "";
    const shipping = [item.freeShipping ? "Frete grátis" : "", item.full ? "Envio Full" : ""].filter(Boolean).join(" · ");
    const coupon = item.coupon && typeof item.coupon === "object"
      ? String(item.coupon.code || item.coupon.text || item.coupon.label || "Cupom disponível")
      : "";
    const store = "Mercado Livre";
    const values: Record<string, string> = {
      "{{titulo}}": item.title || "",
      "{{preco}}": currentPrice,
      "{{preco_anterior}}": previousPrice,
      "{{desconto}}": item.discountPercentage ? `${item.discountPercentage}%` : "",
      "{{economia}}": savings,
      "{{cupom}}": coupon,
      "{{link}}": link,
      "{{loja}}": store,
      "{{frete}}": shipping,
      "{{vendedor}}": item.seller == null ? "" : String(item.seller),
      "{{marca}}": item.brand || "",
      "{{categoria}}": item.categoryName || item.categoryId || "",
      "{{id_produto}}": item.itemId || item.catalogProductId || item.id,
      "{{linha_preco_anterior}}": hasPreviousPrice ? `De: ~${previousPrice}~\n` : "",
      "{{linha_desconto}}": item.discountPercentage ? ` (${item.discountPercentage}% OFF)` : "",
      "{{linha_cupom}}": coupon ? `🏷️ Cupom: *${coupon}*\n` : "",
      "{{linha_frete}}": shipping ? `🚚 ${shipping}\n` : "",
    };
    return Object.entries(values).reduce((message, [variable, value]) => message.split(variable).join(value), offerTemplate)
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function promotionItemFromRecord(record: ProductRecord): CatalogItem {
    const data = parseProductData(record.productDataJson) || {};
    const offers = data.offers && typeof data.offers === "object" ? data.offers as Record<string, unknown> : {};
    const shipping = data.shipping && typeof data.shipping === "object" ? data.shipping as Record<string, unknown> : {};
    const asNumber = (...values: unknown[]) => {
      for (const value of values) {
        const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
      return null;
    };
    const price = asNumber(data.price, offers.price, offers.lowPrice);
    const originalPrice = asNumber(data.originalPrice, data.basePrice, offers.highPrice);
    const discountPercentage = price && originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
    return {
      id: record.id,
      itemId: record.store === "mercadolivre" ? record.productCode : null,
      catalogProductId: typeof data.catalogProductId === "string" ? data.catalogProductId : null,
      title: record.title || String(data.title || data.name || "Produto selecionado"),
      imageUrl: record.imageUrl,
      url: record.affiliateUrl || record.resolvedUrl || record.sourceUrl,
      price,
      originalPrice: originalPrice && originalPrice > (price || 0) ? originalPrice : null,
      currency: String(data.currencyId || offers.priceCurrency || "BRL"),
      brand: typeof data.brand === "string" ? data.brand : null,
      categoryId: typeof data.categoryId === "string" ? data.categoryId : null,
      categoryName: typeof data.categoryName === "string" ? data.categoryName : typeof data.category === "string" ? data.category : null,
      seller: typeof data.seller === "string" || typeof data.seller === "number" ? data.seller : null,
      freeShipping: Boolean(shipping.freeShipping || shipping.free_shipping),
      full: Boolean(shipping.full || shipping.logisticType === "fulfillment"),
      coupon: data.coupon && typeof data.coupon === "object" ? data.coupon as Record<string, unknown> : null,
      discountPercentage,
      source: record.store === "amazon" ? "web_search" : "item",
      raw: data,
    };
  }

  function normalizeMercadoLivreShortAffiliateUrl(value?: string | null) {
    if (!value) return false;
    try {
      const normalized = /^(?:www\.)?meli\.la\//i.test(value.trim()) ? `https://${value.trim()}` : value.trim();
      const url = new URL(normalized);
      return url.hostname.toLowerCase().replace(/^www\./, "") === "meli.la" && url.pathname.length > 1
        ? `https://meli.la${url.pathname}`
        : "";
    } catch {
      return "";
    }
  }

  function isMercadoLivreShortAffiliateUrl(value?: string | null) {
    return Boolean(normalizeMercadoLivreShortAffiliateUrl(value));
  }

  function mercadoLivreAffiliateSource(record: ProductRecord, item: CatalogItem) {
    for (const value of [record.sourceUrl, record.resolvedUrl, item.url]) {
      if (!value) continue;
      try {
        const url = new URL(value);
        if (!url.hostname.toLowerCase().endsWith("mercadolivre.com.br")) continue;
        const itemHint = url.searchParams.get("wid")?.match(/^MLB-?(\d{7,})$/i)
          || url.searchParams.get("item_id")?.match(/^MLB-?(\d{7,})$/i)
          || url.searchParams.get("pdp_filters")?.match(/(?:^|[|,;])item_id\s*[:=]\s*MLB-?(\d{7,})(?:$|[|,;])/i);
        if (itemHint) return `https://produto.mercadolivre.com.br/MLB-${itemHint[1]}`;
        if (/\/up\/MLBU\d{7,}(?:[/?]|$)/i.test(url.pathname)) return `${url.origin}${url.pathname}${url.search}`;
      } catch {
        // Continua tentando as demais fontes conhecidas do produto.
      }
    }
    const direct = [record.resolvedUrl, record.sourceUrl, item.url].find((value) => {
      if (!value || !/\bMLB-?\d{7,}\b/i.test(value)) return false;
      try {
        return new URL(value).hostname.toLowerCase().endsWith("mercadolivre.com.br");
      } catch {
        return false;
      }
    });
    if (direct) return direct;
    const itemId = String(item.itemId || record.productCode || "").toUpperCase();
    const match = itemId.match(/^MLB-?(\d{7,})$/);
    return match ? `https://produto.mercadolivre.com.br/MLB-${match[1]}` : "";
  }

  async function createMercadoLivreShortAffiliateUrl(record: ProductRecord, item: CatalogItem) {
    const existingShortUrl = normalizeMercadoLivreShortAffiliateUrl(record.affiliateUrl);
    if (existingShortUrl) return existingShortUrl;
    const sourceUrl = mercadoLivreAffiliateSource(record, item);
    if (!sourceUrl) throw new Error("Não encontrei o código MLB do anúncio para gerar o link curto.");
    if (!affiliate.mercadoLivreLabel.trim()) throw new Error("Informe sua tag de afiliado em Credenciais antes de gerar a promoção.");
    let localFailure = "";
    try {
      let collectorToken = localCollectorToken.trim();
      if (!collectorToken) {
        const sessionResponse = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/session`, { cache: "no-store" });
        const session = await sessionResponse.json() as { ok?: boolean; token?: string };
        if (sessionResponse.ok && session.ok && session.token) {
          collectorToken = session.token;
          setLocalCollectorToken(collectorToken);
          window.localStorage.setItem("promozap.localCollectorToken", collectorToken);
        }
      }
      if (collectorToken) {
        const localResponse = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/generate-affiliate-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Promozap-Local-Token": collectorToken },
          body: JSON.stringify({ input: sourceUrl, tag: affiliate.mercadoLivreLabel.trim() }),
        });
        const localResult = await localResponse.json() as { ok?: boolean; shortUrl?: string; error?: string };
        const localShortUrl = normalizeMercadoLivreShortAffiliateUrl(localResult.shortUrl);
        if (localResponse.ok && localResult.ok && localShortUrl) return localShortUrl;
        localFailure = localResult.error || "O coletor não recebeu um meli.la.";
      }
    } catch (caught) {
      localFailure = caught instanceof Error ? caught.message : "O coletor local não respondeu.";
    }
    if (!mlSessionCookies.trim()) throw new Error(localFailure || "A sessão do Mercado Livre não está disponível. Abra o coletor e entre na sua conta.");

    const response = await fetch("/api/affiliate/mercadolivre/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(whatsapp.instanceToken.trim() ? { "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() } : {}),
      },
      body: JSON.stringify({ urls: [sourceUrl], tag: affiliate.mercadoLivreLabel.trim(), cookies: mlSessionCookies }),
    });
    const result = await response.json() as MercadoLivreTestResult;
    const shortUrl = normalizeMercadoLivreShortAffiliateUrl(result.results?.[0]?.shortUrl);
    if (!response.ok || !result.ok) throw new Error(result.message || "O Mercado Livre recusou a geração do link.");
    if (!shortUrl) throw new Error(`${localFailure ? `${localFailure} ` : ""}O Mercado Livre gerou o link afiliado completo, mas não devolveu a versão curta meli.la para este produto.`);
    return shortUrl;
  }

  async function generatePromotionPreview(inputOverride?: string, options: { silent?: boolean } = {}) {
    const targetInput = (inputOverride || promotionInput).trim();
    if (!targetInput) {
      if (!options.silent) toast.error("Cole o link do produto.");
      return null;
    }
    if (inputOverride) setPromotionInput(inputOverride);
    setPromotionLoading(true);
    setPromotionItem(null);
    setPromotionModalOpen(false);
    setPromotionDataWarning("");
    setPromotionAffiliateError("");
    try {
      const result = await retryOnce(async () => {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: targetInput, cookies: mlSessionCookies }),
        });
        const value = await response.json() as { products?: ProductRecord[]; error?: string };
        if (!response.ok || !value.products?.length) throw new Error(value.error || "O produto não pôde ser identificado.");
        return value;
      });
      const record = result.products[0];
      if (record.store !== "mercadolivre") throw new Error("A Amazon está desativada. Use um link do Mercado Livre.");
      let item = promotionItemFromRecord(record);
      if (record.store === "mercadolivre") {
        try {
          let collectorToken = localCollectorToken.trim();
          if (!collectorToken) {
            const sessionResponse = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/session`, { cache: "no-store" });
            const session = await sessionResponse.json() as { ok?: boolean; token?: string; error?: string };
            if (!sessionResponse.ok || !session.ok || !session.token) throw new Error(session.error || "O coletor local não está aberto.");
            collectorToken = session.token;
            setLocalCollectorToken(collectorToken);
            window.localStorage.setItem("promozap.localCollectorToken", collectorToken);
          }
          const scrape = async (token: string) => {
            const collectorResponse = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/scrape`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Promozap-Local-Token": token },
              body: JSON.stringify({ input: record.resolvedUrl || targetInput }),
            });
            const collectorResult = await collectorResponse.json() as { ok?: boolean; product?: LocalCollectorProduct; error?: string };
            if (!collectorResponse.ok || !collectorResult.product?.ok) throw new Error(collectorResult.product?.userActionMessage || collectorResult.error || "O coletor não retornou os dados completos.");
            return collectorResult;
          };
          const collectorResult = await retryOnce(() => scrape(collectorToken));
          const pageItem = localProductToCatalog(collectorResult.product);
          item = {
            ...pageItem,
            id: record.id,
            url: record.affiliateUrl || pageItem.url || record.resolvedUrl || record.sourceUrl,
            imageUrl: pageItem.imageUrl || record.imageUrl,
            title: pageItem.title || record.title || "Produto selecionado",
          };
          setLocalCollectorConnected(true);
          setLocalCollectorResult(collectorResult.product);
        } catch (collectorError) {
          setLocalCollectorConnected(false);
          const reason = collectorError instanceof Error ? collectorError.message : "O coletor local não conseguiu ler os preços.";
          setPromotionDataWarning(`${reason} Abra uma vez o arquivo iniciar-coletor.cmd e clique novamente em “Gerar promoção”. Depois disso, esta tela chama o coletor automaticamente.`);
        }
        try {
          const shortAffiliateUrl = await createMercadoLivreShortAffiliateUrl(record, item);
          item = { ...item, url: shortAffiliateUrl };
        } catch (affiliateError) {
          const reason = affiliateError instanceof Error ? affiliateError.message : "Não foi possível gerar o link afiliado encurtado.";
          item = { ...item, url: "" };
          setPromotionAffiliateError(`${reason} O envio foi bloqueado para impedir que o link completo seja publicado por engano.`);
        }
      }
      setPromotionRecordId(record.id);
      setPromotionItem(item);
      setPromotionModalOpen(true);
      setPromotionIncludeImage(Boolean(item.imageUrl));
      const message = composeOfferMessage(item, item.url || record.sourceUrl, record.store);
      setPromotionMessage(message);
      if (!options.silent) toast.success("Promoção pronta para revisar e enviar.");
      return { item, record, store: record.store, message };
    } catch (caught) {
      if (!options.silent) toast.error(caught instanceof Error ? caught.message : "Não foi possível gerar a promoção.");
      return null;
    } finally {
      setPromotionLoading(false);
    }
  }

  function togglePromotionGroup(jid: string) {
    setPromotionGroups((current) => current.includes(jid) ? current.filter((item) => item !== jid) : [...current, jid]);
  }

  function updatePromotionItem(patch: Partial<CatalogItem>) {
    setPromotionItem((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      setPromotionMessage(composeOfferMessage(next, next.url || "", promotionStore));
      return next;
    });
  }

  async function sendPromotionToGroups() {
    if (!promotionItem) return toast.error("Gere a promoção primeiro.");
    if (promotionStore === "mercadolivre" && !isMercadoLivreShortAffiliateUrl(promotionItem.url)) return toast.error("Gere o link afiliado encurtado meli.la antes de enviar.");
    if (!promotionGroups.length) return toast.error("Escolha pelo menos um grupo de destino.");
    if (!promotionMessage.trim()) return toast.error("A mensagem está vazia.");
    if (!whatsapp.instanceToken.trim()) return toast.error("Informe o token da UAZAPI em Credenciais.");
    setPromotionSending(true);
    let sent = 0;
    const failures: string[] = [];
    const reviewCards = carouselEnabled ? (promotionItem.reviews || []).flatMap((review) => {
      const firstMedia = review.media?.[0]
        || (review.videos?.[0] ? { type: "video" as const, url: review.videos[0] } : null)
        || (review.images?.[0] ? { type: "image" as const, url: review.images[0] } : null);
      if (!firstMedia) return [];
      return [{
        text: review.text || "Avaliação publicada com mídia.",
        imageUrl: firstMedia.type === "image" ? firstMedia.url : undefined,
        videoUrl: firstMedia.type === "video" ? firstMedia.url : undefined,
      }];
    }).slice(0, 4) : [];
    const selectedButtonLabel = carouselButtonLabel.trim() || "VER OFERTA";
    for (const destinationJid of promotionGroups) {
      try {
        const response = await fetch("/api/offers/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
          body: JSON.stringify({ destinationJid, text: promotionMessage, imageUrl: promotionItem.imageUrl, includeImage: promotionIncludeImage, reviewCards, carouselEnabled, carouselButtonLabel: selectedButtonLabel, productUrl: promotionItem.url, productId: promotionItem.itemId || promotionItem.id, productTitle: promotionItem.title }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || "Falha no envio.");
        sent += 1;
      } catch (caught) {
        failures.push(destinationGroups.find((group) => group.JID === destinationJid)?.Name || destinationJid);
      }
    }
    if (sent && promotionRecordId) {
      await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: promotionRecordId, status: "sent", destinationGroup: promotionGroups.join(",") }) }).catch(() => undefined);
    }
    if (sent) toast.success(`Oferta enviada para ${sent} grupo${sent === 1 ? "" : "s"}.`);
    if (failures.length) toast.error(`Falha em ${failures.length} grupo(s): ${failures.join(", ")}.`);
    setPromotionSending(false);
    void loadLogs();
  }

  function saveOfferTemplate() {
    const name = offerTemplateName.trim() || "Modelo sem nome";
    const next = offerTemplates.map((item) => item.id === activeOfferTemplateId ? { ...item, name, content: offerTemplate } : item);
    setOfferTemplates(next);
    setOfferTemplateName(name);
    window.localStorage.setItem("promozap.offerTemplates.v2", JSON.stringify(next));
    window.localStorage.setItem("promozap.offerTemplates.active.v2", activeOfferTemplateId);
    window.localStorage.setItem("promozap.offerTemplate.v1", offerTemplate);
    setTemplateSavedAt(new Date().toISOString());
    toast.success(`Modelo “${name}” salvo neste navegador.`);
  }

  function saveOfferTemplateAsNew() {
    if (offerTemplates.length >= 10) return toast.error("Você já atingiu o limite de 10 modelos.");
    const name = offerTemplateName.trim() || `Modelo ${offerTemplates.length + 1}`;
    const preset: OfferTemplatePreset = { id: crypto.randomUUID(), name, content: offerTemplate };
    const next = [...offerTemplates, preset];
    setOfferTemplates(next);
    setActiveOfferTemplateId(preset.id);
    setOfferTemplateName(preset.name);
    window.localStorage.setItem("promozap.offerTemplates.v2", JSON.stringify(next));
    window.localStorage.setItem("promozap.offerTemplates.active.v2", preset.id);
    window.localStorage.setItem("promozap.offerTemplate.v1", preset.content);
    setTemplateSavedAt(new Date().toISOString());
    toast.success(`Novo modelo “${name}” criado.`);
  }

  function selectOfferTemplate(id: string) {
    const preset = offerTemplates.find((item) => item.id === id);
    if (!preset) return;
    setActiveOfferTemplateId(preset.id);
    setOfferTemplateName(preset.name);
    setOfferTemplate(preset.content);
    window.localStorage.setItem("promozap.offerTemplates.active.v2", preset.id);
    window.localStorage.setItem("promozap.offerTemplate.v1", preset.content);
  }

  function deleteOfferTemplate() {
    if (offerTemplates.length <= 1) return toast.error("Mantenha pelo menos um modelo salvo.");
    const next = offerTemplates.filter((item) => item.id !== activeOfferTemplateId);
    const fallback = next[0];
    setOfferTemplates(next);
    setActiveOfferTemplateId(fallback.id);
    setOfferTemplateName(fallback.name);
    setOfferTemplate(fallback.content);
    window.localStorage.setItem("promozap.offerTemplates.v2", JSON.stringify(next));
    window.localStorage.setItem("promozap.offerTemplates.active.v2", fallback.id);
    window.localStorage.setItem("promozap.offerTemplate.v1", fallback.content);
    toast.success("Modelo excluído.");
  }

  function updateCarouselEnabled(enabled: boolean) {
    setCarouselEnabled(enabled);
    window.localStorage.setItem("promozap.carousel.enabled.v1", String(enabled));
  }

  function updateCarouselButtonLabel(label: string) {
    const normalized = label.trim().slice(0, 25) || "VER OFERTA";
    setCarouselButtonLabel(normalized);
    window.localStorage.setItem("promozap.carousel.buttonLabel.v1", normalized);
  }

  async function scanMonitoredDeals() {
    if (!localCollectorToken.trim()) {
      setMonitoringActive(false);
      setMonitoringError("Cadastre primeiro o token do coletor local em Credenciais.");
      return;
    }
    setMonitoringLoading(true);
    setMonitoringError("");
    try {
      const response = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/scan-deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Promozap-Local-Token": localCollectorToken.trim() },
        body: JSON.stringify({
          url: "https://www.mercadolivre.com.br/ofertas?container_id=MLB779362-1&promotion_type=deal_of_the_day",
          category: monitoringCategory,
          limit: 40,
          minDiscount: Number(monitoringMinDiscount),
          couponsOnly: monitoringCouponsOnly,
        }),
      });
      const data = await response.json() as { ok?: boolean; products?: Array<Record<string, unknown>>; capturedAt?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "O coletor não conseguiu ler as ofertas.");
      const now = data.capturedAt || new Date().toISOString();
      const next = (data.products || []).map((raw) => {
        const url = String(raw.url || "");
        const id = String(raw.itemId || raw.id || url);
        return {
          id,
          itemId: raw.itemId ? String(raw.itemId) : null,
          title: String(raw.title || "Oferta Mercado Livre"),
          imageUrl: raw.imageUrl ? String(raw.imageUrl) : null,
          url,
          price: Number(raw.effectivePrice || raw.price) || null,
          effectivePrice: Number(raw.effectivePrice || raw.price) || null,
          originalPrice: Number(raw.originalPrice) || null,
          currency: "BRL",
          discountPercentage: Number(raw.discountPercentage) || 0,
          coupon: raw.coupon && typeof raw.coupon === "object" ? raw.coupon as Record<string, unknown> : null,
          dealScore: Number(raw.dealScore) || 0,
          scoreReasons: Array.isArray(raw.scoreReasons) ? raw.scoreReasons.map(String) : [],
          priceSource: "marketplace_page" as const,
          detectedAt: now,
          freeShipping: Boolean(raw.freeShipping),
        } satisfies MonitoredDeal;
      });
      const fresh = next.filter((item) => !monitoringSeen.current.has(item.id));
      next.forEach((item) => monitoringSeen.current.add(item.id));
      setMonitoringDeals((current) => [...fresh, ...current.filter((item) => !fresh.some((freshItem) => freshItem.id === item.id))].slice(0, 120));
      setMonitoringLastScan(now);
      setLocalCollectorConnected(true);
      if (fresh.length && monitoringSeen.current.size > fresh.length) toast.success(`${fresh.length} nova(s) oferta(s) detectada(s).`);
    } catch (caught) {
      setMonitoringError(caught instanceof Error ? caught.message : "Não foi possível executar o monitoramento.");
      setLocalCollectorConnected(false);
    } finally {
      setMonitoringLoading(false);
    }
  }

  function affiliateHubCooldowns() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("promozap.affiliateHub.sent.v1") || "{}") as Record<string, string>;
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return Object.fromEntries(Object.entries(parsed).filter(([, sentAt]) => Date.parse(sentAt) > cutoff));
    } catch {
      return {} as Record<string, string>;
    }
  }

  async function scanAffiliateHub(sendAutomatically = false) {
    if (affiliateHubRunning.current) return;
    affiliateHubRunning.current = true;
    setAffiliateHubLoading(true);
    setAffiliateHubError("");
    try {
      let collectorToken = localCollectorToken.trim();
      if (!collectorToken) {
        const sessionResponse = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/session`, { cache: "no-store" });
        const session = await sessionResponse.json() as { ok?: boolean; token?: string; error?: string };
        if (!sessionResponse.ok || !session.ok || !session.token) throw new Error(session.error || "Abra o coletor local para pesquisar o Hub de Afiliados.");
        collectorToken = session.token;
        setLocalCollectorToken(collectorToken);
        window.localStorage.setItem("promozap.localCollectorToken", collectorToken);
      }
      const response = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/scan-affiliate-hub`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Promozap-Local-Token": collectorToken },
        body: "{}",
      });
      const data = await response.json() as { ok?: boolean; products?: AffiliateHubOffer[]; capturedAt?: string; changes?: { baselineCreated?: boolean; newCount?: number }; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "O coletor não conseguiu ler o Hub de Afiliados.");
      const products = data.products || [];
      setAffiliateHubOffers(products);
      setAffiliateHubVisibleCount(Math.min(48, Math.max(12, products.length)));
      setAffiliateHubLastScan(data.capturedAt || new Date().toISOString());
      setLocalCollectorConnected(true);
      if (data.changes?.newCount) toast.success(`${data.changes.newCount} nova(s) oferta(s) apareceram no Hub.`);

      if (sendAutomatically) {
        if (!affiliateHubDestination) throw new Error("Escolha o grupo que receberá as ofertas automáticas.");
        if (!whatsapp.instanceToken.trim()) throw new Error("Configure o token da UAZAPI antes de ativar o envio automático.");
        const sent = affiliateHubCooldowns();
        const selected = products.find((offer) => !sent[offer.itemId || offer.id || offer.url || ""]);
        if (!selected?.url) return;
        const prepared = await generatePromotionPreview(selected.url, { silent: true });
        if (!prepared) throw new Error("A melhor oferta foi encontrada, mas não foi possível preparar a mensagem.");
        if (prepared.store === "mercadolivre" && !isMercadoLivreShortAffiliateUrl(prepared.item.url)) {
          throw new Error("A oferta foi encontrada, mas o Mercado Livre não devolveu um link curto meli.la. Nada foi enviado.");
        }
        const reviewCards = carouselEnabled ? (prepared.item.reviews || []).flatMap((review) => {
          const firstMedia = review.media?.[0]
            || (review.videos?.[0] ? { type: "video" as const, url: review.videos[0] } : null)
            || (review.images?.[0] ? { type: "image" as const, url: review.images[0] } : null);
          if (!firstMedia) return [];
          return [{
            text: review.text || "Avaliação publicada com mídia.",
            imageUrl: firstMedia.type === "image" ? firstMedia.url : undefined,
            videoUrl: firstMedia.type === "video" ? firstMedia.url : undefined,
          }];
        }).slice(0, 4) : [];
        const sendResponse = await fetch("/api/offers/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
          body: JSON.stringify({ destinationJid: affiliateHubDestination, text: prepared.message, imageUrl: prepared.item.imageUrl, includeImage: Boolean(prepared.item.imageUrl), reviewCards, carouselEnabled, carouselButtonLabel: carouselButtonLabel.trim() || "VER OFERTA", productUrl: prepared.item.url, productId: prepared.item.itemId || prepared.item.id, productTitle: prepared.item.title, monitorId: "geral-hub" }),
        });
        const sendResult = await sendResponse.json() as { error?: string };
        if (!sendResponse.ok) throw new Error(sendResult.error || "A UAZAPI recusou o envio automático.");
        const key = selected.itemId || selected.id || selected.url;
        const nextSent = { ...sent, [key]: new Date().toISOString() };
        window.localStorage.setItem("promozap.affiliateHub.sent.v1", JSON.stringify(nextSent));
        setAffiliateHubSentRevision((value) => value + 1);
        if (prepared.record.id) {
          await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: prepared.record.id, status: "sent", destinationGroup: affiliateHubDestination }) }).catch(() => undefined);
        }
        toast.success(`Oferta automática enviada: ${selected.title}`);
        void loadLogs();
      }
    } catch (caught) {
      setAffiliateHubError(caught instanceof Error ? caught.message : "Não foi possível pesquisar o Hub de Afiliados.");
      setLocalCollectorConnected(false);
    } finally {
      setAffiliateHubLoading(false);
      affiliateHubRunning.current = false;
    }
  }

  function updateOfferMonitor(id: string, patch: Partial<OfferMonitor>) {
    setOfferMonitors((current) => current.map((monitor) => monitor.id === id ? { ...monitor, ...patch } : monitor));
  }

  function updateMonitorSource(monitorId: string, sourceId: string, patch: Partial<MonitorSource>) {
    setOfferMonitors((current) => current.map((monitor) => monitor.id === monitorId
      ? { ...monitor, sources: monitor.sources.map((source) => source.id === sourceId ? { ...source, ...patch } : source) }
      : monitor));
  }

  function addOfferMonitor() {
    const id = crypto.randomUUID();
    const next: OfferMonitor = {
      id, name: `Novo nicho ${offerMonitors.length}`, kind: "urls", destinationJid: "", intervalMinutes: 5,
      autoSend: false, minRating: 4.7, minDiscount: 20, maxPages: 10, ignoreInternational: true,
      sources: [{ id: crypto.randomUUID(), url: "", weight: 100 }],
    };
    setOfferMonitors((current) => [...current, next]);
    setActiveOfferMonitorId(id);
  }

  function removeOfferMonitor(id: string) {
    if (id === "geral-hub") return toast.error("Mantenha a operação de ofertas gerais.");
    setOfferMonitors((current) => {
      const next = current.filter((monitor) => monitor.id !== id);
      setActiveOfferMonitorId(next[0]?.id || "geral-hub");
      return next;
    });
  }

  function chooseWeightedSource(sources: MonitorSource[]) {
    const valid = sources.filter((source) => source.url.trim() && source.weight > 0);
    const total = valid.reduce((sum, source) => sum + source.weight, 0);
    if (!valid.length || total <= 0) return null;
    let cursor = Math.random() * total;
    for (const source of valid) {
      cursor -= source.weight;
      if (cursor <= 0) return source;
    }
    return valid.at(-1) || null;
  }

  function monitorCooldowns(monitorId: string) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(`promozap.monitor.sent.${monitorId}`) || "{}") as Record<string, string>;
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return Object.fromEntries(Object.entries(parsed).filter(([, sentAt]) => Date.parse(sentAt) > cutoff));
    } catch { return {} as Record<string, string>; }
  }

  async function loadSendHistory() {
    setSendHistoryLoading(true);
    try {
      const response = await fetch(`/api/sends${productSearch.trim() ? `?search=${encodeURIComponent(productSearch.trim())}` : ""}`);
      const data = await response.json() as { history?: SendHistoryRow[]; summary?: SendSummary[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao carregar envios.");
      setSendHistory(data.history || []);
      setSendSummary((data.summary || []).map((row) => ({ ...row, sendCount: Number(row.sendCount), groupCount: Number(row.groupCount) })));
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Falha ao carregar envios.");
    } finally { setSendHistoryLoading(false); }
  }

  async function scanOfferMonitor(monitorId: string, sendAutomatically = false) {
    const monitor = offerMonitors.find((item) => item.id === monitorId);
    if (!monitor || offerMonitorRunning.current.has(monitorId)) return;
    offerMonitorRunning.current.add(monitorId);
    setMonitorRuntimes((current) => ({ ...current, [monitorId]: { ...(current[monitorId] || { offers: [], error: "", lastScan: null }), loading: true, error: "" } }));
    try {
      if (!monitor.destinationJid && sendAutomatically) throw new Error("Escolha o grupo exclusivo desta operação antes de ativar o envio.");
      let collectorToken = localCollectorToken.trim();
      if (!collectorToken) {
        const sessionResponse = await fetch(`${localCollectorUrl.replace(/\/$/, "")}/session`, { cache: "no-store" });
        const session = await sessionResponse.json() as { ok?: boolean; token?: string; error?: string };
        if (!sessionResponse.ok || !session.token) throw new Error(session.error || "Abra o coletor local.");
        collectorToken = session.token;
        setLocalCollectorToken(collectorToken);
        window.localStorage.setItem("promozap.localCollectorToken", collectorToken);
      }
      const selectedSource = monitor.kind === "hub" ? monitor.sources[0] : chooseWeightedSource(monitor.sources);
      if (!selectedSource?.url) throw new Error("Cadastre pelo menos uma URL com peso maior que zero.");
      const endpoint = monitor.kind === "hub" ? "/scan-affiliate-hub" : "/scan-deals";
      const payload = monitor.kind === "hub" ? {} : {
        mode: "marketplace", url: selectedSource.url, limit: Math.min(500, monitor.maxPages * 50),
        scanLimit: Math.min(10000, monitor.maxPages * 50), maxPages: monitor.maxPages,
        minDiscount: monitor.minDiscount, minRating: monitor.minRating,
        ignoreInternational: monitor.ignoreInternational, realDealsOnly: false, smartphoneFocus: /celular|smartphone/i.test(monitor.name),
      };
      const response = await fetch(`${localCollectorUrl.replace(/\/$/, "")}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Promozap-Local-Token": collectorToken }, body: JSON.stringify(payload),
      });
      const data = await response.json() as { ok?: boolean; products?: AffiliateHubOffer[]; capturedAt?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "O coletor não conseguiu concluir esta operação.");
      const products = (data.products || []).filter((offer) => {
        const discount = offer.discountPercentage || 0;
        const rating = offer.rating || 0;
        return discount >= monitor.minDiscount && rating >= monitor.minRating && (!monitor.ignoreInternational || !offer.isInternational);
      });
      setMonitorRuntimes((current) => ({ ...current, [monitorId]: { offers: products, loading: false, error: "", lastScan: data.capturedAt || new Date().toISOString(), selectedSource: selectedSource.url } }));
      setLocalCollectorConnected(true);
      if (!products.length) toast.info(`${monitor.name}: nenhum produto passou por todos os filtros.`);

      if (sendAutomatically) {
        if (!whatsapp.instanceToken.trim()) throw new Error("Configure o token da UAZAPI antes de ativar o envio automático.");
        const sent = monitorCooldowns(monitorId);
        const selected = products.find((offer) => !sent[offer.itemId || offer.id || offer.url || ""]);
        if (!selected?.url) return;
        const prepared = await generatePromotionPreview(selected.url, { silent: true });
        if (!prepared) throw new Error("A oferta passou pelos filtros, mas a mensagem não pôde ser preparada.");
        if (!isMercadoLivreShortAffiliateUrl(prepared.item.url)) throw new Error("O Mercado Livre não devolveu o link curto meli.la. Nada foi enviado.");
        const reviewCards = carouselEnabled ? (prepared.item.reviews || []).flatMap((review) => {
          const firstMedia = review.media?.[0] || (review.videos?.[0] ? { type: "video" as const, url: review.videos[0] } : null) || (review.images?.[0] ? { type: "image" as const, url: review.images[0] } : null);
          if (!firstMedia) return [];
          return [{ text: review.text || "Avaliação publicada com mídia.", imageUrl: firstMedia.type === "image" ? firstMedia.url : undefined, videoUrl: firstMedia.type === "video" ? firstMedia.url : undefined }];
        }).slice(0, 4) : [];
        const sendResponse = await fetch("/api/offers/send", {
          method: "POST", headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
          body: JSON.stringify({ destinationJid: monitor.destinationJid, text: prepared.message, imageUrl: prepared.item.imageUrl, includeImage: Boolean(prepared.item.imageUrl), reviewCards, carouselEnabled, carouselButtonLabel: carouselButtonLabel.trim() || "VER OFERTA", productUrl: prepared.item.url, productId: prepared.item.itemId || prepared.item.id, productTitle: prepared.item.title, monitorId }),
        });
        const sendResult = await sendResponse.json() as { error?: string };
        if (!sendResponse.ok) throw new Error(sendResult.error || "A UAZAPI recusou o envio automático.");
        const key = selected.itemId || selected.id || selected.url;
        window.localStorage.setItem(`promozap.monitor.sent.${monitorId}`, JSON.stringify({ ...sent, [key]: new Date().toISOString() }));
        if (prepared.record.id) await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: prepared.record.id, status: "sent", destinationGroup: monitor.destinationJid }) }).catch(() => undefined);
        toast.success(`${monitor.name}: oferta enviada para o grupo configurado.`);
        void loadSendHistory();
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Falha na operação.";
      setMonitorRuntimes((current) => ({ ...current, [monitorId]: { ...(current[monitorId] || { offers: [], lastScan: null }), loading: false, error: message } }));
      setLocalCollectorConnected(false);
    } finally { offerMonitorRunning.current.delete(monitorId); }
  }

  function openMonitoredDeal(item: MonitoredDeal) {
    setSelectedCatalogItem(item);
    setOfferDestination((current) => current || destinationGroups[0]?.JID || "");
    setOfferIncludeImage(Boolean(item.imageUrl));
    setOfferMessage(composeOfferMessage(item));
  }

  async function prepareCatalogOffer(item: CatalogItem) {
    setSelectedCatalogItem(item);
    setOfferDestination((current) => current || destinationGroups[0]?.JID || "");
    setOfferIncludeImage(Boolean(item.imageUrl));
    setOfferMessage(composeOfferMessage(item));
    if (!item.url) return;
    setOfferPreparing(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: item.url, destinationGroup: offerDestination || destinationGroups[0]?.JID || "" }),
      });
      const result = await response.json() as { products?: ProductRecord[]; error?: string };
      const prepared = result.products?.[0];
      const link = prepared?.affiliateUrl || item.url;
      setOfferMessage(composeOfferMessage(item, link));
      if (!prepared?.affiliateUrl && catalogSearchStore === "mercadolivre") toast.warning("O produto foi preparado, mas o gerador de afiliado não devolveu um novo link. Revise a sessão do Mercado Livre.");
    } catch {
      setOfferMessage(composeOfferMessage(item));
    } finally {
      setOfferPreparing(false);
    }
  }

  async function sendPreparedOffer() {
    if (!selectedCatalogItem) return;
    if (!offerDestination) return toast.error("Escolha o grupo de destino.");
    if (!offerMessage.trim()) return toast.error("Escreva a mensagem da oferta.");
    if (!whatsapp.instanceToken.trim()) return toast.error("Informe o token da UAZAPI em Credenciais.");
    setOfferSending(true);
    try {
      const reviewCards = carouselEnabled ? (selectedCatalogItem.reviews || []).flatMap((review) => {
        const firstMedia = review.media?.[0]
          || (review.videos?.[0] ? { type: "video" as const, url: review.videos[0] } : null)
          || (review.images?.[0] ? { type: "image" as const, url: review.images[0] } : null);
        if (!firstMedia) return [];
        return [{
          text: review.text || "Avaliação publicada com mídia.",
          imageUrl: firstMedia.type === "image" ? firstMedia.url : undefined,
          videoUrl: firstMedia.type === "video" ? firstMedia.url : undefined,
        }];
      }).slice(0, 4) : [];
      const response = await fetch("/api/offers/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
        body: JSON.stringify({ destinationJid: offerDestination, text: offerMessage, imageUrl: selectedCatalogItem.imageUrl, includeImage: offerIncludeImage, reviewCards, carouselEnabled, carouselButtonLabel: carouselButtonLabel.trim() || "VER OFERTA", productUrl: selectedCatalogItem.url, productId: selectedCatalogItem.itemId || selectedCatalogItem.id, productTitle: selectedCatalogItem.title }),
      });
      const result = await response.json() as { error?: string; destination?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar a oferta.");
      toast.success(`Oferta enviada para ${result.destination || "o grupo"}.`);
      setSelectedCatalogItem(null);
      await loadLogs();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Não foi possível enviar a oferta.");
    } finally {
      setOfferSending(false);
    }
  }

  async function markProductSent(id: string) {
    try {
      const response = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "sent" }) });
      if (!response.ok) throw new Error();
      toast.success("Produto marcado como enviado.");
      await loadProducts();
    } catch {
      toast.error("Não foi possível atualizar o produto.");
    }
  }

  async function refreshProductData(id: string) {
    if (!whatsapp.instanceToken.trim()) return toast.error("Informe o token da UAZAPI na configuração para autorizar a atualização.");
    setEnrichingProductId(id);
    try {
      const response = await fetch("/api/products/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Promozap-Admin-Token": whatsapp.instanceToken.trim() },
        body: JSON.stringify({ id }),
      });
      const result = await response.json() as { error?: string; source?: string };
      if (!response.ok) throw new Error(result.error || "A loja não retornou os dados.");
      toast.success(`Dados atualizados${result.source ? ` via ${result.source}` : ""}.`);
      await loadProducts();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Não foi possível atualizar os dados.");
    } finally {
      setEnrichingProductId("");
    }
  }

  useEffect(() => {
    if (activeTab === "products" || activeTab === "catalog") void loadProducts();
    if (activeTab === "products") void loadSendHistory();
  }, [activeTab, productStatus]);

  useEffect(() => {
    if (activeTab !== "products" && activeTab !== "catalog") return;
    const timer = window.setInterval(() => void loadProducts(), 10_000);
    return () => window.clearInterval(timer);
  }, [activeTab, productStatus, productSearch]);

  useEffect(() => {
    if (activeTab !== "logs") return;
    void loadAutomationLogs();
    const timer = window.setInterval(() => void loadAutomationLogs(), 6_000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "discovery" || activeTab === "monitoring") {
      void loadCatalogCredentialStatus();
      if (!mercadoLivreCategories.length) void loadMercadoLivreCategories();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!monitoringActive) return;
    void scanMonitoredDeals();
    const timer = window.setInterval(() => void scanMonitoredDeals(), Math.max(1, Number(monitoringIntervalMinutes)) * 60_000);
    return () => window.clearInterval(timer);
  }, [monitoringActive, monitoringIntervalMinutes, monitoringCategory, monitoringMinDiscount, monitoringCouponsOnly, localCollectorUrl, localCollectorToken]);

  useEffect(() => {
    if (!affiliateHubAutoSend) return;
    void scanAffiliateHub(true);
    const timer = window.setInterval(() => void scanAffiliateHub(true), Math.max(1, Number(affiliateHubInterval) || 5) * 60_000);
    return () => window.clearInterval(timer);
  }, [affiliateHubAutoSend, affiliateHubInterval, affiliateHubDestination, localCollectorUrl, localCollectorToken, whatsapp.instanceToken, carouselEnabled, carouselButtonLabel]);

  useEffect(() => {
    const active = offerMonitors.filter((monitor) => monitor.autoSend);
    const timers = active.map((monitor) => {
      void scanOfferMonitor(monitor.id, true);
      return window.setInterval(() => void scanOfferMonitor(monitor.id, true), Math.max(1, monitor.intervalMinutes) * 60_000);
    });
    return () => timers.forEach((timer) => window.clearInterval(timer));
  }, [offerMonitors, localCollectorUrl, localCollectorToken, whatsapp.instanceToken, carouselEnabled, carouselButtonLabel]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");
    if (product) {
      setActiveTab("discovery");
      setLocalCollectorInput(product);
      window.history.replaceState({}, "", `${window.location.pathname}#consultar-produtos`);
      toast.info("Produto recebido do coletor. Clique em “Abrir Chrome e extrair dados” para atualizar e enviar.");
      return;
    }
    const oauth = params.get("ml_oauth");
    if (!oauth) return;
    setActiveTab("discovery");
    if (oauth === "success") toast.success("Mercado Livre conectado. A renovação do token será automática.");
    else toast.error(params.get("ml_message") || "Não foi possível conectar o Mercado Livre.");
    void loadCatalogCredentialStatus();
    window.history.replaceState({}, "", `${window.location.pathname}#consultar-produtos`);
  }, []);

  async function testWhatsappConnection() {
    if (!whatsapp.serverUrl.trim() || !whatsapp.instanceToken.trim()) {
      toast.error("Informe a URL e o token da instância.");
      return;
    }
    setWhatsappTesting(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: whatsapp.serverUrl, token: whatsapp.instanceToken }),
      });
      const result = await response.json() as { groups?: Group[]; error?: string };
      if (!response.ok) throw new Error(result.error || "A conexão foi recusada.");
      const nextGroups = result.groups || [];
      setGroups(nextGroups);
      setConfigs((current) => {
        const next = { ...current };
        for (const group of nextGroups) {
          if (next[group.JID]) continue;
          next[group.JID] = {
            jid: group.JID,
            name: group.Name || group.JID,
            role: "ignored",
            category: "geral",
            destinationJid: "",
            enabled: false,
          };
        }
        return next;
      });
      setWhatsappConnected(true);
      setDemo(false);
      setError("");
      toast.success(`UAZAPI conectada: ${(result.groups || []).length} grupo(s) encontrado(s).`);
      await setupUazapiWebhook(false);
    } catch (caught) {
      setWhatsappConnected(false);
      toast.error(caught instanceof Error ? caught.message : "Não foi possível conectar à UAZAPI.");
    } finally {
      setWhatsappTesting(false);
    }
  }

  const pageMeta = {
    groups: ["Grupos", "Organize fontes, destinos e categorias da operação."],
    generate: ["Gerar promoção", "Cole um produto, revise a mensagem e envie para seus grupos."],
    products: ["Histórico", "Acompanhe os produtos identificados, convertidos e enviados."],
    catalog: ["Dados dos produtos", "Veja tudo o que foi extraído das ofertas enviadas do Mercado Livre."],
    discovery: ["Consultar produtos", "Pesquise recomendações, preços e filtros nos catálogos oficiais."],
    monitoring: ["Radar de ofertas", "Monitore novas ofertas do dia e destaque quedas de preço relevantes."],
    templates: ["Layout das mensagens", "Monte o texto das ofertas com variáveis preenchidas automaticamente."],
    credentials: ["Credenciais", "Centralize as integrações da UAZAPI, afiliados, APIs e coletor local."],
    logs: ["Logs", "Acompanhe os eventos e diagnósticos da operação."],
  }[activeTab] || ["Painel Promozap", "Operação de grupos de ofertas."];
  const activeOfferMonitor = offerMonitors.find((monitor) => monitor.id === activeOfferMonitorId) || offerMonitors[0];
  const activeMonitorRuntime = activeOfferMonitor ? monitorRuntimes[activeOfferMonitor.id] || { offers: [], loading: false, error: "", lastScan: null } : { offers: [], loading: false, error: "", lastScan: null };

  return (
    <main className="promozap-light min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#243029] bg-[#070a08] lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-[76px] items-center border-b border-[#243029] px-5">
              <Image src="/promozap-logo.png" width={170} height={57} alt="Promozap" className="h-auto w-[170px] object-contain" priority />
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
              {[
                ["generate", "Gerar promoção", Sparkles],
                ["groups", "Grupos", UsersRound],
                ["products", "Histórico", PackageSearch],
                ["catalog", "Dados dos produtos", Database],
                ["discovery", "Consultar produtos", Search],
                ["monitoring", "Radar de ofertas", Radar],
                ["templates", "Layout das mensagens", LayoutTemplate],
                ["logs", "Logs", ScrollText],
                ["credentials", "Credenciais", KeyRound],
              ].map(([value, label, Icon]) => (
                <button key={String(value)} onClick={() => setActiveTab(String(value))} className={`promozap-menu-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-semibold transition-colors ${activeTab === value ? "promozap-menu-active bg-[#62ef8b] text-[#07140b] ring-1 ring-[#80f59f]/55" : "text-[#e0e8e2] hover:bg-[#18221b] hover:text-white"}`}>
                  <Icon className="size-4 shrink-0" /><span className="truncate">{label}</span>
                </button>
              ))}
            </nav>
            <div className="border-t border-[#243029] p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-[#101612] px-3 py-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium">José Augusto</p><p className="truncate text-xs text-[#62ef8b]">Operação Promozap</p></div>
                <button onClick={() => setActiveTab("credentials")} aria-label="Abrir credenciais" className="grid size-8 place-items-center rounded-lg text-[#94a69b] hover:bg-[#1b241e] hover:text-white"><Settings2 className="size-4" /></button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#243029] bg-[#030504]/88 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Image src="/promozap-logo.png" width={128} height={43} alt="Promozap" className="h-auto w-28 object-contain lg:hidden" priority />
              <div className="relative hidden max-w-sm flex-1 lg:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718079]" /><Input value={activeTab === "groups" ? search : ""} onChange={(event) => { setActiveTab("groups"); setSearch(event.target.value); }} placeholder="Buscar grupos..." className="h-10 border-[#2a3730] bg-[#0d1310] pl-9" /></div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" className="border-[#2a3730] bg-[#0d1310] text-[#94a69b] hover:bg-[#172019]" aria-label="Notificações"><Bell className="size-4" /></Button>
              <button onClick={() => setActiveTab("credentials")} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${whatsappConnected ? "border-[#2f7042] bg-[#102218] text-[#72f295]" : "border-[#3b443e] bg-[#111512] text-[#a7afa9]"}`}><span className={`size-2 rounded-full ${whatsappConnected ? "bg-[#31d365]" : "bg-[#778078]"}`} />{whatsappConnected ? "Conectado" : "Configurar"}</button>
            </div>
          </header>

          <section className="min-w-0 space-y-6 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0"><h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{pageMeta[0]}</h1><p className="mt-1 text-sm text-[#94a69b]">{pageMeta[1]}</p></div>
              <Button onClick={() => void loadData()} variant="outline" className="h-10 rounded-lg border-[#2b3830] bg-[#0d1310] text-white hover:bg-[#162019]"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar</Button>
            </div>

          <div className="mb-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#27322b] bg-[#0b100d] shadow-[0_18px_50px_rgba(0,0,0,.28)]">
            {(activeTab === "generate" ? promotionStatItems : activeTab === "products" ? productStatItems : activeTab === "catalog" ? catalogStatItems : activeTab === "discovery" ? discoveryStatItems : statItems).map(({ value, label, Icon }, index) => (
              <div key={label} className={`px-3 py-4 sm:px-5 ${index ? "border-l border-[#27322b]" : ""}`}>
                <Icon className="mb-2 size-4 text-[#00a947]" />
                <p className="text-2xl font-extrabold tracking-tight">{value}</p>
                <p className="text-xs text-[#94a69b] sm:text-sm">{label}</p>
              </div>
            ))}
          </div>

          {demo && <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>Prévia com grupos de exemplo. Na versão publicada, o painel usa os grupos da sua instância.</span></div>}
          {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
            <TabsList className="h-12 w-full justify-start overflow-x-auto rounded-xl border border-[#27322b] bg-[#0b100d] p-1 lg:hidden">
              <TabsTrigger value="generate" className="h-10 min-w-40 rounded-lg px-4">Gerar promoção</TabsTrigger>
              <TabsTrigger value="groups" className="h-10 min-w-28 rounded-lg px-4">Grupos</TabsTrigger>
              <TabsTrigger value="products" className="h-10 min-w-28 rounded-lg px-4">Histórico</TabsTrigger>
              <TabsTrigger value="catalog" className="h-10 min-w-40 rounded-lg px-4">Dados dos produtos</TabsTrigger>
              <TabsTrigger value="discovery" className="h-10 min-w-40 rounded-lg px-4">Consultar produtos</TabsTrigger>
              <TabsTrigger value="monitoring" className="h-10 min-w-36 rounded-lg px-4">Radar ao vivo</TabsTrigger>
              <TabsTrigger value="templates" className="h-10 min-w-40 rounded-lg px-4">Layout das mensagens</TabsTrigger>
              <TabsTrigger value="logs" className="h-10 min-w-28 rounded-lg px-4">Logs</TabsTrigger>
              <TabsTrigger value="credentials" className="h-10 min-w-36 rounded-lg px-4">Credenciais</TabsTrigger>
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

            <TabsContent value="generate" id="gerar-promocao" className="promotion-builder">
              <div className="space-y-5">
                <Card className="overflow-hidden border-[#26372d] bg-[#09100c] shadow-[0_20px_60px_rgba(0,0,0,.24)]">
                  <CardHeader className="border-b border-[#213028] bg-[linear-gradient(110deg,rgba(0,200,83,.13),transparent_56%)]">
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#30dd6b] text-[#04140a]"><Sparkles className="size-5" /></div>
                      <div><CardTitle className="text-xl">Transformar produto em promoção</CardTitle><CardDescription className="mt-1">Cole um link do Mercado Livre. O painel busca a foto, os preços e converte o link de afiliado.</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <label className="space-y-2 text-sm font-bold">Link do produto<Input value={promotionInput} onChange={(event) => setPromotionInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void generatePromotionPreview(); }} placeholder="https://www.mercadolivre.com.br/..." className="h-12 border-[#35483d] bg-[#050806]" /></label>
                      <Button onClick={() => void generatePromotionPreview()} disabled={promotionLoading} className="h-12 self-end rounded-xl bg-[#30dd6b] font-black text-[#04140a] hover:bg-[#55ec82]">{promotionLoading ? <LoaderCircle className="animate-spin" /> : <Sparkles />} {promotionLoading ? "Buscando dados..." : "Gerar promoção"}</Button>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#829389]">A imagem usada será a imagem oficial encontrada na loja. No Mercado Livre, o coletor local completa preço, preço anterior, cupom, frete, parcelas e estoque. O texto segue o modelo salvo em “Layout das mensagens”.</p>
                    {promotionDataWarning ? <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d69e35] bg-[#2a210d] p-3 text-sm leading-6 text-[#f4d277]"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{promotionDataWarning}</span></div> : null}
                    {promotionAffiliateError ? <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d45b5b] bg-[#2b1111] p-3 text-sm leading-6 text-[#ffaaaa]"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{promotionAffiliateError}</span></div> : null}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-[#26372d] bg-[#09100c] shadow-none">
                  <CardHeader className="border-b border-[#213028]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle className="flex items-center gap-2 text-xl"><Radar className="size-5 text-[#30dd6b]" /> Operações de monitoramento</CardTitle><CardDescription className="mt-2 max-w-3xl">Cada operação pesquisa suas próprias fontes, aplica seus filtros e envia somente para o grupo escolhido. Produtos enviados entram em cooldown por 24 horas dentro daquela operação.</CardDescription></div><Button type="button" onClick={addOfferMonitor} variant="outline" className="border-[#35483d] bg-[#111813] text-white"><Plus /> Novo nicho</Button></div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    <div className="flex gap-2 overflow-x-auto pb-1">{offerMonitors.map((monitor) => <button key={monitor.id} type="button" onClick={() => setActiveOfferMonitorId(monitor.id)} className={`min-w-52 rounded-xl border p-3 text-left ${monitor.id === activeOfferMonitor?.id ? "border-[#30dd6b] bg-[#102619]" : "border-[#35483d] bg-[#050806]"}`}><span className="block truncate text-sm font-black">{monitor.name}</span><span className="mt-1 block text-xs text-[#829389]">{monitor.autoSend ? "● Automático" : "○ Manual"} · {monitor.kind === "hub" ? "Hub" : `${monitor.sources.length} fonte(s)`}</span></button>)}</div>
                    {activeOfferMonitor ? <>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-2 text-sm font-bold">Nome da operação<Input value={activeOfferMonitor.name} onChange={(event) => updateOfferMonitor(activeOfferMonitor.id, { name: event.target.value })} className="h-11 border-[#35483d] bg-[#050806]" /></label>
                        <label className="space-y-2 text-sm font-bold">Grupo exclusivo<NativeSelect value={activeOfferMonitor.destinationJid} onChange={(event) => updateOfferMonitor(activeOfferMonitor.id, { destinationJid: event.target.value })} className="h-11 border-[#35483d] bg-[#050806]"><NativeSelectOption value="">Escolher grupo</NativeSelectOption>{destinationGroups.map((group) => <NativeSelectOption key={group.JID} value={group.JID}>{group.Name}</NativeSelectOption>)}</NativeSelect></label>
                        <label className="space-y-2 text-sm font-bold">Intervalo<NativeSelect value={String(activeOfferMonitor.intervalMinutes)} onChange={(event) => updateOfferMonitor(activeOfferMonitor.id, { intervalMinutes: Number(event.target.value) })} className="h-11 border-[#35483d] bg-[#050806]">{[5,10,15,30,60].map((value) => <NativeSelectOption key={value} value={String(value)}>{value < 60 ? `${value} minutos` : "1 hora"}</NativeSelectOption>)}</NativeSelect></label>
                        <div className="flex items-center justify-between self-end rounded-xl border border-[#35483d] bg-[#050806] px-4 py-3"><div><p className="text-sm font-bold">Enviar automático</p><p className="mt-1 text-xs text-[#829389]">Uma oferta por ciclo</p></div><Switch checked={activeOfferMonitor.autoSend} onCheckedChange={(checked) => { if (checked && !activeOfferMonitor.destinationJid) return toast.error("Escolha primeiro o grupo desta operação."); updateOfferMonitor(activeOfferMonitor.id, { autoSend: checked }); }} /></div>
                      </div>
                      {activeOfferMonitor.kind === "urls" ? <>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="space-y-2 text-sm font-bold">Avaliação mínima<Input type="number" min="0" max="5" step="0.1" value={activeOfferMonitor.minRating} onChange={(event) => updateOfferMonitor(activeOfferMonitor.id, { minRating: Math.min(5, Math.max(0, Number(event.target.value))) })} className="h-11 border-[#35483d] bg-[#050806]" /></label><label className="space-y-2 text-sm font-bold">Desconto mínimo (%)<Input type="number" min="0" max="95" value={activeOfferMonitor.minDiscount} onChange={(event) => updateOfferMonitor(activeOfferMonitor.id, { minDiscount: Math.min(95, Math.max(0, Number(event.target.value))) })} className="h-11 border-[#35483d] bg-[#050806]" /></label><label className="space-y-2 text-sm font-bold">Páginas por pesquisa<Input type="number" min="1" max="50" value={activeOfferMonitor.maxPages} onChange={(event) => updateOfferMonitor(activeOfferMonitor.id, { maxPages: Math.min(50, Math.max(1, Number(event.target.value))) })} className="h-11 border-[#35483d] bg-[#050806]" /></label><div className="flex items-center justify-between self-end rounded-xl border border-[#35483d] bg-[#050806] px-4 py-3"><div><p className="text-sm font-bold">Ignorar internacional</p><p className="mt-1 text-xs text-[#829389]">Descarta o cartão antes do ranking</p></div><Switch checked={activeOfferMonitor.ignoreInternational} onCheckedChange={(checked) => updateOfferMonitor(activeOfferMonitor.id, { ignoreInternational: checked })} /></div></div>
                        <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-black">URLs e chance de escolha</p><Button type="button" size="sm" variant="outline" onClick={() => updateOfferMonitor(activeOfferMonitor.id, { sources: [...activeOfferMonitor.sources, { id: crypto.randomUUID(), url: "", weight: 10 }] })} className="border-[#35483d] bg-[#111813] text-white"><Plus /> URL</Button></div>{activeOfferMonitor.sources.map((source) => <div key={source.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_42px]"><Input value={source.url} onChange={(event) => updateMonitorSource(activeOfferMonitor.id, source.id, { url: event.target.value })} placeholder="https://lista.mercadolivre.com.br/..." className="h-11 border-[#35483d] bg-[#050806]" /><div className="relative"><Input type="number" min="0" max="100" value={source.weight} onChange={(event) => updateMonitorSource(activeOfferMonitor.id, source.id, { weight: Math.min(100, Math.max(0, Number(event.target.value))) })} className="h-11 border-[#35483d] bg-[#050806] pr-8" /><span className="absolute right-3 top-3 text-xs text-[#829389]">%</span></div><Button type="button" variant="outline" onClick={() => updateOfferMonitor(activeOfferMonitor.id, { sources: activeOfferMonitor.sources.filter((item) => item.id !== source.id) })} disabled={activeOfferMonitor.sources.length === 1} className="h-11 border-[#543b3b] bg-[#1b1010] text-[#ffaaa2]"><X /></Button></div>)}</div>
                      </> : <div className="rounded-xl border border-[#31543b] bg-[#0b1710] p-4 text-sm text-[#9eeab3]">A operação geral continua lendo todas as recomendações carregadas no Hub de Afiliados. Para nichos, use operações por URLs com filtros próprios.</div>}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs leading-5 text-[#829389]"><p>{activeMonitorRuntime.offers.length} oferta(s) aprovadas pelos filtros · cooldown de 24 horas</p>{activeMonitorRuntime.selectedSource ? <p className="max-w-3xl truncate">Fonte sorteada: {activeMonitorRuntime.selectedSource}</p> : null}{activeMonitorRuntime.lastScan ? <p>Última leitura: {new Date(activeMonitorRuntime.lastScan).toLocaleString("pt-BR")}</p> : null}</div><div className="flex gap-2"><Button type="button" onClick={() => removeOfferMonitor(activeOfferMonitor.id)} disabled={activeOfferMonitor.id === "geral-hub"} variant="outline" className="border-[#543b3b] bg-[#1b1010] text-[#ffaaa2]">Remover</Button><Button onClick={() => void scanOfferMonitor(activeOfferMonitor.id, false)} disabled={activeMonitorRuntime.loading} className="bg-[#30dd6b] font-black text-[#04140a] hover:bg-[#55ec82]">{activeMonitorRuntime.loading ? <LoaderCircle className="animate-spin" /> : <Search />} {activeMonitorRuntime.loading ? "Pesquisando..." : "Pesquisar agora"}</Button></div></div>
                      {activeMonitorRuntime.error ? <div className="flex items-start gap-3 rounded-xl border border-[#d69e35] bg-[#2a210d] p-3 text-sm leading-6 text-[#f4d277]"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{activeMonitorRuntime.error}</span></div> : null}
                      {activeMonitorRuntime.offers.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{activeMonitorRuntime.offers.slice(0, 80).map((offer) => { const key = offer.itemId || offer.id || offer.url || ""; const sentAt = monitorCooldowns(activeOfferMonitor.id)[key]; return <div key={key} className="overflow-hidden rounded-2xl border border-[#26372d] bg-[#050806]"><div className="aspect-[4/3] bg-white p-3">{offer.imageUrl ? <img src={offer.imageUrl} alt={offer.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-[#708078]"><ShoppingBag className="size-10" /></div>}</div><div className="space-y-3 p-4"><div className="flex flex-wrap gap-1.5"><Badge className="bg-[#ffe04b] text-[#251f00]">-{offer.discountPercentage || 0}%</Badge>{offer.rating ? <Badge className="bg-[#173a28] text-[#8df3aa]">★ {offer.rating}</Badge> : null}{offer.coupon ? <Badge className="bg-[#3a2154] text-[#dcb6ff]">Cupom</Badge> : null}</div><h3 className="line-clamp-3 min-h-[3.75rem] text-sm font-bold leading-5">{offer.title}</h3><div>{offer.originalPrice ? <p className="text-xs text-[#829389] line-through">{formatMoney(offer.originalPrice)}</p> : null}<p className="text-xl font-black text-[#62ef8b]">{formatMoney(offer.price)}</p></div><p className="text-xs text-[#829389]">{[offer.soldText, offer.rating ? `Nota ${offer.rating}` : null].filter(Boolean).join(" · ")}</p>{sentAt ? <p className="rounded-lg bg-[#251f12] px-2 py-1.5 text-xs font-bold text-[#f1d478]">Cooldown até {new Date(Date.parse(sentAt) + 86400000).toLocaleString("pt-BR")}</p> : null}<Button onClick={() => void generatePromotionPreview(offer.url || "")} disabled={!offer.url || promotionLoading} className="h-9 w-full bg-[#18231c] text-[#8df3aa] hover:bg-[#223328]"><Sparkles /> Preparar oferta</Button></div></div>; })}</div> : <div className="rounded-2xl border border-dashed border-[#34483c] px-6 py-8 text-center"><Radar className="mx-auto mb-2 size-8 text-[#4e6958]" /><p className="font-bold">Nenhuma oferta aprovada ainda</p><p className="mt-1 text-sm text-[#829389]">A pesquisa só mostra produtos que passam por todos os filtros desta operação.</p></div>}
                    </> : null}
                  </CardContent>
                </Card>

                {promotionItem ? <Dialog open={promotionModalOpen} onOpenChange={setPromotionModalOpen}>
                  <DialogContent className="promozap-light promotion-builder max-h-[94vh] overflow-y-auto border-[#d7e1da] bg-white text-[#17221b] sm:max-w-[min(1500px,96vw)]">
                    <DialogHeader><DialogTitle className="pr-8 text-xl">Preparar oferta</DialogTitle><DialogDescription>Revise os dados, a mensagem e os grupos antes de enviar. Use o X para fechar esta janela.</DialogDescription></DialogHeader>
                    <div className="grid gap-5 2xl:grid-cols-[minmax(300px,.85fr)_minmax(360px,1fr)_minmax(300px,.8fr)]">
                  <Card className="h-fit border-[#26372d] bg-[#09100c] shadow-none">
                    <CardHeader><CardTitle className="text-lg">Dados da oferta</CardTitle><CardDescription>Revise os dados extraídos antes de publicar.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="overflow-hidden rounded-2xl border border-[#26372d] bg-white p-4"><div className="aspect-[4/3]">{promotionItem.imageUrl ? <img src={promotionItem.imageUrl} alt={promotionItem.title} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-[#708078]"><ShoppingBag className="size-12" /></div>}</div></div>
                      <label className="block space-y-1.5 text-xs font-bold text-[#aebbb3]">Título<Input value={promotionItem.title} onChange={(event) => updatePromotionItem({ title: event.target.value })} className="h-11 border-[#35483d] bg-[#050806] text-sm" /></label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1.5 text-xs font-bold text-[#aebbb3]">Preço atual<Input type="number" step="0.01" value={promotionItem.price ?? ""} onChange={(event) => updatePromotionItem({ price: event.target.value ? Number(event.target.value) : null })} className="h-11 border-[#35483d] bg-[#050806] text-sm" /></label>
                        <label className="block space-y-1.5 text-xs font-bold text-[#aebbb3]">Preço anterior<Input type="number" step="0.01" value={promotionItem.originalPrice ?? ""} onChange={(event) => { const originalPrice = event.target.value ? Number(event.target.value) : null; const discountPercentage = originalPrice && promotionItem.price && originalPrice > promotionItem.price ? Math.round((1 - promotionItem.price / originalPrice) * 100) : 0; updatePromotionItem({ originalPrice, discountPercentage }); }} className="h-11 border-[#35483d] bg-[#050806] text-sm" /></label>
                      </div>
                      <label className="block space-y-1.5 text-xs font-bold text-[#aebbb3]">Cupom<Input value={promotionItem.coupon ? String(promotionItem.coupon.code || promotionItem.coupon.text || "") : ""} onChange={(event) => updatePromotionItem({ coupon: event.target.value ? { code: event.target.value } : null })} placeholder="Sem cupom" className="h-11 border-[#35483d] bg-[#050806] text-sm" /></label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#26372d] bg-[#050806] p-3"><p className="text-xs text-[#829389]">Código</p><p className="mt-1 break-all text-sm font-bold">{promotionItem.itemId || promotionItem.catalogProductId || promotionItem.id}</p></div>
                        <div className="rounded-xl border border-[#26372d] bg-[#050806] p-3"><p className="text-xs text-[#829389]">Desconto</p><p className="mt-1 text-sm font-bold">{promotionItem.discountPercentage ? `${promotionItem.discountPercentage}% OFF` : "Não informado"}</p></div>
                      </div>
                      <label className="block space-y-1.5 text-xs font-bold text-[#aebbb3]">
                        <span className="flex items-center justify-between gap-2"><span>Link de divulgação</span><Badge className={isMercadoLivreShortAffiliateUrl(promotionItem.url) ? "bg-[#183524] text-[#77eda0]" : "bg-[#3a1717] text-[#ffaaaa]"}>{isMercadoLivreShortAffiliateUrl(promotionItem.url) ? "meli.la pronto" : "link curto pendente"}</Badge></span>
                        <Input value={promotionItem.url || ""} onChange={(event) => { const url = event.target.value; updatePromotionItem({ url }); if (isMercadoLivreShortAffiliateUrl(url)) setPromotionAffiliateError(""); }} placeholder="O link curto meli.la aparecerá aqui" className="h-11 border-[#35483d] bg-[#050806] text-sm" />
                      </label>
                      <details className="rounded-xl border border-[#26372d] bg-[#050806] p-3 text-sm"><summary className="cursor-pointer font-bold">Todos os dados extraídos</summary><div className="mt-3 grid grid-cols-2 gap-2">{[["Loja", "Mercado Livre"], ["Marca", promotionItem.brand], ["Vendedor", promotionItem.seller], ["Estoque", promotionItem.availableQuantity], ["Vendidos", promotionItem.soldQuantity], ["Condição", promotionItem.condition], ["Categoria", promotionItem.categoryName || promotionItem.categoryId], ["Entrega", promotionItem.freeShipping ? "Frete grátis" : promotionItem.full ? "Envio Full" : "Não informada"]].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-[#26372d] p-2"><p className="text-[11px] text-[#829389]">{label}</p><p className="mt-1 break-words text-xs font-semibold">{value == null || value === "" ? "—" : String(value)}</p></div>)}</div></details>
                      <div className="flex items-center justify-between rounded-xl border border-[#26372d] bg-[#050806] p-3"><div><p className="text-sm font-bold">Enviar foto oficial</p><p className="mt-1 text-xs text-[#829389]">A foto segue junto com o texto.</p></div><Switch checked={promotionIncludeImage} onCheckedChange={setPromotionIncludeImage} disabled={!promotionItem.imageUrl} /></div>
                    </CardContent>
                  </Card>

                  <Card className="h-fit border-[#26372d] bg-[#09100c] shadow-none">
                    <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">Preview da mensagem</CardTitle><CardDescription>O conteúdo abaixo é o que chegará ao grupo.</CardDescription></div><Badge className="bg-[#183524] text-[#77eda0]">Mercado Livre</Badge></div></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="whatsapp-preview-shell rounded-2xl bg-[#efeae2] p-3 sm:p-5" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(75,94,82,.12) 0 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
                        <div className="whatsapp-preview-message mx-auto max-w-md overflow-hidden rounded-xl rounded-tl-sm bg-white text-[#111b21] shadow-[0_10px_30px_rgba(45,55,50,.18)]">
                          {promotionIncludeImage && promotionItem.imageUrl ? <div className="bg-white p-2"><img src={promotionItem.imageUrl} alt="Foto da promoção" className="aspect-[4/3] w-full object-contain" /></div> : null}
                          <div className="p-3"><WhatsAppMessage text={promotionMessage} /><p className="mt-1 text-right text-[11px] text-[#9aaba1]">agora ✓✓</p></div>
                        </div>
                      </div>
                      <label className="block space-y-2 text-sm font-bold">Editar mensagem<Textarea value={promotionMessage} onChange={(event) => setPromotionMessage(event.target.value)} rows={12} className="min-h-64 resize-y border-[#35483d] bg-[#050806] leading-6" /></label>
                      <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => { void navigator.clipboard.writeText(promotionMessage); toast.success("Mensagem copiada."); }} className="border-[#35483d] bg-[#111813] text-white"><Copy /> Copiar texto</Button><Button variant="outline" onClick={() => setActiveTab("templates")} className="border-[#35483d] bg-[#111813] text-white"><LayoutTemplate /> Editar modelo</Button></div>
                    </CardContent>
                  </Card>

                  <Card className="h-fit border-[#26372d] bg-[#09100c] shadow-none 2xl:sticky 2xl:top-24">
                    <CardHeader><CardTitle className="text-lg">Enviar para grupos</CardTitle><CardDescription>Escolha um ou vários destinos.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#829389]" /><Input value={promotionGroupSearch} onChange={(event) => setPromotionGroupSearch(event.target.value)} placeholder="Buscar grupo..." className="h-11 border-[#35483d] bg-[#050806] pl-9" /></div>
                      {destinationGroups.length ? <button type="button" onClick={() => setPromotionGroups(promotionGroups.length === destinationGroups.length ? [] : destinationGroups.map((group) => group.JID))} className="flex w-full items-center gap-3 rounded-xl border border-[#26372d] bg-[#0d1711] p-3 text-left text-sm font-bold hover:border-[#3d6a4b]"><span className={`grid size-5 place-items-center rounded border ${promotionGroups.length === destinationGroups.length ? "border-[#30dd6b] bg-[#30dd6b] text-[#04140a]" : "border-[#506158]"}`}>{promotionGroups.length === destinationGroups.length ? <Check className="size-3.5" /> : null}</span>Selecionar todos</button> : null}
                      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                        {filteredPromotionGroups.map((group) => { const selected = promotionGroups.includes(group.JID); return <button key={group.JID} type="button" onClick={() => togglePromotionGroup(group.JID)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-[#30dd6b] bg-[#0f2b18]" : "border-[#26372d] bg-[#0d1711] hover:border-[#3d6a4b]"}`}><span className={`grid size-5 shrink-0 place-items-center rounded border ${selected ? "border-[#30dd6b] bg-[#30dd6b] text-[#04140a]" : "border-[#506158]"}`}>{selected ? <Check className="size-3.5" /> : null}</span><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#173c28] text-xs font-black text-[#78eea0]">{initials(group.Name || "G")}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{group.Name}</span><span className="block truncate text-xs text-[#829389]">WhatsApp · grupo</span></span></button>; })}
                        {!destinationGroups.length ? <div className="rounded-xl border border-dashed border-[#34483c] p-6 text-center"><UsersRound className="mx-auto mb-2 size-8 text-[#63746a]" /><p className="text-sm font-bold">Nenhum destino configurado</p><button type="button" onClick={() => setActiveTab("groups")} className="mt-2 text-xs font-bold text-[#58e683] underline">Configurar grupos</button></div> : null}
                      </div>
                      <Button onClick={() => void sendPromotionToGroups()} disabled={promotionSending || !promotionGroups.length || !promotionMessage.trim() || !isMercadoLivreShortAffiliateUrl(promotionItem.url)} className="h-12 w-full rounded-xl bg-[#30dd6b] font-black text-[#04140a] hover:bg-[#55ec82]">{promotionSending ? <LoaderCircle className="animate-spin" /> : <Send />} {promotionSending ? "Enviando..." : `Enviar para ${promotionGroups.length || 0} grupo${promotionGroups.length === 1 ? "" : "s"}`}</Button>
                      <p className="rounded-xl border border-[#31543b] bg-[#0b1710] p-3 text-center text-xs leading-5 text-[#9eeab3]">{carouselEnabled ? `Carrossel ativado: foto oficial e mensagem no primeiro cartão, seguidas por até quatro avaliações com mídia. Todos os cartões levam o botão “${carouselButtonLabel || "VER OFERTA"}” para o mesmo link. O link só aparece no corpo se o modelo usar {{link}}.` : "Carrossel desativado: a oferta será enviada como mensagem normal, com foto oficial e o texto exato do modelo. O link só aparece no corpo se o modelo usar {{link}}."}</p>
                      <p className="text-center text-xs leading-5 text-[#829389]">O envio só é liberado depois que o Mercado Livre confirma o seu link curto meli.la.</p>
                    </CardContent>
                  </Card>
                    </div>
                  </DialogContent>
                </Dialog> : <div className="rounded-2xl border border-dashed border-[#34483c] bg-[#09100c] px-6 py-14 text-center"><Sparkles className="mx-auto mb-3 size-10 text-[#4e6958]" /><p className="font-bold">O preview aparecerá em uma janela</p><p className="mt-1 text-sm text-[#829389]">Cole um link ou prepare uma oferta para abrir o editor.</p></div>}
              </div>
            </TabsContent>

            <TabsContent value="products" id="produtos">
              <div className="min-w-0 space-y-4">
                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_210px_auto]">
                      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718079]" /><Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { void loadProducts(); void loadSendHistory(); } }} placeholder="Buscar produto, código ou grupo" className="h-11 rounded-xl border-[#34423a] bg-[#080c09] pl-10" /></div>
                      <NativeSelect value={productStatus} onChange={(event) => setProductStatus(event.target.value)} className="h-11 w-full rounded-xl border-[#34423a] bg-[#080c09]">
                        <NativeSelectOption value="all">Todos os status</NativeSelectOption>
                        <NativeSelectOption value="converted">Convertidos</NativeSelectOption>
                        <NativeSelectOption value="sent">Enviados</NativeSelectOption>
                        <NativeSelectOption value="waiting_credentials">Aguardando sessão</NativeSelectOption>
                        <NativeSelectOption value="unsupported">Não reconhecidos</NativeSelectOption>
                        <NativeSelectOption value="error">Com erro</NativeSelectOption>
                      </NativeSelect>
                      <Button onClick={() => { void loadProducts(); void loadSendHistory(); }} variant="outline" className="h-11 rounded-xl border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]"><RefreshCw className={productsLoading || sendHistoryLoading ? "animate-spin" : ""} /> Atualizar</Button>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardHeader className="border-b border-[#27322b]"><CardTitle className="flex items-center gap-2 text-lg"><Send className="size-5 text-[#62ef8b]" /> Histórico real de envios</CardTitle><CardDescription>Cada disparo é registrado. A contagem usa o ID do produto, mesmo quando ele é enviado novamente ou para grupos diferentes.</CardDescription></CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {sendSummary.length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{sendSummary.slice(0, 12).map((row) => <div key={row.productId} className="rounded-xl border border-[#27372e] bg-[#07110b] p-3"><p className="line-clamp-2 min-h-10 text-sm font-bold">{row.productTitle || row.productId}</p><p className="mt-2 text-xs text-[#829389]">{row.productId}</p><div className="mt-3 flex items-end justify-between"><span className="text-2xl font-black text-[#62ef8b]">{row.sendCount}x</span><span className="text-right text-xs text-[#9cad9f]">{row.groupCount} grupo(s)<br />{new Date(row.lastSentAt).toLocaleString("pt-BR")}</span></div></div>)}</div> : <p className="rounded-xl border border-dashed border-[#34483c] p-5 text-center text-sm text-[#829389]">Os próximos envios aparecerão aqui com a contagem por produto.</p>}
                      {sendHistory.length ? <div className="max-h-80 overflow-auto rounded-xl border border-[#27372e]"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 bg-[#111a14] text-[#9cad9f]"><tr><th className="p-3">Produto</th><th className="p-3">Grupo</th><th className="p-3">Origem</th><th className="p-3">Enviado em</th></tr></thead><tbody>{sendHistory.map((row) => <tr key={row.id} className="border-t border-[#223028]"><td className="p-3"><p className="max-w-sm truncate font-bold text-white">{row.productTitle || row.productId}</p><p className="mt-1 text-[#718079]">{row.productId}</p></td><td className="p-3">{row.destinationName || row.destinationJid}</td><td className="p-3">{row.monitorId ? `Monitor: ${offerMonitors.find((item) => item.id === row.monitorId)?.name || row.monitorId}` : "Envio manual"}</td><td className="p-3">{new Date(row.sentAt).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div> : null}
                    </CardContent>
                  </Card>

                  {productsError && <div className="flex items-start gap-3 rounded-xl border border-[#74443c] bg-[#251412] p-4 text-sm text-[#ffaaa2]"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">O histórico não carregou</p><p className="mt-1">{productsError}</p></div></div>}

                  {productsLoading && products.length === 0 ? (
                    <Card className="border-[#27322b] bg-[#0b100d] shadow-none"><CardContent className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#94a69b]"><LoaderCircle className="size-5 animate-spin text-[#62ef8b]" /> Carregando histórico...</CardContent></Card>
                  ) : products.length === 0 ? (
                    <Card className="border-[#27322b] bg-[#0b100d] shadow-none"><CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><PackageSearch className="mb-3 size-9 text-[#567061]" /><p className="font-semibold">Nenhum produto encontrado ainda</p><p className="mt-2 max-w-md text-sm leading-6 text-[#94a69b]">Cole uma mensagem ao lado para testar. Os produtos capturados pela automação aparecerão neste mesmo histórico.</p></CardContent></Card>
                  ) : products.map((product) => (
                    <Card key={product.id} className="overflow-hidden border-[#27322b] bg-[#0b100d] shadow-none">
                      <CardContent className="p-0">
                        <div className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${product.status === "sent" ? "border-[#245c34] bg-[#102619]" : product.status === "converted" ? "border-[#285d39] bg-[#12251a]" : product.status === "waiting_credentials" ? "border-[#65582d] bg-[#29230f]" : product.status === "error" ? "border-[#74443c] bg-[#2a1512]" : "border-[#343f38] bg-[#151b17]"}`}>
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`size-2.5 shrink-0 rounded-full ${product.status === "sent" ? "bg-[#62ef8b]" : product.status === "converted" ? "bg-[#39d66d]" : product.status === "waiting_credentials" ? "bg-[#f2c94c]" : product.status === "error" ? "bg-[#ff756b]" : "bg-[#8c9a91]"}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#91a298]">Situação da oferta</p>
                              <p className="mt-0.5 truncate font-bold text-white">{productStatusLabel(product.status)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#a8b5ad]">
                            <span>{new Date(product.lastSeenAt).toLocaleString("pt-BR")}</span>
                            <span>{product.occurrences} ocorrência(s)</span>
                            {product.sentAt && <span className="font-semibold text-[#75e895]">Enviada {new Date(product.sentAt).toLocaleString("pt-BR")}</span>}
                          </div>
                        </div>

                        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5">
                          <div className="min-w-0 rounded-2xl border border-[#26352c] bg-[#07110b] p-3 sm:p-4">
                            <div className="mb-3 flex items-center justify-between gap-3 px-1">
                              <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#62ef8b]">Mensagem original</p>
                                <p className="mt-1 truncate text-xs text-[#87978d]">{product.sourceGroup || "Grupo de origem não identificado"}</p>
                              </div>
                              <MessageCircleMore className="size-5 shrink-0 text-[#62ef8b]" />
                            </div>
                            <div className="ml-auto max-w-[96%] overflow-hidden rounded-2xl rounded-tr-md bg-[#183d2a] shadow-[0_8px_28px_rgba(0,0,0,.22)] sm:max-w-[90%]">
                              {product.imageUrl && (
                                <div className="aspect-[16/10] overflow-hidden bg-[#101713]">
                                  <img src={product.imageUrl} alt={product.title || "Foto da oferta"} loading="lazy" className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div className="p-3.5 sm:p-4">
                                <WhatsAppMessage text={product.messageExcerpt || `${product.title || "Oferta encontrada"}\n\n${product.sourceUrl}`} />
                                <div className="mt-2 flex justify-end text-[11px] text-[#a9c7b5]">{new Date(product.lastSeenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} <span className="ml-1 text-[#53bdeb]">✓✓</span></div>
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className={`grid size-12 shrink-0 place-items-center rounded-xl font-extrabold ${product.store === "amazon" ? "bg-[#ff9900] text-[#231500]" : product.store === "mercadolivre" ? "bg-[#ffe600] text-[#231f00]" : "bg-[#252d28] text-[#aeb9b1]"}`}>
                                {product.store === "amazon" ? "a" : product.store === "mercadolivre" ? "ML" : <ShoppingBag className="size-5" />}
                              </div>
                              <div className="min-w-0"><p className="line-clamp-2 font-bold leading-5">{product.title || product.productCode || "Produto não reconhecido"}</p><p className="mt-1 text-xs text-[#94a69b]">{product.store === "amazon" ? "Amazon" : product.store === "mercadolivre" ? "Mercado Livre" : "Outra loja"}{product.productCode ? ` · ${product.productCode}` : ""}</p></div>
                            </div>

                            <div className="space-y-2 rounded-xl border border-[#27322b] bg-[#080c09] p-3 text-xs leading-5 text-[#95a39a]">
                              <div className="flex justify-between gap-3"><span>Redirecionamentos</span><strong className="text-white">{product.redirectCount}</strong></div>
                              <div className="flex justify-between gap-3"><span>Destino</span><strong className="max-w-36 truncate text-right text-white">{product.destinationGroup || "—"}</strong></div>
                            </div>

                            {product.errorMessage && <div className="rounded-xl border border-[#66532e] bg-[#241d0c] p-3 text-sm leading-6 text-[#e6c47d]"><p className="font-semibold text-[#f0cf88]">Atenção</p><p className="mt-1">{product.errorMessage}</p></div>}

                            <div className="grid gap-2">
                              {(product.affiliateUrl || product.resolvedUrl) && <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(product.affiliateUrl || product.resolvedUrl || product.sourceUrl); toast.success("Link copiado."); }} className="h-10 justify-start rounded-lg border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]"><Copy /> Copiar link {product.affiliateUrl ? "convertido" : "resolvido"}</Button>}
                              <Button asChild variant="outline" size="sm" className="h-10 justify-start rounded-lg border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]"><a href={product.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink /> Abrir link original</a></Button>
                              {product.status === "converted" && <Button size="sm" onClick={() => void markProductSent(product.id)} className="h-10 justify-start rounded-lg bg-[#00c853] text-[#04140a] hover:bg-[#16dc61]"><Send /> Marcar como enviado</Button>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="catalog" id="dados-dos-produtos">
              <div className="space-y-4">
                <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                  <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                    <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718079]" /><Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadProducts(); }} placeholder="Buscar título, código ou link" className="h-11 rounded-xl border-[#34423a] bg-[#080c09] pl-10" /></div>
                    <div className="flex h-11 items-center rounded-xl border border-[#34423a] bg-[#080c09] px-3 text-sm font-semibold text-[#dce9df]">Somente Mercado Livre</div>
                    <Button onClick={() => void loadProducts()} variant="outline" className="h-11 rounded-xl border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]"><RefreshCw className={productsLoading ? "animate-spin" : ""} /> Atualizar</Button>
                  </CardContent>
                </Card>

                <div className="rounded-xl border border-[#244c31] bg-[#0d1d12] p-4 text-sm leading-6 text-[#a7cbb2]">
                  Esta tela mostra todos os campos que a operação armazena hoje: identificação, imagem oficial, links original, resolvido e convertido, grupos, mensagem, redirecionamentos, ocorrências e datas. Preço, estoque, vendedor e avaliações só aparecem futuramente quando forem obtidos por uma API oficial e confiável.
                </div>

                {productsError && <div className="flex items-start gap-3 rounded-xl border border-[#74443c] bg-[#251412] p-4 text-sm text-[#ffaaa2]"><CircleAlert className="mt-0.5 size-4 shrink-0" /><p>{productsError}</p></div>}
                {productsLoading && products.length === 0 ? (
                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none"><CardContent className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#94a69b]"><LoaderCircle className="size-5 animate-spin text-[#62ef8b]" /> Carregando dados...</CardContent></Card>
                ) : catalogProducts.length === 0 ? (
                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none"><CardContent className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><Database className="mb-3 size-9 text-[#567061]" /><p className="font-semibold">Nenhum produto enviado nesse filtro</p><p className="mt-2 text-sm text-[#94a69b]">Assim que uma oferta do Mercado Livre for enviada, os dados completos aparecerão aqui.</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 2xl:grid-cols-2">
                    {catalogProducts.map((product) => {
                      const enrichedData = parseProductData(product.productDataJson);
                      const enrichedFields = enrichedData ? Object.entries(enrichedData).filter(([key, value]) =>
                        value !== null && value !== undefined && value !== "" && !["pictures", "images", "attributes", "saleTerms", "shipping", "settings", "offers", "aggregateRating", "tags"].includes(key)
                      ) : [];
                      const attributes = enrichedData && Array.isArray(enrichedData.attributes) ? enrichedData.attributes as Array<Record<string, unknown>> : [];
                      const fields = [
                        ["Loja", product.store === "amazon" ? "Amazon" : "Mercado Livre"],
                        ["ID do produto", product.productCode || "Não identificado"],
                        ["Fonte dos dados", product.dataSource || "Página pública"],
                        ["Situação", productStatusLabel(product.status)],
                        ["Grupo de origem", product.sourceGroup || "Não informado"],
                        ["Grupo de destino", product.destinationGroup || "Não informado"],
                        ["Redirecionamentos", String(product.redirectCount)],
                        ["Ocorrências", String(product.occurrences)],
                        ["Encontrado em", new Date(product.foundAt).toLocaleString("pt-BR")],
                        ["Visto por último", new Date(product.lastSeenAt).toLocaleString("pt-BR")],
                        ["Enviado em", product.sentAt ? new Date(product.sentAt).toLocaleString("pt-BR") : "Não informado"],
                        ["Atualizado em", product.updatedAt ? new Date(product.updatedAt).toLocaleString("pt-BR") : "Não informado"],
                      ];
                      const links = [
                        ["Link recebido", product.sourceUrl],
                        ["Link final resolvido", product.resolvedUrl],
                        ["Link de afiliado enviado", product.affiliateUrl],
                        ["Imagem oficial", product.imageUrl],
                      ].filter((item): item is [string, string] => Boolean(item[1]));
                      return (
                        <Card key={product.id} className="overflow-hidden border-[#27322b] bg-[#0b100d] shadow-none">
                          <CardHeader className="border-b border-[#27322b] bg-[#0d1510]">
                            <div className="flex items-start gap-4">
                              <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-[#2f3d34] bg-[#080c09]">
                                {product.imageUrl ? <img src={product.imageUrl} alt={product.title || "Produto"} loading="lazy" className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center"><ShoppingBag className="size-6 text-[#607267]" /></div>}
                              </div>
                              <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge className={product.store === "amazon" ? "bg-[#ff9900] text-[#231500]" : "bg-[#ffe600] text-[#231f00]"}>{product.store === "amazon" ? "Amazon" : "Mercado Livre"}</Badge><Badge className="border border-[#2d8a4b] bg-[#153520] text-[#8af3a5]">Enviado</Badge></div><CardTitle className="mt-3 line-clamp-2 text-lg leading-6">{product.title || product.productCode || "Produto sem título"}</CardTitle><CardDescription className="mt-1 break-all">Registro {product.id}</CardDescription><Button onClick={() => void refreshProductData(product.id)} disabled={enrichingProductId === product.id} variant="outline" size="sm" className="mt-3 border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]">{enrichingProductId === product.id ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Buscar dados da loja</Button></div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-5 p-4 sm:p-5">
                            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                              {fields.map(([label, value]) => <div key={label} className="min-w-0 border-b border-[#202a24] pb-2"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#718079]">{label}</p><p className="mt-1 break-words text-sm text-[#e8f1eb]">{value}</p></div>)}
                            </div>
                            <div className="space-y-3">
                              {links.map(([label, value]) => <div key={label} className="rounded-xl border border-[#27322b] bg-[#080c09] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-[#94a69b]">{label}</p><Button variant="ghost" size="sm" onClick={() => { void navigator.clipboard.writeText(value); toast.success(`${label} copiado.`); }} className="h-7 px-2 text-[#62ef8b] hover:bg-[#142019]"><Copy className="size-3.5" /> Copiar</Button></div><a href={value} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs leading-5 text-[#53bdeb] underline underline-offset-2">{value}</a></div>)}
                            </div>
                            <div className="rounded-xl border border-[#2a4834] bg-[#09140d] p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#62ef8b]">Dados extraídos do produto</p><Badge className="border border-[#2a5f39] bg-[#102619] text-[#8af3a5]">{product.dataSource || "dados públicos"}</Badge></div>
                              {enrichedFields.length ? <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">{enrichedFields.map(([key, value]) => <div key={key} className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#718079]">{productDataLabels[key] || key}</p><p className="mt-1 break-words text-sm leading-5 text-[#dce9df]">{productDataValue(value)}</p></div>)}</div> : <p className="mt-3 text-sm leading-6 text-[#94a69b]">Ainda não foi possível obter campos adicionais para este produto. Um novo envio tentará atualizar o registro.</p>}
                              {attributes.length > 0 && <div className="mt-4 border-t border-[#25362b] pt-4"><p className="mb-3 text-xs font-bold text-[#94a69b]">FICHA TÉCNICA ({attributes.length})</p><div className="grid gap-2 sm:grid-cols-2">{attributes.map((attribute, index) => <div key={`${String(attribute.id || attribute.name)}-${index}`} className="rounded-lg bg-[#111b14] px-3 py-2"><p className="text-xs text-[#718079]">{String(attribute.name || attribute.id || "Atributo")}</p><p className="mt-1 text-sm text-[#e4eee7]">{String(attribute.value_name || attribute.valueName || attribute.value_id || "—")}</p></div>)}</div></div>}
                            </div>
                            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#718079]">Mensagem capturada</p><div className="max-h-56 overflow-auto rounded-xl border border-[#27322b] bg-[#080c09] p-3"><WhatsAppMessage text={product.messageExcerpt || "Mensagem não armazenada."} /></div></div>
                            {product.errorMessage && <div className="rounded-xl border border-[#66532e] bg-[#241d0c] p-3 text-sm text-[#e6c47d]">{product.errorMessage}</div>}
                            <details className="rounded-xl border border-[#27322b] bg-[#080c09] open:bg-[#060906]"><summary className="cursor-pointer px-3 py-3 text-sm font-semibold text-[#b7c4bc]">Ver registro bruto (JSON)</summary><div className="border-t border-[#27322b] p-3"><Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(JSON.stringify({ ...product, productData: enrichedData }, null, 2)); toast.success("JSON copiado."); }} className="mb-3 border-[#34423a] bg-[#111813] text-white"><Copy /> Copiar JSON</Button><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs leading-5 text-[#8fd9a4]">{JSON.stringify({ ...product, productData: enrichedData }, null, 2)}</pre></div></details>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="discovery" id="consultar-produtos" className="promobit-catalog rounded-3xl bg-[#f4f6f8] p-3 text-[#243447] sm:p-5">
              <Card className="mb-5 overflow-hidden border-[#31543b] bg-[#0b100d] shadow-none">
                <CardHeader className="border-b border-[#27322b] bg-[linear-gradient(110deg,rgba(36,199,90,.12),transparent_62%)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#24c75a] text-[#04140a]"><Smartphone className="size-5" /></div><div><CardTitle className="text-xl">Coletor pelo navegador</CardTitle><CardDescription className="mt-1 max-w-2xl">Abre o Chrome no seu computador e lê exatamente o preço, cupom, estoque e oferta que aparecem na página do produto.</CardDescription></div></div>
                    <Badge className={localCollectorConnected ? "w-fit border border-[#2d8a4b] bg-[#153520] text-[#8af3a5]" : "w-fit border border-[#5b4930] bg-[#241d0c] text-[#e6c47d]"}>{localCollectorConnected ? "Coletor conectado" : "Coletor local parado"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <label className="block space-y-2 text-sm font-semibold">URL completa ou código MLB/MLBU<Input value={localCollectorInput} onChange={(event) => setLocalCollectorInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void collectProductFromBrowser(); }} placeholder="https://www.mercadolivre.com.br/... ou MLBU3142068675" className="h-12 border-[#34423a] bg-[#080c09]" /></label>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Button onClick={() => void collectProductFromBrowser()} disabled={localCollectorLoading} className="h-12 rounded-xl bg-[#24c75a] font-extrabold text-[#04140a] hover:bg-[#46df75]">{localCollectorLoading ? <LoaderCircle className="animate-spin" /> : <Search />} {localCollectorLoading ? "Lendo a página aberta..." : "Abrir Chrome e extrair dados"}</Button>
                    <Button variant="outline" onClick={() => void checkLocalCollector(true)} className="h-12 border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]"><RefreshCw /> Testar conexão</Button>
                  </div>
                  <Button asChild variant="outline" className="h-12 w-full border-[#31543b] bg-[#0d1d12] text-[#8af3a5] hover:bg-[#153520]"><a href="http://127.0.0.1:8765" target="_blank" rel="noreferrer"><ExternalLink /> Abrir o painel local (modo mais confiável)</a></Button>
                  <details className="rounded-xl border border-[#27322b] bg-[#080c09] px-4 py-3 text-sm"><summary className="cursor-pointer font-semibold">Como iniciar no computador</summary><ol className="mt-3 list-decimal space-y-2 pl-5 leading-6 text-[#94a69b]"><li>Abra a pasta <code>local-collector</code> do projeto e dê dois cliques em <code>iniciar-coletor.cmd</code>.</li><li>Cadastre a URL e o token na aba <strong>Credenciais</strong>.</li><li>Na primeira vez, faça login no Mercado Livre na janela do Chrome criada pelo coletor.</li></ol><p className="mt-3 text-xs leading-5 text-[#718079]">A sessão fica apenas no seu computador. Se aparecer CAPTCHA ou confirmação de identidade, resolva manualmente no Chrome e clique novamente.</p></details>
                  {localCollectorError && <div className="rounded-xl border border-[#784235] bg-[#21110e] p-3 text-sm leading-6 text-[#ffb0a7]">{localCollectorError}</div>}
                  {localCollectorResult && <div className="rounded-xl border border-[#31543b] bg-[#0b1710] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-[#8af3a5]">Última leitura concluída</p><p className="text-xs text-[#718079]">{localCollectorResult.capturedAt ? new Date(localCollectorResult.capturedAt).toLocaleString("pt-BR") : "agora"}</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[["Preço no Pix", localCollectorResult.pixPrice != null ? formatMoney(localCollectorResult.pixPrice, localCollectorResult.currency || "BRL") : "—"], ["Preço normal", localCollectorResult.standardPrice != null ? formatMoney(localCollectorResult.standardPrice, localCollectorResult.currency || "BRL") : "—"], ["Preço anterior", localCollectorResult.originalPrice != null ? formatMoney(localCollectorResult.originalPrice, localCollectorResult.currency || "BRL") : "—"], ["Com cupom", localCollectorResult.coupon?.price != null ? formatMoney(localCollectorResult.coupon.price, localCollectorResult.currency || "BRL") : "—"]].map(([label, value]) => <div key={label} className="rounded-lg bg-[#111813] p-3"><p className="text-xs text-[#718079]">{label}</p><p className="mt-1 font-bold text-white">{value}</p></div>)}</div><p className="mt-3 text-xs leading-5 text-[#94a69b]">O produto completo foi aberto no modal abaixo, com imagem, IDs, vendedor, estoque, cupom, parcelas e ficha técnica.</p></div>}
                </CardContent>
              </Card>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardHeader className="border-b border-[#27322b]"><CardTitle className="text-xl">Central de ofertas</CardTitle><CardDescription>Busque por nome, cole um link ou informe um MLB ID. O painel cruza anúncio, preço atual, oferta vencedora, vendedor e ficha técnica.</CardDescription></CardHeader>
                    <CardContent className="space-y-4 pt-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-semibold">Loja<div className="flex h-10 items-center rounded-md border border-[#34423a] bg-[#080c09] px-3">Mercado Livre</div></label>
                        <label className="space-y-2 text-sm font-semibold">Ordenar<NativeSelect value={catalogSort} onChange={(event) => setCatalogSort(event.target.value)}><NativeSelectOption value="">Relevância</NativeSelectOption>{catalogSorts.map((sort) => { const value = typeof sort === "string" ? sort : sort.id; const label = typeof sort === "string" ? sort : sort.name; return <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>; })}</NativeSelect></label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-semibold">Categoria oficial<NativeSelect value={catalogCategory} onChange={(event) => { const value = event.target.value; setCatalogCategory(value); setCatalogSubcategory(""); setMercadoLivreSubcategories([]); if (value) void loadMercadoLivreCategories(value); }}><NativeSelectOption value="">Todas as categorias</NativeSelectOption>{mercadoLivreCategories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}</NativeSelect></label>
                        <label className="space-y-2 text-sm font-semibold">Subcategoria<NativeSelect value={catalogSubcategory} onChange={(event) => setCatalogSubcategory(event.target.value)} disabled={!catalogCategory || !mercadoLivreSubcategories.length}><NativeSelectOption value="">Todas as subcategorias</NativeSelectOption>{mercadoLivreSubcategories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}</NativeSelect></label>
                      </div>
                      <label className="block space-y-2 text-sm font-semibold">Produto, link ou ID<div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718079]" /><Input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchCatalog(); }} placeholder="Ex.: notebook, link do produto ou MLB123456789" className="h-12 border-[#34423a] bg-[#080c09] pl-10" /></div></label>
                      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold">Preço mínimo<Input type="number" min="0" value={catalogMinPrice} onChange={(event) => setCatalogMinPrice(event.target.value)} placeholder="R$ 0" className="h-11 border-[#34423a] bg-[#080c09]" /></label><label className="space-y-2 text-sm font-semibold">Preço máximo<Input type="number" min="0" value={catalogMaxPrice} onChange={(event) => setCatalogMaxPrice(event.target.value)} placeholder="Sem limite" className="h-11 border-[#34423a] bg-[#080c09]" /></label></div>
                      <label className="block space-y-2 text-sm font-semibold">Qualidade da oferta<NativeSelect value={catalogQuality} onChange={(event) => setCatalogQuality(event.target.value)}><NativeSelectOption value="all">Todas</NativeSelectOption><NativeSelectOption value="priced">Somente com preço confirmado</NativeSelectOption><NativeSelectOption value="good_deal">Boas ofertas</NativeSelectOption><NativeSelectOption value="coupon">Com cupom</NativeSelectOption><NativeSelectOption value="free_shipping">Frete grátis</NativeSelectOption><NativeSelectOption value="full">Envio Full</NativeSelectOption><NativeSelectOption value="official_store">Loja oficial</NativeSelectOption></NativeSelect></label>
                      <Button onClick={() => void searchCatalog()} disabled={catalogSearching} className="h-12 w-full rounded-xl bg-[#24c75a] font-bold text-[#04140a] hover:bg-[#46df75]">{catalogSearching ? <LoaderCircle className="animate-spin" /> : <Search />} {catalogSearching ? "Cruzando dados oficiais..." : catalogQuery.trim() ? "Buscar ofertas" : "Ver recomendações"}</Button>
                      {catalogError && <div className="rounded-xl border border-[#784235] bg-[#21110e] p-3 text-sm leading-6 text-[#ffb0a7]">{catalogError}</div>}
                      {catalogWarning && <div className="flex items-start gap-3 rounded-xl border border-[#66532e] bg-[#241d0c] p-3 text-sm leading-6 text-[#e6c47d]"><CircleAlert className="mt-1 size-4 shrink-0" /><div><p className="font-bold">Por que nenhum preço apareceu?</p><p className="mt-1">A API de catálogo devolveu produtos e imagens, mas não uma oferta vencedora. A API de preços bloqueou anúncios de outros vendedores e a leitura da vitrine pediu validação dos cookies salvos. Por segurança, o painel não inventa nem reaproveita preço antigo.</p><p className="mt-2">{catalogWarning} Vá em <strong>Credenciais</strong>, cole uma exportação recente dos cookies e salve; a próxima busca tentará novamente automaticamente.</p></div></div>}
                    </CardContent>
                  </Card>

                  {mercadoLivreCategories.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{[{ id: "", name: "Geral" }, ...mercadoLivreCategories].map((category) => <button key={category.id || "general"} type="button" onClick={() => { setCatalogCategory(category.id); setCatalogSubcategory(""); setMercadoLivreSubcategories([]); if (category.id) void loadMercadoLivreCategories(category.id); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold ${catalogCategory === category.id ? "border-[#36d96b] bg-[#16351f] text-[#8af3a5]" : "border-[#34423a] bg-[#0b100d] text-[#b6c4bb] hover:border-[#52705c]"}`}>{category.name}</button>)}</div>}
                  {catalogItems.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{catalogItems.map((item) => (
                    <Card key={item.id} className="group overflow-hidden border-[#27322b] bg-[#0b100d] shadow-none transition hover:border-[#3e5948]">
                      <div className="relative aspect-square bg-white p-2">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" loading="lazy" /> : <div className="grid h-full place-items-center"><ShoppingBag className="size-7 text-[#607267]" /></div>}{item.bestSellerPosition && <div className="absolute left-2 top-2 rounded-full bg-[#ffe600] px-2 py-1 text-[10px] font-black text-[#231f00]">#{item.bestSellerPosition} mais vendido</div>}</div>
                      <CardContent className="space-y-2.5 p-3"><div className="flex flex-wrap gap-1.5"><Badge className={catalogSearchStore === "amazon" ? "bg-[#ff9900] text-[#231500]" : "bg-[#ffe600] text-[#231f00]"}>{catalogSearchStore === "amazon" ? "Amazon" : item.source === "web_search" ? "Marketplace" : item.source === "item" ? "Anúncio" : item.source === "buy_box" ? "Oferta" : item.source === "best_seller" ? "Mais vendido" : "Catálogo"}</Badge>{item.discountPercentage ? <Badge className="bg-[#24c75a] text-[#04140a]">-{item.discountPercentage}%</Badge> : null}{item.coupon && <Badge className="bg-[#3a2154] text-[#dcb6ff]">Cupom</Badge>}{item.full && <Badge className="border border-[#365078] bg-[#14233a] text-[#9bc4ff]">Full</Badge>}</div><h3 className="line-clamp-3 min-h-[3.75rem] text-sm font-bold leading-5">{item.title}</h3><div>{item.originalPrice && item.originalPrice > (item.price || 0) ? <p className="text-xs text-[#718079] line-through">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: item.currency || "BRL" }).format(item.originalPrice)}</p> : null}<p className="text-xl font-extrabold text-[#62ef8b]">{item.price != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: item.currency || "BRL" }).format(item.price) : "Preço indisponível"}</p></div><div className="text-[11px] text-[#94a69b]"><p className="truncate">{item.soldQuantity != null ? `${item.soldQuantity} vendidos` : item.itemId || item.catalogProductId || item.id}</p>{item.freeShipping && <p className="font-semibold text-[#8af3a5]">Frete grátis</p>}</div><div className="grid grid-cols-2 gap-1.5"><Button size="sm" onClick={() => void prepareCatalogOffer(item)} disabled={item.price == null || offerPreparing} className="bg-[#24c75a] px-2 font-bold text-[#04140a] hover:bg-[#46df75]"><Send /> Preparar</Button>{item.url ? <Button asChild size="sm" variant="outline" className="border-[#34423a] bg-[#111813] px-2 text-white hover:bg-[#19231c]"><a href={item.url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a></Button> : <Button size="sm" variant="outline" disabled>Abrir</Button>}</div><Button size="sm" onClick={() => void prepareCatalogOffer(item)} variant="ghost" className="h-8 w-full text-xs text-[#9fb0a5] hover:bg-[#121b15] hover:text-white"><Database /> Dados + histórico</Button></CardContent>
                    </Card>
                  ))}</div>}
                </div>

                <div className="space-y-5">
                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none"><CardHeader><CardTitle className="text-base">Filtros disponíveis</CardTitle><CardDescription>São atualizados a cada busca conforme a categoria e a loja.</CardDescription></CardHeader><CardContent>{catalogFilterLabels(catalogFilters).length ? <div className="flex flex-wrap gap-2">{catalogFilterLabels(catalogFilters).map((label) => <Badge key={label} className="border border-[#35513e] bg-[#102018] text-[#dff7e5]">{label}</Badge>)}</div> : <p className="text-sm leading-6 text-[#94a69b]">Faça uma consulta para ver categorias, marcas, condição, frete, faixa de preço e outros refinamentos retornados pela loja.</p>} {catalogFilters ? <details className="mt-4 rounded-xl border border-[#27322b] bg-[#080c09]"><summary className="cursor-pointer px-3 py-3 text-sm font-semibold">Ver filtros completos (JSON)</summary><pre className="max-h-72 overflow-auto border-t border-[#27322b] p-3 text-xs leading-5 text-[#8fd9a4]">{JSON.stringify(catalogFilters, null, 2)}</pre></details> : null}</CardContent></Card>

                </div>
              </div>
              <Dialog open={Boolean(selectedCatalogItem)} onOpenChange={(open) => { if (!open) setSelectedCatalogItem(null); }}>
                <DialogContent className="product-detail-modal max-h-[94vh] overflow-y-auto border-[#d9e1e7] bg-white text-[#243447] sm:max-w-5xl">
                  {selectedCatalogItem && <>
                    <DialogHeader><div className="mb-2 flex flex-wrap gap-2"><Badge className="bg-[#ffe600] text-[#231f00]">{selectedCatalogItem.source === "item" ? "Anúncio oficial" : selectedCatalogItem.source === "best_seller" ? "Mais vendido" : selectedCatalogItem.source === "buy_box" ? "Oferta vencedora" : "Produto"}</Badge>{selectedCatalogItem.discountPercentage ? <Badge className="bg-[#24c75a] text-[#04140a]">{selectedCatalogItem.discountPercentage}% OFF</Badge> : null}{selectedCatalogItem.full && <Badge className="bg-[#14233a] text-[#9bc4ff]">Full</Badge>}</div><DialogTitle className="pr-7 text-xl leading-7">{selectedCatalogItem.title}</DialogTitle><DialogDescription>Revise os dados e personalize exatamente como a oferta será enviada.</DialogDescription></DialogHeader>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]"><div className="aspect-square overflow-hidden rounded-xl bg-white p-3">{selectedCatalogItem.imageUrl ? <img src={selectedCatalogItem.imageUrl} alt={selectedCatalogItem.title} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center"><ShoppingBag className="size-10 text-[#607267]" /></div>}</div><div className="space-y-3"><div className="rounded-xl border border-[#244b31] bg-[#0d1b12] p-4"><p className="text-xs font-semibold text-[#8fa096]">Preço vigente no marketplace</p><p className="mt-1 text-3xl font-black text-[#62ef8b]">{selectedCatalogItem.price == null ? "Sem oferta ativa" : formatMoney(selectedCatalogItem.price, selectedCatalogItem.currency || "BRL")}</p>{selectedCatalogItem.originalPrice && selectedCatalogItem.originalPrice > (selectedCatalogItem.price || 0) ? <div className="mt-2 flex flex-wrap items-center gap-2"><p className="text-sm text-[#8a9a90] line-through">{formatMoney(selectedCatalogItem.originalPrice, selectedCatalogItem.currency || "BRL")}</p><Badge className="bg-[#24c75a] text-[#04140a]">Economia de {formatMoney(selectedCatalogItem.originalPrice - (selectedCatalogItem.price || 0), selectedCatalogItem.currency || "BRL")}</Badge></div> : null}<p className="mt-2 text-[11px] text-[#718079]">Fonte: {selectedCatalogItem.priceSource === "sale_price" ? "preço de venda oficial" : selectedCatalogItem.priceSource === "prices" ? "lista oficial de preços" : selectedCatalogItem.priceSource === "buy_box" ? "oferta vencedora" : "catálogo"}{selectedCatalogItem.priceUpdatedAt ? ` · ${new Date(selectedCatalogItem.priceUpdatedAt).toLocaleString("pt-BR")}` : ""}</p></div><div className="grid grid-cols-2 gap-2 text-sm">{[["Item", selectedCatalogItem.itemId], ["Catálogo", selectedCatalogItem.catalogProductId], ["Categoria", selectedCatalogItem.categoryName || selectedCatalogItem.categoryId], ["Vendedor", selectedCatalogItem.seller], ["Reputação", selectedCatalogItem.sellerReputation], ["Estoque", selectedCatalogItem.availableQuantity], ["Vendidos", selectedCatalogItem.soldQuantity], ["Garantia", selectedCatalogItem.warranty]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-[#111813] p-3"><p className="text-xs text-[#718079]">{label}</p><p className="mt-1 break-words font-semibold">{value == null ? "—" : String(value)}</p></div>)}</div></div></div>
                        <PriceHistoryPanel item={selectedCatalogItem} />
                        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#27322b] bg-[#0d1310] p-4"><p className="text-xs text-[#718079]">Promoção detectada</p><p className="mt-1 font-semibold">{selectedCatalogItem.promotionType || "Nenhuma promoção informada"}</p>{selectedCatalogItem.promotionId && <p className="mt-1 break-all text-xs text-[#94a69b]">{selectedCatalogItem.promotionId}</p>}</div><div className="rounded-xl border border-[#27322b] bg-[#0d1310] p-4"><p className="text-xs text-[#718079]">Cupom</p><p className="mt-1 font-semibold">{selectedCatalogItem.coupon?.code ? String(selectedCatalogItem.coupon.code) : "Não exposto para esta oferta"}</p><p className="mt-1 text-xs leading-5 text-[#718079]">O Mercado Livre restringe detalhes de cupons de vendedores terceiros.</p></div></div>
                        {selectedCatalogItem.reviews?.length ? <div><div className="mb-3 flex items-end justify-between gap-3"><div><p className="font-bold">Primeiras avaliações</p><p className="mt-1 text-xs text-[#718079]">{selectedCatalogItem.reviews.length} de {selectedCatalogItem.reviewsTotal || "várias"} opiniões públicas, com fotos e vídeos ligados a cada texto.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{selectedCatalogItem.reviews.slice(0, 10).map((review, index) => <article key={`${review.position || index}-${review.text || "mídia"}`} className="rounded-xl border border-[#27322b] bg-[#0d1310] p-3"><div className="flex items-center justify-between gap-2 text-xs"><span className="text-[#ffe45f]">{"★".repeat(Math.round(review.rating || 0))}{"☆".repeat(Math.max(0, 5 - Math.round(review.rating || 0)))}</span><span className="text-[#718079]">{[...new Set([review.country, review.date].filter(Boolean))].join(" · ")}</span></div><p className="mt-2 text-sm leading-6 text-[#dce9df]">{review.text || "Avaliação publicada somente com mídia."}</p>{review.videos?.length ? <div className="mt-3 grid grid-cols-2 gap-1.5">{review.videos.map((url) => <video key={url} src={url} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black object-cover" />)}</div> : null}{review.images?.length ? <div className="mt-3 grid grid-cols-4 gap-1.5">{review.images.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Foto enviada nesta avaliação" loading="lazy" className="aspect-square w-full rounded-lg object-cover" /></a>)}</div> : null}{review.usefulCount ? <p className="mt-2 text-xs text-[#718079]">{review.usefulCount} pessoas acharam útil</p> : null}</article>)}</div></div> : null}
                        {selectedCatalogItem.attributes?.length ? <div><p className="mb-3 text-sm font-bold text-[#b7c4bc]">Ficha técnica ({selectedCatalogItem.attributes.length})</p><div className="grid gap-2 sm:grid-cols-2">{selectedCatalogItem.attributes.slice(0, 40).map((attribute, index) => <div key={`${String(attribute.id || attribute.name)}-${index}`} className="rounded-lg border border-[#27322b] bg-[#0d1310] px-3 py-2"><p className="text-xs text-[#718079]">{String(attribute.name || attribute.id || "Atributo")}</p><p className="mt-1 text-sm font-medium">{String(attribute.value_name || attribute.valueName || attribute.value_id || "—")}</p></div>)}</div></div> : null}
                        <details className="rounded-xl border border-[#27322b] bg-[#080c09]"><summary className="cursor-pointer px-3 py-3 text-sm font-semibold">Resposta completa da API</summary><div className="border-t border-[#27322b] p-3"><Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(JSON.stringify(selectedCatalogItem, null, 2)); toast.success("Dados copiados."); }} className="mb-3 border-[#34423a] bg-[#111813] text-white"><Copy /> Copiar JSON</Button><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs leading-5 text-[#8fd9a4]">{JSON.stringify(selectedCatalogItem, null, 2)}</pre></div></details>
                      </div>
                      <div className="space-y-4 lg:sticky lg:top-0 lg:self-start"><div className="rounded-2xl border border-[#31543b] bg-[#0b1710] p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-[#8af3a5]">Mensagem para o WhatsApp</p><p className="mt-1 text-xs leading-5 text-[#94a69b]">Edite livremente antes de enviar.</p></div>{offerPreparing && <LoaderCircle className="size-5 animate-spin text-[#62ef8b]" />}</div><Textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} rows={10} className="mt-4 min-h-56 resize-y border-[#34423a] bg-[#070b08] leading-6" /><div className="mt-4 space-y-3"><label className="space-y-2 text-sm font-semibold">Grupo de destino<NativeSelect value={offerDestination} onChange={(event) => setOfferDestination(event.target.value)}><NativeSelectOption value="">Escolha um grupo</NativeSelectOption>{destinationGroups.map((destination) => <NativeSelectOption key={destination.JID} value={destination.JID}>{destination.Name}</NativeSelectOption>)}</NativeSelect></label><div className="flex items-center justify-between rounded-xl border border-[#27322b] bg-[#080c09] p-3"><div><p className="text-sm font-semibold">Enviar foto oficial</p><p className="mt-1 text-xs text-[#718079]">Usa a imagem extraída da loja.</p></div><Switch checked={offerIncludeImage} onCheckedChange={setOfferIncludeImage} disabled={!selectedCatalogItem.imageUrl} aria-label="Enviar foto oficial" /></div><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => { void navigator.clipboard.writeText(offerMessage); toast.success("Mensagem copiada."); }} className="border-[#34423a] bg-[#111813] text-white"><Copy /> Copiar</Button><Button onClick={() => void sendPreparedOffer()} disabled={offerSending || offerPreparing || !offerDestination || !offerMessage.trim()} className="bg-[#24c75a] font-extrabold text-[#04140a] hover:bg-[#46df75]">{offerSending ? <LoaderCircle className="animate-spin" /> : <Send />} Enviar agora</Button></div></div></div></div>
                    </div>
                  </>}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="monitoring" id="radar-de-ofertas">
              <div className="space-y-5 rounded-3xl bg-[#f4f6f8] p-4 text-[#243447] sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-[#dfe5eb] bg-white shadow-[0_8px_30px_rgba(31,54,76,.08)]">
                  <div className="border-b border-[#e8edf1] bg-[linear-gradient(110deg,#eef8ff,#fff_58%)] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#0874c9]"><Radar className="size-5" /> MONITORAMENTO EM TEMPO QUASE REAL</div><h2 className="text-2xl font-black text-[#1b2b3a]">Novas ofertas do dia</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#667788]">O coletor abre a vitrine pública do Mercado Livre em intervalos regulares, compara IDs já vistos e destaca somente novidades que atendem aos seus filtros.</p></div><div className={`rounded-full px-4 py-2 text-sm font-bold ${monitoringActive ? "bg-[#e8f8ef] text-[#138244]" : "bg-[#edf1f4] text-[#687785]"}`}>{monitoringActive ? "● Radar ativo" : "○ Radar pausado"}</div></div>
                  </div>
                  <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
                    <label className="space-y-2 text-sm font-bold">Categoria<NativeSelect value={monitoringCategory} onChange={(event) => setMonitoringCategory(event.target.value)} className="border-[#d8e0e6] bg-white text-[#253545]"><NativeSelectOption value="Geral">Geral</NativeSelectOption>{mercadoLivreCategories.map((category) => <NativeSelectOption key={category.id} value={category.name}>{category.name}</NativeSelectOption>)}</NativeSelect></label>
                    <label className="space-y-2 text-sm font-bold">Desconto mínimo<NativeSelect value={monitoringMinDiscount} onChange={(event) => setMonitoringMinDiscount(event.target.value)} className="border-[#d8e0e6] bg-white text-[#253545]"><NativeSelectOption value="0">Qualquer</NativeSelectOption><NativeSelectOption value="10">10% ou mais</NativeSelectOption><NativeSelectOption value="20">20% ou mais</NativeSelectOption><NativeSelectOption value="30">30% ou mais</NativeSelectOption><NativeSelectOption value="40">40% ou mais</NativeSelectOption></NativeSelect></label>
                    <label className="space-y-2 text-sm font-bold">Atualizar a cada<NativeSelect value={monitoringIntervalMinutes} onChange={(event) => setMonitoringIntervalMinutes(event.target.value)} className="border-[#d8e0e6] bg-white text-[#253545]"><NativeSelectOption value="1">1 minuto</NativeSelectOption><NativeSelectOption value="2">2 minutos</NativeSelectOption><NativeSelectOption value="5">5 minutos</NativeSelectOption><NativeSelectOption value="10">10 minutos</NativeSelectOption></NativeSelect></label>
                    <label className="flex h-[42px] items-center justify-between self-end rounded-lg border border-[#d8e0e6] bg-[#f9fbfc] px-3 text-sm font-bold"><span>Só com cupom</span><Switch checked={monitoringCouponsOnly} onCheckedChange={setMonitoringCouponsOnly} /></label>
                    <Button onClick={() => setMonitoringActive((value) => !value)} className={`h-[42px] self-end font-extrabold ${monitoringActive ? "bg-[#263746] text-white hover:bg-[#34495a]" : "bg-[#087bd3] text-white hover:bg-[#076bb7]"}`}>{monitoringLoading ? <LoaderCircle className="animate-spin" /> : <Radar />} {monitoringActive ? "Pausar radar" : "Iniciar radar"}</Button>
                  </div>
                </section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-xl font-black">Ofertas detectadas</h3><p className="mt-1 text-sm text-[#6d7d8a]">Clique no produto para abrir a janela completa e enviar ao seu grupo.</p></div><p className="text-xs font-semibold text-[#758592]">{monitoringLastScan ? `Última leitura: ${new Date(monitoringLastScan).toLocaleString("pt-BR")}` : "Aguardando a primeira leitura"}</p></div>
                {monitoringError && <div className="rounded-xl border border-[#f1c8c8] bg-[#fff2f2] p-4 text-sm text-[#a13b3b]">{monitoringError}</div>}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{monitoringDeals.map((item) => <button key={item.id} type="button" onClick={() => openMonitoredDeal(item)} className="group overflow-hidden rounded-2xl border border-[#dce3e8] bg-white text-left shadow-[0_6px_22px_rgba(31,54,76,.07)] transition hover:-translate-y-1 hover:border-[#8fc5ea] hover:shadow-[0_14px_32px_rgba(31,54,76,.14)]"><div className="relative aspect-[4/3] bg-white p-4">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain transition group-hover:scale-[1.025]" /> : <div className="grid h-full place-items-center"><ShoppingBag className="size-10 text-[#9ba8b3]" /></div>}<div className="absolute left-3 top-3 rounded-full bg-[#12a55c] px-3 py-1 text-xs font-black text-white">{item.discountPercentage ? `-${item.discountPercentage}%` : `${item.dealScore || 0} pts`}</div></div><div className="space-y-3 border-t border-[#edf1f4] p-4"><h4 className="line-clamp-3 min-h-[3.75rem] text-sm font-bold leading-5 text-[#263746]">{item.title}</h4><div>{item.originalPrice && item.originalPrice > (item.price || 0) ? <p className="text-xs text-[#8b98a3] line-through">{formatMoney(item.originalPrice)}</p> : null}<p className="text-2xl font-black text-[#087bd3]">{formatMoney(item.price)}</p></div><div className="flex flex-wrap gap-1.5">{item.coupon && <span className="rounded-md bg-[#fff2c8] px-2 py-1 text-[11px] font-bold text-[#826600]">CUPOM</span>}{item.scoreReasons?.slice(0, 2).map((reason) => <span key={reason} className="rounded-md bg-[#eef2f5] px-2 py-1 text-[11px] text-[#617180]">{reason}</span>)}</div><p className="text-xs font-extrabold text-[#087bd3]">Ver oferta e enviar →</p></div></button>)}</div>
                {!monitoringDeals.length && <div className="rounded-2xl border border-dashed border-[#cbd5dc] bg-white p-12 text-center"><Radar className="mx-auto mb-3 size-10 text-[#97a8b5]" /><p className="font-bold">Nenhuma leitura feita ainda</p><p className="mt-1 text-sm text-[#71808d]">Ligue o coletor local e clique em “Iniciar radar”.</p></div>}
                <p className="rounded-xl border border-[#dbe6ee] bg-[#eef7fd] p-4 text-xs leading-5 text-[#4f6575]"><strong>Limite técnico:</strong> isto é uma varredura periódica, não um webhook do Mercado Livre. Ela funciona enquanto o coletor e esta página estiverem abertos. Intervalos muito curtos podem acionar validações do marketplace; 2 a 5 minutos é o uso mais seguro.</p>
              </div>
            </TabsContent>

            <TabsContent value="templates" id="layout-das-mensagens">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Card className="border-[#dce4e9] bg-white text-[#243447] shadow-[0_10px_35px_rgba(31,54,76,.08)]">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><LayoutTemplate className="size-5 text-[#087bd3]" /> Biblioteca de layouts</CardTitle><CardDescription>Salve até 10 modelos e troque o formato da mensagem com um clique.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <label className="space-y-2 text-sm font-bold">Modelo ativo<NativeSelect value={activeOfferTemplateId} onChange={(event) => selectOfferTemplate(event.target.value)} className="border-[#d8e0e6] bg-white text-[#253545]">{offerTemplates.map((preset) => <NativeSelectOption key={preset.id} value={preset.id}>{preset.name}</NativeSelectOption>)}</NativeSelect></label>
                      <label className="space-y-2 text-sm font-bold">Nome do modelo<Input value={offerTemplateName} onChange={(event) => setOfferTemplateName(event.target.value.slice(0, 40))} maxLength={40} placeholder="Ex.: Oferta com cupom" className="h-11 border-[#d8e0e6] bg-white text-[#253545]" /></label>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-[#dce4e9] bg-[#f6f9fb] px-3 py-2 text-sm"><span><strong>{offerTemplates.length}</strong> de 10 modelos salvos</span><span className="text-xs text-[#6e7e8b]">O selecionado será usado nas próximas ofertas</span></div>
                    <Textarea value={offerTemplate} onChange={(event) => setOfferTemplate(event.target.value)} rows={16} className="min-h-[390px] border-[#d8e0e6] bg-[#fbfcfd] font-mono text-sm leading-6 text-[#263746]" />
                    <div className="flex flex-wrap gap-2"><Button onClick={saveOfferTemplate} className="bg-[#087bd3] font-extrabold text-white hover:bg-[#076bb7]"><Check /> Salvar alterações</Button><Button variant="outline" onClick={saveOfferTemplateAsNew} disabled={offerTemplates.length >= 10} className="border-[#9bc8e7] bg-[#eef8ff] text-[#086fac]"><Plus /> Salvar como novo</Button><Button variant="outline" onClick={deleteOfferTemplate} disabled={offerTemplates.length <= 1} className="border-[#efcaca] bg-white text-[#a83c3c]"><X /> Excluir</Button><Button variant="outline" onClick={() => setOfferTemplate(defaultOfferTemplate)} className="border-[#cfd8df] bg-white text-[#263746]"><RefreshCw /> Restaurar texto padrão</Button></div>
                    {templateSavedAt && <p className="text-xs text-[#6e7e8b]">Salvo em {new Date(templateSavedAt).toLocaleString("pt-BR")}.</p>}
                  </CardContent>
                </Card>
                <div className="space-y-5"><Card className="border-[#dce4e9] bg-white text-[#243447] shadow-none"><CardHeader><CardTitle className="text-base">Variáveis disponíveis</CardTitle><CardDescription>Clique em uma variável para copiá-la.</CardDescription></CardHeader><CardContent className="space-y-2">{offerTemplateVariables.map(([variable, description]) => <button key={variable} type="button" onClick={() => { void navigator.clipboard.writeText(variable); toast.success(`${variable} copiada.`); }} className="w-full rounded-xl border border-[#e0e6eb] bg-[#f8fafb] p-3 text-left hover:border-[#8fc5ea] hover:bg-[#f1f8fd]"><code className="text-xs font-black text-[#0874c9]">{variable}</code><p className="mt-1 text-xs leading-5 text-[#6d7c89]">{description}</p></button>)}</CardContent></Card><Card className="border-[#dce4e9] bg-[#f4f9fd] text-[#243447] shadow-none"><CardHeader><CardTitle className="text-base">Como os campos opcionais funcionam</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-[#5e6f7d]">Prefira as variáveis que começam com <code>linha_</code>. Quando não houver preço anterior, cupom, desconto ou frete, a linha inteira some sem deixar espaço vazio.</CardContent></Card></div>
              </div>
            </TabsContent>

            <TabsContent value="credentials" id="credenciais">
              <div className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-2">
                  <Card className="overflow-hidden border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardHeader className="border-b border-[#27322b]"><CardTitle className="flex items-center gap-2 text-lg"><Smartphone className="size-5 text-[#62ef8b]" /> UAZAPI</CardTitle><CardDescription>Instância usada para monitorar e publicar nos grupos.</CardDescription></CardHeader>
                    <CardContent className="space-y-4 pt-5">
                      <label className="block space-y-2 text-sm font-semibold">URL do servidor<Input value={whatsapp.serverUrl} onChange={(event) => setWhatsapp((value) => ({ ...value, serverUrl: event.target.value }))} placeholder="https://free.uazapi.com" className="h-11 border-[#34423a] bg-[#080c09]" /></label>
                      <label className="block space-y-2 text-sm font-semibold"><span className="flex items-center justify-between"><span>Instance Token</span><button type="button" onClick={() => setWhatsappTokenVisible((value) => !value)} className="flex items-center gap-1.5 text-xs text-[#62ef8b]">{whatsappTokenVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{whatsappTokenVisible ? "Ocultar" : "Mostrar"}</button></span><Input type={whatsappTokenVisible ? "text" : "password"} value={whatsapp.instanceToken} onChange={(event) => { setWhatsapp((value) => ({ ...value, instanceToken: event.target.value })); setWhatsappConnected(false); }} placeholder="Cole o token da instância" className="h-11 border-[#34423a] bg-[#080c09] font-mono text-sm" /></label>
                      <div className="flex flex-wrap gap-2"><Button onClick={() => void testWhatsappConnection()} disabled={whatsappTesting} className="bg-[#24c75a] font-bold text-[#04140a] hover:bg-[#46df75]">{whatsappTesting ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Testar conexão</Button><Button onClick={() => void setupUazapiWebhook()} disabled={webhookSettingUp || (!whatsapp.instanceToken && !whatsappConnected)} variant="outline" className="border-[#2e7041] bg-[#112a19] text-[#8ef1aa]">{webhookSettingUp ? <LoaderCircle className="animate-spin" /> : <Webhook />} Ativar webhook</Button></div>
                      <p className="text-xs leading-5 text-[#94a69b]">Salvamento automático neste navegador. Estado: <strong className={whatsappConnected ? "text-[#62ef8b]" : "text-[#e6c47d]"}>{whatsappConnected ? `conectado · ${groups.length} grupos` : "aguardando teste"}</strong>.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Link2 className="size-5 text-[#62ef8b]" /> Afiliados</CardTitle><CardDescription>Identificadores aplicados automaticamente ao gerar promoções.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><label className="space-y-2 text-sm font-semibold">Tag do Mercado Livre<Input value={affiliate.mercadoLivreLabel} onChange={(event) => setAffiliate((value) => ({ ...value, mercadoLivreLabel: event.target.value }))} placeholder="promozap" className="h-11 border-[#34423a] bg-[#080c09]" /></label><label className="flex h-11 items-center gap-2 rounded-xl border border-[#34423a] px-3 text-sm"><Switch checked={affiliate.mercadoLivreEnabled} onCheckedChange={(mercadoLivreEnabled) => setAffiliate((value) => ({ ...value, mercadoLivreEnabled }))} /> Ativo</label></div>
                      <label className="block space-y-2 text-sm font-semibold">Domínio de redirecionamento<Input value={affiliate.redirectDomain} onChange={(event) => setAffiliate((value) => ({ ...value, redirectDomain: event.target.value }))} placeholder="https://go.promozap.com.br" className="h-11 border-[#34423a] bg-[#080c09]" /></label>
                      <Button onClick={() => void saveAffiliate()} disabled={saving} className="bg-[#24c75a] font-bold text-[#04140a] hover:bg-[#46df75]">{saving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Salvar afiliados</Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Cookie className="size-5 text-[#62ef8b]" /> Sessão do Mercado Livre</CardTitle><CardDescription>Cookies usados somente para gerar o link curto oficial.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <label className="block space-y-2 text-sm font-semibold"><span className="flex items-center justify-between"><span>Cookies da sessão</span><button type="button" onClick={() => setMlCookiesVisible((value) => !value)} className="flex items-center gap-1.5 text-xs text-[#62ef8b]">{mlCookiesVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{mlCookiesVisible ? "Ocultar" : "Mostrar"}</button></span><Textarea value={mlSessionCookies} onChange={(event) => setMlSessionCookies(event.target.value)} rows={4} spellCheck={false} placeholder={'[{ "domain": "...", "name": "...", "value": "..." }]'} className={`min-h-28 resize-y border-[#34423a] bg-[#080c09] font-mono text-xs ${mlCookiesVisible ? "text-white" : "text-transparent caret-white"}`} /></label>
                      <div className="rounded-xl border border-[#244c31] bg-[#0d1d12] p-3 text-xs leading-5 text-[#a7cbb2]">Os cookies são criptografados no servidor e atualizados quando o Mercado Livre renova a sessão.</div>
                      <Button onClick={() => void saveAffiliate()} disabled={saving} variant="outline" className="border-[#2e7041] bg-[#112a19] text-[#8ef1aa]">{saving ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} Salvar sessão</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Database className="size-5 text-[#62ef8b]" /> APIs de catálogo</CardTitle><CardDescription>Credenciais para consulta estruturada de produtos.</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                      <Input value={mercadoLivreClientId} onChange={(event) => setMercadoLivreClientId(event.target.value)} placeholder="Mercado Livre Client ID" className="h-11 border-[#34423a] bg-[#080c09]" />
                      <Input type="password" value={mercadoLivreClientSecret} onChange={(event) => setMercadoLivreClientSecret(event.target.value)} placeholder="Mercado Livre Client Secret" className="h-11 border-[#34423a] bg-[#080c09]" />
                      <Input type="password" value={mercadoLivreAccessToken} onChange={(event) => setMercadoLivreAccessToken(event.target.value)} placeholder="Access Token temporário (opcional)" className="h-11 border-[#34423a] bg-[#080c09]" />
                      <div className="flex flex-wrap gap-2"><Button onClick={() => void saveCatalogCredentials()} disabled={catalogCredentialsSaving} variant="outline" className="border-[#2e7041] bg-[#112a19] text-[#8ef1aa]">{catalogCredentialsSaving ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} Salvar APIs</Button><Button onClick={() => void connectMercadoLivre()} disabled={mercadoLivreConnecting} className="bg-[#ffe600] font-bold text-[#231f00] hover:bg-[#fff05a]">{mercadoLivreConnecting ? <LoaderCircle className="animate-spin" /> : <ExternalLink />} Conectar Mercado Livre</Button></div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PackageSearch className="size-5 text-[#62ef8b]" /> Coletor local</CardTitle><CardDescription>Endereço e token do navegador que extrai preço, cupom e avaliações.</CardDescription></CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"><label className="space-y-2 text-sm font-semibold">URL do coletor<Input value={localCollectorUrl} onChange={(event) => setLocalCollectorUrl(event.target.value)} placeholder="http://127.0.0.1:8765" className="h-11 border-[#34423a] bg-[#080c09]" /></label><label className="space-y-2 text-sm font-semibold">Token do coletor<Input type="password" value={localCollectorToken} onChange={(event) => setLocalCollectorToken(event.target.value)} placeholder="Token exibido no coletor" className="h-11 border-[#34423a] bg-[#080c09]" /></label><Button onClick={() => void checkLocalCollector(true)} variant="outline" className="h-11 border-[#2e7041] bg-[#112a19] text-[#8ef1aa]"><RefreshCw /> Testar</Button></CardContent>
                </Card>

                <Card className="border-[#27322b] bg-[#0b100d] shadow-none">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MessageCircleMore className="size-5 text-[#62ef8b]" /> Carrossel e botão de compra</CardTitle><CardDescription>Escolha entre o envio simples ou o carrossel com avaliações. No carrossel, todos os cartões usam o mesmo link.</CardDescription></CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 rounded-xl border border-[#34423a] bg-[#080c09] p-4 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
                      <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold">Enviar com carrossel</span><span className="mt-1 block text-xs leading-5 text-[#94a69b]">Desligado: envia somente foto oficial, texto e link normal. Ligado: acrescenta até quatro avaliações com mídia.</span></span><Switch checked={carouselEnabled} onCheckedChange={updateCarouselEnabled} /></label>
                      <label className="space-y-2 text-sm font-bold">Texto do botão<NativeSelect value={carouselButtonLabel} onChange={(event) => updateCarouselButtonLabel(event.target.value)} disabled={!carouselEnabled} className="border-[#34423a] bg-[#080c09]">{Array.from(new Set(["VER OFERTA", ...buttonSettings.labels])).map((label) => <NativeSelectOption key={label} value={label}>{label}</NativeSelectOption>)}</NativeSelect></label>
                    </div>
                    <div><p className="mb-2 text-sm font-bold">Frases disponíveis para o botão</p><div className="flex flex-wrap gap-2">{buttonSettings.labels.map((label, index) => <div key={`${label}-${index}`} className="flex items-center gap-2 rounded-full border border-[#35513e] bg-[#102018] py-1.5 pl-3 pr-1.5 text-sm font-semibold"><span>{label}</span><button type="button" onClick={() => setButtonSettings((current) => ({ ...current, labels: current.labels.filter((_, itemIndex) => itemIndex !== index) }))} className="grid size-6 place-items-center rounded-full hover:bg-[#2b3b30]"><X className="size-3.5" /></button></div>)}</div></div>
                    <div className="flex flex-col gap-2 sm:flex-row"><Input value={buttonDraft} onChange={(event) => setButtonDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addButtonLabel(); } }} maxLength={25} placeholder="Ex.: GARANTA AQUI" className="h-11 border-[#34423a] bg-[#080c09]" /><Button onClick={addButtonLabel} variant="outline" className="border-[#2e7041] bg-[#112a19] text-[#8ef1aa]"><Plus /> Adicionar</Button><Button onClick={() => void saveButtonSettings()} disabled={buttonSettingsSaving} className="bg-[#24c75a] font-bold text-[#04140a]">{buttonSettingsSaving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Salvar frases</Button></div>
                    <p className="text-xs leading-5 text-[#94a69b]">A opção de carrossel e o texto selecionado são salvos automaticamente neste navegador. As frases cadastradas continuam salvas no painel.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logs" id="logs">
              <Card className="overflow-hidden border-[#27322b] bg-[#080c09] text-white shadow-none">
                <CardHeader className="grid gap-3 border-b border-[#27322b] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div><CardTitle className="flex items-center gap-2 text-lg"><ScrollText className="size-5 text-[#62ef8b]" /> Log provisório da UAZAPI</CardTitle><CardDescription className="mt-1 text-[#94a69b]">Atualiza automaticamente a cada seis segundos.</CardDescription></div>
                  <Button onClick={() => void loadAutomationLogs()} disabled={logsLoading} variant="outline" className="h-10 rounded-lg border-[#34423a] bg-[#111813] text-white hover:bg-[#19231c]"><RefreshCw className={logsLoading ? "animate-spin" : ""} /> Atualizar</Button>
                </CardHeader>
                <CardContent className="max-h-[520px] space-y-2 overflow-y-auto p-3 sm:p-4">
                  {logsLoading && automationLogs.length === 0 ? (
                    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-[#94a69b]"><LoaderCircle className="size-5 animate-spin text-[#62ef8b]" /> Carregando eventos...</div>
                  ) : automationLogs.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center text-center"><ScrollText className="mb-3 size-8 text-[#536158]" /><p className="font-semibold">Nenhum evento recebido ainda</p><p className="mt-1 text-sm text-[#94a69b]">Ative o webhook e envie um link em um grupo-fonte.</p></div>
                  ) : automationLogs.map((entry) => (
                    <div key={entry.id} className="grid gap-2 rounded-xl border border-[#27322b] bg-[#0d1310] p-3 sm:grid-cols-[116px_minmax(0,1fr)_auto] sm:items-start">
                      <span className={`w-fit rounded-full border px-2 py-1 text-xs font-bold ${entry.level === "success" ? "border-[#2d7543] bg-[#12301c] text-[#7cf399]" : entry.level === "error" ? "border-[#784235] bg-[#2a1612] text-[#ff9b92]" : entry.level === "warning" ? "border-[#6e5d25] bg-[#29220b] text-[#f0d274]" : "border-[#3b4b41] bg-[#18201b] text-[#b8c6bc]"}`}>{entry.stage}</span>
                      <div className="min-w-0"><p className="text-sm font-medium leading-6 text-[#eef6f0]">{entry.message}</p>{entry.groupJid && <p className="mt-1 truncate text-xs text-[#7f9085]">Grupo: {entry.groupJid}</p>}</div>
                      <time className="text-xs text-[#738078]">{new Date(entry.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
      </div>
    </main>
  );
}
