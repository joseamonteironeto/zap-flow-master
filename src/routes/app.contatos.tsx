import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, UserPlus } from "lucide-react";
import { Card, DataTable, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const CONTACTS = [
  ["Ana Lima", "+55 11 98812-4410", "Comunidade Principal", "Cliente", "há 2 min"],
  ["Bruno Castro", "+55 21 99120-7781", "Ofertas Premium", "Lead", "há 18 min"],
  ["Carla Menezes", "+55 31 98455-2210", "Suporte Nível 1", "Suporte", "há 1 h"],
  ["Diego Ramos", "+55 41 99677-1123", "Revenda Sul", "Parceiro", "há 3 h"],
  ["Elisa Prado", "+55 51 98122-9087", "Comunidade Principal", "Lead", "ontem"],
] as const;

function ContactsPage() {
  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle="2.419 contatos sincronizados com o CRM"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Exportar CSV
            </Button>
            <Button size="sm">
              <UserPlus className="size-4" /> Novo contato
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value="2.419" delta="+34 hoje" />
        <StatCard label="Leads" value="812" delta="+12" />
        <StatCard label="Clientes" value="1.203" delta="+9" />
        <StatCard label="Sem etiqueta" value="404" />
      </section>

      <Card
        title="Base de contatos"
        actions={
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar contato" className="h-9 w-56 pl-9" />
          </div>
        }
        bodyClassName="p-0 py-4 sm:py-5"
      >
        <DataTable
          columns={["Nome", "Telefone", "Origem", "Etiqueta", "Última interação"]}
          rows={CONTACTS.map(([name, phone, origin, tag, last]) => [
            <span className="font-medium">{name}</span>,
            <span className="text-muted-foreground">{phone}</span>,
            origin,
            <Pill tone={tag === "Cliente" ? "success" : tag === "Suporte" ? "warning" : "muted"}>
              {tag}
            </Pill>,
            <span className="text-muted-foreground">{last}</span>,
          ])}
        />
      </Card>
    </>
  );
}
