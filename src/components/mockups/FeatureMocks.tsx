import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Clock,
  Eye,
  Link2,
  MessageSquare,
  Plus,
  Shield,
  UserPlus,
} from "lucide-react";
import { Panel, Bars } from "@/components/mockups/Panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ---------------- Grupos ---------------- */

const GROUPS = [
  { name: "Comunidade Principal", members: 892, status: "Ativo", activity: "Alta", autos: 6 },
  { name: "Ofertas Premium", members: 431, status: "Monitorado", activity: "Média", autos: 4 },
  { name: "Suporte Clientes", members: 218, status: "Ativo", activity: "Alta", autos: 8 },
  { name: "Turma Setembro", members: 96, status: "Pausado", activity: "Baixa", autos: 2 },
];

const statusTone: Record<string, string> = {
  Ativo: "border-primary/30 bg-primary/12 text-primary",
  Monitorado: "border-border-strong bg-surface-2 text-foreground/80",
  Pausado: "border-warning/30 bg-warning/12 text-warning",
};

export function GroupsMock() {
  return (
    <Panel title="TudoZap — Grupos">
      <div className="flex flex-wrap gap-2">
        {["Todos", "Ativos", "Pausados", "Monitorados"].map((f, i) => (
          <span
            key={f}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              i === 0
                ? "border-primary/30 bg-primary/12 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {f}
          </span>
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {GROUPS.map((g) => (
          <li
            key={g.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface/70 p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{g.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {g.members} participantes • atividade {g.activity} • {g.autos} automações
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px]",
                statusTone[g.status],
              )}
            >
              {g.status}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------------- Reações ---------------- */

export function ReactionsMock() {
  return (
    <Panel title="TudoZap — Reações automáticas">
      <div className="rounded-xl border border-border bg-surface/70 p-3">
        <p className="text-xs text-muted-foreground">Regra</p>
        <p className="mt-1 text-sm">
          Quando uma nova mensagem for enviada{" "}
          <ArrowRight className="mx-1 inline size-3.5 text-primary" /> aplicar reação
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          {[
            ["Percentual", "35% das msgs"],
            ["Intervalo", "20–60s"],
            ["Grupos", "12 selecionados"],
            ["Tipos", "5 reações"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-surface-2/70 px-2.5 py-2">
              <p className="truncate text-muted-foreground">{k}</p>
              <p className="mt-0.5 truncate font-medium">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {[
          { text: "Pessoal, saiu a nova atualização do painel!", reactions: ["👍", "🔥"] },
          { text: "Alguém pode confirmar o horário da live?", reactions: ["❤️", "👏"] },
          { text: "Fechei mais 3 clientes essa semana", reactions: ["🔥", "👏", "😂"] },
        ].map((m) => (
          <div key={m.text} className="relative rounded-xl border border-border bg-surface/70 p-3">
            <p className="pr-2 text-sm text-foreground/85">{m.text}</p>
            <div className="mt-2 flex gap-1.5">
              {m.reactions.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Blacklist usuários ---------------- */

const BL_USERS = [
  { name: "Carlos M.", phone: "+55 11 9•••• 4821", reason: "Spam recorrente", date: "12/08" },
  { name: "Renata P.", phone: "+55 21 9•••• 3390", reason: "Links proibidos", date: "09/08" },
  { name: "Diego S.", phone: "+55 31 9•••• 7712", reason: "Conteúdo fora das regras", date: "04/08" },
];

export function BlacklistUsersMock() {
  return (
    <Panel title="TudoZap — Blacklist de usuários">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary">
          <Plus className="size-3.5" /> Adicionar à blacklist
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground">
          <Ban className="size-3.5" /> Remover
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> Ver histórico
        </span>
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-xl border border-border sm:block">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2/70 text-muted-foreground">
            <tr>
              {["Nome", "Telefone", "Motivo", "Data", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BL_USERS.map((u) => (
              <tr key={u.name} className="border-t border-border">
                <td className="px-3 py-2.5">{u.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.phone}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.reason}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.date}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="destructive">Bloqueado</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 space-y-2.5 sm:hidden">
        {BL_USERS.map((u) => (
          <li key={u.name} className="rounded-xl border border-border bg-surface/70 p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{u.name}</p>
              <Badge variant="destructive">Bloqueado</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{u.phone}</p>
            <p className="mt-0.5 text-muted-foreground">
              {u.reason} • {u.date}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------------- Palavras e URLs ---------------- */

export function WordsUrlsMock() {
  return (
    <Panel title="TudoZap — Palavras e URLs">
      <p className="text-xs text-muted-foreground">Palavras bloqueadas</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["spam", "promoção indesejada", "conteúdo proibido"].map((w) => (
          <span
            key={w}
            className="rounded-lg border border-border bg-surface-2/70 px-2.5 py-1 text-xs"
          >
            {w}
          </span>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">Domínios bloqueados</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["exemplo.com", "spam.com"].map((w) => (
          <span
            key={w}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
          >
            <Link2 className="size-3" />
            {w}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {[
          ["Bloquear URLs desconhecidas", true],
          ["Avisar administrador", true],
          ["Executar ação automaticamente", false],
        ].map(([label, on]) => (
          <div
            key={label as string}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 px-3 py-2.5"
          >
            <span className="min-w-0 truncate text-sm">{label as string}</span>
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                on ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-background transition-all",
                  on ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Fiscal ---------------- */

export function FiscalMock() {
  return (
    <Panel title="Fiscal TudoZap">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Grupo: Comunidade Principal</p>
          <p className="text-xs text-muted-foreground">Varredura contínua ativa</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/12 px-2.5 py-1 text-[11px] text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" /> Monitorando
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          ["Mensagens", "8.432"],
          ["Alertas", "14"],
          ["Ações", "9"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface/70 p-3">
            <p className="truncate text-[11px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-lg font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {[
          { icon: Link2, text: "URL bloqueada identificada", tone: "text-destructive" },
          { icon: AlertTriangle, text: "Palavra da blacklist identificada", tone: "text-warning" },
          { icon: Eye, text: "Usuário monitorado identificado", tone: "text-primary" },
        ].map((f) => (
          <li
            key={f.text}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/70 px-3 py-2.5 text-sm"
          >
            <f.icon className={cn("size-4 shrink-0", f.tone)} />
            <span className="min-w-0 truncate">{f.text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------------- Respostas automáticas ---------------- */

function RuleCard({ when, then }: { when: string; then: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/70 p-3">
      <p className="text-[11px] font-medium tracking-wide text-primary uppercase">Se</p>
      <p className="mt-1 text-sm">
        Mensagem contém <span className="rounded bg-surface-2 px-1.5 py-0.5 text-primary">{when}</span>
      </p>
      <div className="my-2.5 ml-1 h-4 w-px bg-border-strong" />
      <p className="text-[11px] font-medium tracking-wide text-primary uppercase">Então</p>
      <p className="mt-1 text-sm text-foreground/85">{then}</p>
    </div>
  );
}

export function AutoReplyMock() {
  return (
    <Panel title="TudoZap — Construtor de respostas">
      <div className="space-y-3">
        <RuleCard when="preço" then="Responder: “Olá! Veja nossos planos disponíveis...”" />
        <RuleCard when="suporte" then="Encaminhar para atendimento" />
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-xs text-muted-foreground">
        <Plus className="size-3.5" /> Adicionar nova regra
      </div>
    </Panel>
  );
}

/* ---------------- CRM ---------------- */

const COLUMNS = [
  {
    title: "Novo contato",
    cards: [{ name: "Amanda Ribeiro", phone: "+55 11 9•••• 2210", last: "Hoje, 09:12", owner: "Bruno", tags: ["Lead"] }],
  },
  {
    title: "Em atendimento",
    cards: [{ name: "João Silva", phone: "+55 11 9•••• 8841", last: "Hoje, 14:32", owner: "Mariana", tags: ["Lead", "VIP"] }],
  },
  {
    title: "Interessado",
    cards: [{ name: "Pedro Alves", phone: "+55 41 9•••• 5567", last: "Ontem, 18:04", owner: "Mariana", tags: ["Instagram"] }],
  },
  {
    title: "Proposta enviada",
    cards: [{ name: "Luiza Costa", phone: "+55 31 9•••• 1123", last: "Ontem, 11:20", owner: "Bruno", tags: ["Proposta"] }],
  },
  {
    title: "Cliente",
    cards: [{ name: "Rafael Dias", phone: "+55 51 9•••• 7788", last: "12/08, 16:45", owner: "Equipe", tags: ["Ativo"] }],
  },
];

export function CrmMock() {
  return (
    <Panel title="TudoZap — CRM" bodyClassName="p-0">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="min-w-0 overflow-x-auto p-4 sm:p-5">
          <div className="flex min-w-[720px] gap-3">
            {COLUMNS.map((col) => (
              <div key={col.title} className="w-[190px] shrink-0">
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="truncate text-xs font-medium text-muted-foreground">{col.title}</p>
                  <span className="text-[11px] text-muted-foreground">{col.cards.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {col.cards.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-xl border border-border bg-surface/80 p-3 transition-transform hover:-translate-y-0.5"
                    >
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.phone}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{c.last}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 truncate text-[11px] text-muted-foreground">
                        Resp.: {c.owner}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="border-t border-border bg-surface/60 p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <p className="text-sm font-semibold">João Silva</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Lead", "VIP", "Instagram"].map((t) => (
              <span
                key={t}
                className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
              >
                {t}
              </span>
            ))}
          </div>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Último contato</dt>
              <dd className="truncate">Hoje, 14:32</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Responsável</dt>
              <dd className="truncate">Mariana</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-2">
            {[
              { me: false, text: "Oi, queria saber o preço do plano Pro." },
              { me: true, text: "Olá João! Te envio agora os detalhes 👇" },
            ].map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[92%] rounded-xl px-3 py-2 text-xs",
                  m.me
                    ? "ml-auto bg-primary/15 text-foreground"
                    : "bg-surface-2 text-foreground/85",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground">
            <MessageSquare className="size-4" /> Abrir conversa
          </div>
        </aside>
      </div>
    </Panel>
  );
}

/* ---------------- Fluxo de automações ---------------- */

const BRANCHES = [
  { icon: Ban, title: "Palavra bloqueada", action: "Executar regra" },
  { icon: Shield, title: "Usuário na blacklist", action: "Executar ação" },
  { icon: MessageSquare, title: "Palavra-chave", action: "Responder automaticamente" },
  { icon: UserPlus, title: "Contato interessado", action: "Adicionar ao CRM" },
];

export function FlowMock() {
  return (
    <div className="rounded-2xl border border-border panel-gradient p-5 sm:p-8">
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface/80 px-4 py-3 text-center text-sm">
        Mensagem recebida
      </div>
      <div className="mx-auto h-6 w-px bg-border-strong" />
      <div className="mx-auto max-w-sm rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-primary">
        TudoZap analisa
      </div>
      <div className="mx-auto h-6 w-px bg-border-strong" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BRANCHES.map((b) => (
          <div key={b.title} className="rounded-xl border border-border bg-surface/70 p-4">
            <b.icon className="size-4 text-primary" />
            <p className="mt-2.5 text-sm font-medium">{b.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0 truncate">{b.action}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Dashboard analytics grande ---------------- */

const BIG_METRICS = [
  ["Grupos ativos", "127"],
  ["Contatos", "24.918"],
  ["Mensagens processadas", "1.284.302"],
  ["Automações executadas", "86.421"],
  ["Atendimentos", "3.208"],
  ["Conversões do CRM", "612"],
];

export function BigDashboardMock() {
  return (
    <Panel title="TudoZap — Painel completo">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {BIG_METRICS.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface/70 p-3.5">
            <p className="truncate text-[11px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/70 p-4">
          <p className="text-xs text-muted-foreground">Interações nos últimos 7 dias</p>
          <Bars data={[28, 42, 36, 55, 48, 64, 72]} className="mt-4" />
        </div>
        <div className="rounded-xl border border-border bg-surface/70 p-4">
          <p className="text-xs text-muted-foreground">Automações executadas</p>
          <Bars data={[18, 24, 30, 27, 44, 52, 61]} className="mt-4" />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface/70 p-4">
        <p className="text-xs text-muted-foreground">Atividade em tempo real</p>
        <ul className="mt-3 space-y-2.5 text-sm">
          {[
            "10:42 — Resposta automática enviada",
            "10:41 — Novo contato adicionado ao CRM",
            "10:40 — URL bloqueada",
            "10:38 — Reação automática aplicada",
          ].map((a) => (
            <li key={a} className="flex items-center gap-2.5">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 truncate text-foreground/85">{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
