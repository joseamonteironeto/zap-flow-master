import { createFileRoute } from "@tanstack/react-router";
import { Bot, Plus } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/app/Ui";
import { Sparkline } from "@/components/mockups/Panel";
import { Button } from "@/components/ui/button";

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
        <StatCard label="Execuções hoje" value="0" delta="nenhuma execução" />
        <StatCard label="Fluxos ativos" value="0" />
        <StatCard label="Taxa de sucesso" value="—" delta="sem dados" />
        <StatCard label="Falhas" value="0" />
      </section>

      <Card title="Fluxos" bodyClassName="py-10">
        <div className="flex flex-col items-center text-center"><Bot className="size-8 text-primary" /><h2 className="mt-3 font-semibold">Nenhuma automação criada</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Crie seu primeiro fluxo para automatizar tarefas no WhatsApp.</p></div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title="Editor de fluxo" description="Selecione ou crie uma automação">
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum fluxo selecionado.</p>
        </Card>

        <Card title="Execuções" description="Últimos 7 dias">
          <Sparkline data={[0, 0, 0, 0, 0, 0, 0]} className="h-28" />
          <p className="mt-3 text-center text-xs text-muted-foreground">Sem dados ainda</p>
        </Card>
      </div>
    </>
  );
}
