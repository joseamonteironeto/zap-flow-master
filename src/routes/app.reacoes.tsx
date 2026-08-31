import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Card, DataTable, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Bars } from "@/components/mockups/Panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/app/reacoes")({
  head: () => ({
    meta: [
      { title: "Reações | Painel TudoZap" },
      {
        name: "description",
        content: "Configure reações automáticas por palavra-chave, grupo e horário.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReactionsPage,
});

const RULES = [
  ["🔥", "Contém “promoção”", "Ofertas Premium", "1.284", true],
  ["👍", "Contém “obrigado”", "Todos os grupos", "942", true],
  ["✅", "Contém “pedido confirmado”", "Suporte Nível 1", "611", true],
  ["❤️", "Mensagem de boas-vindas", "Comunidade Principal", "410", false],
] as const;

function ReactionsPage() {
  return (
    <>
      <PageHeader
        title="Reações"
        subtitle="Reações automáticas aplicadas por regra"
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Nova reação
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Reações hoje" value="3.247" delta="+18%" />
        <StatCard label="Regras ativas" value="12" />
        <StatCard label="Grupos cobertos" value="94" />
        <StatCard label="Tempo médio" value="0,8s" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Regras de reação" bodyClassName="p-0 py-4 sm:py-5">
          <DataTable
            columns={["Emoji", "Gatilho", "Escopo", "Aplicações", "Ativa"]}
            rows={RULES.map(([emoji, trigger, scope, count, on]) => [
              <span className="text-lg">{emoji}</span>,
              <span className="font-medium">{trigger}</span>,
              <span className="text-muted-foreground">{scope}</span>,
              count,
              <Switch defaultChecked={on} aria-label={`Ativar ${trigger}`} />,
            ])}
          />
        </Card>

        <Card title="Volume por dia" description="Últimos 7 dias">
          <Bars data={[24, 31, 27, 42, 38, 51, 60]} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="success">🔥 mais usada</Pill>
            <Pill>👍 segunda</Pill>
            <Pill>✅ terceira</Pill>
          </div>
        </Card>
      </div>
    </>
  );
}
