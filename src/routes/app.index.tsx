import { Link, createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, MessageSquarePlus, Pause, Plus, ShieldBan, UserPlus } from "lucide-react";
import { Card, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Bars, Sparkline } from "@/components/mockups/Panel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Visão Geral | Painel TudoZap" },
      {
        name: "description",
        content: "Métricas em tempo real da sua operação: grupos, mensagens, automações e CRM.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Overview,
});

const METRICS = [
  { label: "Grupos conectados", value: "127", delta: "+12% vs. ontem" },
  { label: "Mensagens processadas", value: "128.430", delta: "+8,4% vs. ontem" },
  { label: "Automações executadas", value: "8.641", delta: "+21% vs. ontem" },
  { label: "Contatos no CRM", value: "2.419", delta: "+34 hoje" },
];

const SHORTCUTS = [
  { label: "Adicionar grupo", icon: Plus, to: "/app/grupos" },
  { label: "Criar automação", icon: Bot, to: "/app/automacoes" },
  { label: "Criar resposta", icon: MessageSquarePlus, to: "/app/respostas" },
  { label: "Adicionar blacklist", icon: ShieldBan, to: "/app/blacklist/usuarios" },
  { label: "Novo contato", icon: UserPlus, to: "/app/contatos" },
] as const;

const SERVICES = [
  ["Conexão WhatsApp", "Operacional", "success"],
  ["Motor de automações", "Operacional", "success"],
  ["Fiscal automático", "Automação pausada", "warning"],
  ["Sincronização CRM", "Operacional", "success"],
] as const;

const ACTIVITY = [
  "10:42 — Resposta automática enviada em Comunidade Principal",
  "10:41 — Novo contato adicionado ao CRM",
  "10:40 — URL bloqueada em Ofertas Premium",
  "10:38 — Reação automática aplicada",
  "10:31 — Usuário adicionado à blacklist",
];

function Overview() {
  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Operação em tempo real • atualizado agora"
        actions={
          <Button asChild size="sm">
            <Link to="/app/automacoes">Nova automação</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICS.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} delta={m.delta} />
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <Button key={s.label} asChild variant="outline" size="sm" className="h-10">
            <Link to={s.to}>
              <s.icon className="size-4" /> {s.label}
            </Link>
          </Button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Mensagens processadas" description="Últimos 7 dias">
          <Sparkline data={[22, 34, 28, 46, 41, 58, 66]} className="h-24" />
        </Card>
        <Card title="Automações executadas" description="Últimos 7 dias">
          <Bars data={[18, 26, 21, 38, 33, 47, 55]} />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Atividade recente">
          <ul className="space-y-3">
            {ACTIVITY.map((a) => (
              <li key={a} className="flex items-center gap-2.5 text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 truncate text-foreground/85">{a}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Status dos serviços">
          <ul className="space-y-3">
            {SERVICES.map(([name, status, tone]) => (
              <li key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="min-w-0 truncate text-sm text-foreground/85">{name}</span>
                <Pill tone={tone}>
                  {tone === "success" ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <Pause className="size-3" />
                  )}
                  {status}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
