import { createFileRoute } from "@tanstack/react-router";
import { Bot, Play, Plus } from "lucide-react";
import { Card, DataTable, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Sparkline } from "@/components/mockups/Panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/app/automacoes")({
  head: () => ({
    meta: [
      { title: "Automações | Painel TudoZap" },
      {
        name: "description",
        content: "Crie fluxos automáticos com gatilhos, condições e ações para seus grupos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AutomationsPage,
});

const FLOWS = [
  ["Boas-vindas com regras", "Entrada no grupo", "Enviar mensagem + fixar", "3.104", true],
  ["Anti-spam de links", "Mensagem com URL", "Apagar + advertir", "1.877", true],
  ["Qualificação de lead", "Palavra “orçamento”", "Criar card no CRM", "742", true],
  ["Resumo diário", "Todo dia às 19h", "Enviar relatório", "31", false],
] as const;

const STEPS = [
  ["Gatilho", "Mensagem recebida contendo URL"],
  ["Condição", "Remetente não é administrador"],
  ["Ação 1", "Apagar mensagem"],
  ["Ação 2", "Enviar advertência privada"],
  ["Ação 3", "Registrar na blacklist após 3 avisos"],
] as const;

function AutomationsPage() {
  return (
    <>
      <PageHeader
        title="Automações"
        subtitle="Fluxos executados automaticamente na sua operação"
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Nova automação
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Execuções hoje" value="8.641" delta="+21%" />
        <StatCard label="Fluxos ativos" value="17" />
        <StatCard label="Taxa de sucesso" value="99,2%" />
        <StatCard label="Falhas" value="6" delta="-4" tone="down" />
      </section>

      <Card title="Fluxos" bodyClassName="p-0 py-4 sm:py-5">
        <DataTable
          columns={["Fluxo", "Gatilho", "Ações", "Execuções", "Ativo"]}
          rows={FLOWS.map(([name, trigger, actions, runs, on]) => [
            <span className="flex items-center gap-2 font-medium">
              <Bot className="size-4 text-primary" /> {name}
            </span>,
            <span className="text-muted-foreground">{trigger}</span>,
            actions,
            runs,
            <Switch defaultChecked={on} aria-label={`Ativar ${name}`} />,
          ])}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card
          title="Editor de fluxo"
          description="Anti-spam de links"
          actions={
            <Button variant="outline" size="sm">
              <Play className="size-4" /> Testar
            </Button>
          }
        >
          <ol className="space-y-3">
            {STEPS.map(([kind, text], i) => (
              <li
                key={kind}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3"
              >
                <span className="grid size-6 place-items-center rounded-lg bg-primary/12 text-xs text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <Pill tone={i === 0 ? "success" : i === 1 ? "warning" : "muted"}>{kind}</Pill>
                  <p className="mt-1.5 text-sm text-foreground/85">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Execuções" description="Últimos 7 dias">
          <Sparkline data={[30, 42, 38, 55, 49, 68, 74]} className="h-28" />
        </Card>
      </div>
    </>
  );
}
