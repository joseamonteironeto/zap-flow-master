import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, PageHeader, Pill } from "@/components/app/Ui";
import { Bars, Sparkline } from "@/components/mockups/Panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readGroups, type ManagedGroup, writeGroups } from "@/lib/groups";
import { ensureCleanPanelStorage } from "@/lib/panel-data";

export const Route = createFileRoute("/app/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos e métricas | Painel TudoZap" },
      {
        name: "description",
        content: "Acompanhe crescimento, cliques, participantes e disponibilidade dos grupos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GroupsPage,
});

const METRICS = [
  {
    label: "Cliques",
    value: "0",
    icon: Link2,
    tone: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  },
  { label: "Entraram", value: "0", icon: ArrowUpRight, tone: "bg-primary/12 text-primary" },
  { label: "Saíram", value: "0", icon: ArrowDownRight, tone: "bg-destructive/10 text-destructive" },
  {
    label: "Participantes",
    value: "0",
    icon: Users,
    tone: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  },
  {
    label: "Grupos",
    value: "0",
    icon: BarChart3,
    tone: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  },
  {
    label: "Grupos cheios",
    value: "0",
    icon: UserX,
    tone: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
  },
  {
    label: "Disponíveis",
    value: "0",
    icon: Users,
    tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
] as const;

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <article className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-border bg-surface/60 p-4">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
      </div>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-5" />
      </span>
    </article>
  );
}

function Legend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${color}`} />
      {children}
    </span>
  );
}

function GroupsPage() {
  const [groups, setGroups] = useState<ManagedGroup[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ManagedGroup["type"]>("group");
  const [pendingDelete, setPendingDelete] = useState<ManagedGroup | null>(null);

  useEffect(() => {
    ensureCleanPanelStorage();
    setGroups(readGroups());
  }, []);
  const persist = (next: ManagedGroup[]) => {
    setGroups(next);
    writeGroups(next);
  };
  const filteredGroups = useMemo(
    () => groups.filter((group) => group.name.toLowerCase().includes(query.toLowerCase())),
    [groups, query],
  );
  const participants = groups.reduce((total, group) => total + group.participants, 0);
  const capacity = groups.reduce((total, group) => total + group.capacity, 0);
  const available = groups.filter((group) => group.participants < group.capacity).length;
  const metricValues: Record<string, string> = {
    Cliques: "0",
    Entraram: "0",
    Saíram: "0",
    Participantes: participants.toLocaleString("pt-BR"),
    Grupos: `${groups.length}`,
    "Grupos cheios": `${groups.length - available}`,
    Disponíveis: `${available}`,
  };

  const addGroup = () => {
    if (newName.trim().length < 3) return;
    const group: ManagedGroup = {
      id: `manual-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      instanceName: "Adicionado manualmente",
      participants: 0,
      capacity: newType === "community" ? 2000 : 1024,
      createdAt: new Date().toISOString(),
    };
    persist([group, ...groups]);
    setNewName("");
    setNewType("group");
    setDialogOpen(false);
  };

  const deleteGroup = () => {
    if (!pendingDelete) return;
    persist(groups.filter((group) => group.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Grupos"
        subtitle="Crescimento, ocupação e desempenho dos seus grupos em um só lugar"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setGroups(readGroups())}>
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Adicionar novo grupo
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {METRICS.map((metric) => (
          <MetricCard key={metric.label} {...metric} value={metricValues[metric.label]} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card
          title="Entrada e saída de participantes"
          description="Evolução da base ao longo do período"
          actions={
            <Select defaultValue="7d">
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24 horas</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <div className="mb-5 flex gap-4">
            <Legend color="bg-primary">Entraram</Legend>
            <Legend color="bg-destructive">Saíram</Legend>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl border border-border bg-background/50 p-4">
            <div className="absolute inset-x-4 top-1/4 border-t border-dashed border-border" />
            <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-border" />
            <div className="absolute inset-x-4 top-3/4 border-t border-dashed border-border" />
            <Sparkline data={[0, 0, 0, 0, 0, 0, 0]} className="relative z-10 h-32" />
            <p className="relative z-10 mt-2 text-center text-xs text-muted-foreground">
              Os dados aparecerão após a sincronização dos grupos.
            </p>
          </div>
        </Card>

        <Card title="Cliques em links" description="Redirecionamentos nos últimos 7 dias">
          <Bars data={[0, 0, 0, 0, 0, 0, 0]} className="h-40" />
          <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
            <span>7 dias atrás</span>
            <span>Hoje</span>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Seus grupos e comunidades"
          description="Itens importados das instâncias ou adicionados manualmente"
          actions={
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-8 w-52 pl-9"
                placeholder="Buscar grupo"
              />
            </div>
          }
        >
          {filteredGroups.length ? (
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const occupancy = Math.round((group.participants / group.capacity) * 100);
                return (
                  <article
                    key={group.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Users className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{group.name}</h3>
                        <Pill tone={group.type === "community" ? "success" : "muted"}>
                          {group.type === "community" ? "Comunidade" : "Grupo"}
                        </Pill>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {group.instanceName} · {group.participants.toLocaleString("pt-BR")}{" "}
                        participantes · {occupancy}% ocupado
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remover ${group.name}`}
                      onClick={() => setPendingDelete(group)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <Users className="size-8 text-primary" />
              <h2 className="mt-3 font-semibold">
                {groups.length ? "Nenhum grupo encontrado" : "Nenhum grupo adicionado"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {groups.length
                  ? "Tente buscar usando outro nome."
                  : "Conecte uma instância para importar grupos ou adicione um grupo manualmente."}
              </p>
              {!groups.length ? (
                <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" />
                  Adicionar novo grupo
                </Button>
              ) : null}
            </div>
          )}
        </Card>
        <Card
          title="Visão de capacidade"
          description="Distribuição entre grupos cheios e disponíveis"
        >
          <div className="grid min-h-40 place-items-center">
            <div className="relative grid size-36 place-items-center rounded-full border-[14px] border-muted">
              <div className="text-center">
                <p className="text-2xl font-semibold">
                  {capacity ? Math.round((participants / capacity) * 100) : 0}%
                </p>
                <p className="text-[11px] text-muted-foreground">ocupação</p>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Capacidade total</p>
              <p className="mt-1 font-semibold">{capacity.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Vagas disponíveis</p>
              <p className="mt-1 font-semibold">
                {Math.max(0, capacity - participants).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setNewName("");
            setNewType("group");
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar novo grupo</DialogTitle>
            <DialogDescription>
              Cadastre manualmente um grupo ou uma comunidade no TudoZap.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome</Label>
              <Input
                id="group-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ex.: Clientes VIP"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newType}
                onValueChange={(value) => setNewType(value as ManagedGroup["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Grupo</SelectItem>
                  <SelectItem value="community">Comunidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={newName.trim().length < 3} onClick={addGroup}>
              <Plus className="size-4" />
              Adicionar grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você realmente deseja remover{" "}
              <strong className="text-foreground">{pendingDelete?.name}</strong> do sistema? Ele
              poderá ser importado novamente pela instância depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteGroup}
            >
              <Trash2 className="size-4" />
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
