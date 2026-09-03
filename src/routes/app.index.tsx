import { Link, createFileRoute } from "@tanstack/react-router";
import { Inbox, MessageSquarePlus, Plus, ShieldBan, UserPlus } from "lucide-react";
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
  { label: "Grupos conectados", value: "0", delta: "nenhum grupo" },
  { label: "Mensagens processadas", value: "0", delta: "nenhuma mensagem" },
  { label: "Automações executadas", value: "0", delta: "nenhuma execução" },
  { label: "Contatos no CRM", value: "0", delta: "nenhum contato" },
];

const SHORTCUTS = [
  { label: "Adicionar grupo", icon: Plus, to: "/app/grupos" },
  { label: "Criar mensagem", icon: MessageSquarePlus, to: "/app/mensagens" },
  { label: "Criar resposta", icon: MessageSquarePlus, to: "/app/respostas" },
  { label: "Adicionar blacklist", icon: ShieldBan, to: "/app/blacklist/usuarios" },
  { label: "Novo contato", icon: UserPlus, to: "/app/contatos" },
] as const;

const SERVICES = [
  ["Conexão WhatsApp", "Não configurada"],
  ["Motor de automações", "Aguardando configuração"],
  ["Fiscal automático", "Aguardando configuração"],
  ["Sincronização CRM", "Aguardando configuração"],
] as const;

function Overview() {
  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Bem-vindo, José Augusto Monteiro Neto • seu painel está pronto para começar"
        actions={
          <Button asChild size="sm">
            <Link to="/app/mensagens">Nova mensagem</Link>
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
          <Sparkline data={[0, 0, 0, 0, 0, 0, 0]} className="h-24" />
        </Card>
        <Card title="Automações executadas" description="Últimos 7 dias">
          <Bars data={[0, 0, 0, 0, 0, 0, 0]} />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Atividade recente">
          <div className="flex flex-col items-center py-8 text-center"><Inbox className="size-8 text-primary" /><p className="mt-3 text-sm font-medium">Nenhuma atividade registrada</p><p className="mt-1 text-xs text-muted-foreground">As ações da sua operação aparecerão aqui.</p></div>
        </Card>

        <Card title="Status dos serviços">
          <ul className="space-y-3">
            {SERVICES.map(([name, status]) => (
              <li key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="min-w-0 truncate text-sm text-foreground/85">{name}</span>
                <Pill tone="muted">{status}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
