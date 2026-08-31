import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Card, DataTable, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/app/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos | Painel TudoZap" },
      {
        name: "description",
        content: "Gerencie grupos conectados, monitoramento, moderação e limites de participantes.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GroupsPage,
});

const GROUPS = [
  ["Comunidade Principal", "1.024", "Ativo", "Fiscal + Blacklist", true],
  ["Ofertas Premium", "876", "Ativo", "Respostas automáticas", true],
  ["Suporte Nível 1", "412", "Moderação", "Fiscal", true],
  ["Revenda Sul", "298", "Ativo", "CRM", false],
  ["Lançamentos 2026", "154", "Pausado", "Nenhuma", false],
] as const;

function GroupsPage() {
  return (
    <>
      <PageHeader
        title="Grupos"
        subtitle="127 grupos conectados • 4 aguardando aprovação"
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Adicionar grupo
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Grupos ativos" value="118" delta="+6 esta semana" />
        <StatCard label="Participantes" value="42.117" delta="+1.204" />
        <StatCard label="Em moderação" value="5" delta="-2" tone="down" />
        <StatCard label="Pausados" value="4" />
      </section>

      <Card
        title="Todos os grupos"
        description="Ative o monitoramento por grupo"
        actions={
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar grupo" className="h-9 w-56 pl-9" />
          </div>
        }
        bodyClassName="p-0 py-4 sm:py-5"
      >
        <DataTable
          columns={["Grupo", "Membros", "Status", "Automações", "Monitorar"]}
          rows={GROUPS.map(([name, members, status, autos, on]) => [
            <span className="font-medium">{name}</span>,
            members,
            <Pill tone={status === "Ativo" ? "success" : status === "Pausado" ? "muted" : "warning"}>
              {status}
            </Pill>,
            <span className="text-muted-foreground">{autos}</span>,
            <Switch defaultChecked={on} aria-label={`Monitorar ${name}`} />,
          ])}
        />
      </Card>
    </>
  );
}
