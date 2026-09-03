import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/app/Ui";
import { Button } from "@/components/ui/button";

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

function GroupsPage() {
  return (
    <>
      <PageHeader
        title="Grupos"
        subtitle="Os grupos das suas instâncias conectadas aparecerão aqui"
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Adicionar grupo
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Grupos ativos" value="0" delta="nenhum grupo" />
        <StatCard label="Participantes" value="0" delta="nenhum participante" />
        <StatCard label="Em moderação" value="0" />
        <StatCard label="Pausados" value="0" />
      </section>

      <Card
        title="Todos os grupos"
        description="Ative o monitoramento por grupo"
        bodyClassName="py-10"
      >
        <div className="flex flex-col items-center text-center"><Users className="size-8 text-primary" /><h2 className="mt-3 font-semibold">Nenhum grupo sincronizado</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Conecte uma instância para importar seus grupos do WhatsApp.</p></div>
      </Card>
    </>
  );
}
