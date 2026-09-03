import { createFileRoute } from "@tanstack/react-router";
import { Download, UserPlus, Users } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/app/Ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/contatos")({
  head: () => ({
    meta: [
      { title: "Contatos | Painel TudoZap" },
      {
        name: "description",
        content: "Base de contatos unificada com etiquetas, origem e histórico de interações.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle="Sua base de contatos está vazia"
        actions={
          <>
            <Button variant="outline" size="sm" disabled>
              <Download className="size-4" /> Exportar CSV
            </Button>
            <Button size="sm">
              <UserPlus className="size-4" /> Novo contato
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value="0" delta="nenhum contato" />
        <StatCard label="Leads" value="0" />
        <StatCard label="Clientes" value="0" />
        <StatCard label="Sem etiqueta" value="0" />
      </section>

      <Card
        title="Base de contatos"
        bodyClassName="py-10"
      >
        <div className="flex flex-col items-center text-center"><Users className="size-8 text-primary" /><h2 className="mt-3 font-semibold">Nenhum contato cadastrado</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Adicione um contato manualmente ou sincronize uma instância.</p></div>
      </Card>
    </>
  );
}
