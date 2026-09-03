import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, MoreHorizontal, Phone, Plus, QrCode, RefreshCw, Smartphone, Trash2, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, Pill, StatCard } from "@/components/app/Ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureCleanPanelStorage } from "@/lib/panel-data";

export const Route = createFileRoute("/app/instancias")({
  head: () => ({ meta: [{ title: "Instâncias | Painel TudoZap" }, { name: "description", content: "Conecte e acompanhe suas instâncias próprias do WhatsApp no TudoZap." }, { name: "robots", content: "noindex" }] }),
  component: InstancesPage,
});

type Instance = {
  id: number;
  name: string;
  phone: string;
  initials: string;
  color: string;
  status: "connected" | "connecting" | "offline";
  lastSeen: string;
  messages: number;
};

const DEFAULT_INSTANCES: Instance[] = [];

function statusLabel(status: Instance["status"]) {
  if (status === "connected") return <Pill tone="success"><span className="size-1.5 rounded-full bg-current" />Conectada</Pill>;
  if (status === "connecting") return <Pill tone="warning"><RefreshCw className="size-3 animate-spin" />Conectando</Pill>;
  return <Pill tone="danger"><WifiOff className="size-3" />Desconectada</Pill>;
}

function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>(DEFAULT_INSTANCES);
  const [hydrated, setHydrated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Instance | null>(null);
  const [step, setStep] = useState<"details" | "qr">("details");
  const [name, setName] = useState("");

  useEffect(() => {
    ensureCleanPanelStorage();
    const stored = window.localStorage.getItem("tudozap-instances");
    if (stored) { try { setInstances(JSON.parse(stored)); } catch { /* ignora dados locais inválidos */ } }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem("tudozap-instances", JSON.stringify(instances)); }, [instances, hydrated]);

  const connected = instances.filter((instance) => instance.status === "connected").length;
  const totalMessages = instances.reduce((sum, instance) => sum + instance.messages, 0);
  const formValid = name.trim().length >= 3;
  const initials = useMemo(() => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "WA", [name]);

  const resetDialog = () => { setStep("details"); setName(""); };
  const finishConnection = () => {
    setInstances((current) => [{ id: Date.now(), name: name.trim(), phone: "Número sincronizado pelo WhatsApp", initials, color: "bg-primary", status: "connected", lastSeen: "Agora", messages: 0 }, ...current]);
    setDialogOpen(false); resetDialog();
  };
  const deleteInstance = () => {
    if (!pendingDelete) return;
    setInstances((current) => current.filter((instance) => instance.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <>
      <PageHeader title="Instâncias" subtitle="Conecte e acompanhe os números próprios usados na sua operação" actions={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Conectar nova instância</Button>} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Instâncias conectadas" value={`${connected}`} delta={`de ${instances.length} cadastradas`} />
        <StatCard label="Mensagens processadas" value={totalMessages.toLocaleString("pt-BR")} delta="nos últimos 30 dias" />
        <StatCard label="Disponibilidade" value="—" delta="sem instâncias" />
        <StatCard label="Desconectadas" value={`${instances.length - connected}`} delta={instances.length === connected ? "todas online" : "requer atenção"} tone={instances.length === connected ? "up" : "down"} />
      </section>

      <Card title="Suas instâncias" description="Números conectados à conta TudoZap" actions={<Pill>{instances.length} instâncias</Pill>} bodyClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {instances.map((instance) => (
          <article key={instance.id} className="rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/30">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="size-12 ring-2 ring-background shadow-sm"><AvatarFallback className={`${instance.color} font-semibold text-white`}>{instance.initials}</AvatarFallback></Avatar>
                <span className={`absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-background ${instance.status === "connected" ? "bg-primary" : instance.status === "connecting" ? "bg-warning" : "bg-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">{instance.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="size-3" />{instance.phone}</p></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`Opções de ${instance.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44"><DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => setPendingDelete(instance)}><Trash2 className="size-4" />Excluir instância</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">{statusLabel(instance.status)}<span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3" />{instance.lastSeen}</span></div>
            <div className="mt-4 border-t border-border pt-3"><p className="text-[11px] text-muted-foreground">Mensagens processadas</p><p className="mt-1 text-lg font-semibold tabular-nums">{instance.messages.toLocaleString("pt-BR")}</p></div>
          </article>
        ))}
        {!instances.length ? <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"><Smartphone className="size-8 text-primary" /><h2 className="mt-3 font-semibold">Nenhuma instância conectada</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Conecte seu primeiro WhatsApp para começar a sincronizar grupos e mensagens.</p><Button className="mt-4" size="sm" onClick={() => setDialogOpen(true)}><Plus className="size-4" />Conectar nova instância</Button></div> : null}
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-credit/55 p-4"><Smartphone className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Instâncias próprias:</strong> cada número mantém sua identidade, foto e histórico de conexão separados dentro do painel.</p></div>

      <Dialog open={dialogOpen} onOpenChange={(next) => { setDialogOpen(next); if (!next) resetDialog(); }}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border-border bg-popover sm:max-w-md">
          <DialogHeader><DialogTitle>{step === "details" ? "Conectar nova instância" : "Leia o QR Code"}</DialogTitle><DialogDescription>{step === "details" ? "Identifique o número que será conectado ao TudoZap." : "No WhatsApp, acesse Aparelhos conectados e leia este código."}</DialogDescription></DialogHeader>
          {step === "details" ? <div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="instance-name">Nome da instância</Label><Input id="instance-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Atendimento Principal" autoFocus /></div><div className="flex items-center gap-3 rounded-xl border border-border bg-muted/35 p-3"><Avatar className="size-10"><AvatarFallback className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback></Avatar><div><p className="text-sm font-medium">Número e foto serão sincronizados</p><p className="text-xs text-muted-foreground">O WhatsApp envia esses dados após a leitura do QR Code.</p></div></div></div> : <div className="py-4 text-center"><div className="mx-auto grid size-56 place-items-center rounded-2xl border-8 border-white bg-white shadow-sm ring-1 ring-border"><QrCode className="size-44 text-foreground" strokeWidth={1.25} /></div><div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin text-primary" />Aguardando leitura pelo WhatsApp</div></div>}
          <DialogFooter>{step === "details" ? <Button disabled={!formValid} onClick={() => setStep("qr")}>Gerar QR Code</Button> : <div className="flex w-full gap-2 sm:justify-end"><Button variant="outline" onClick={() => setStep("details")}>Voltar</Button><Button onClick={finishConnection}><CheckCircle2 className="size-4" />Simular conexão</Button></div>}</DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md"><AlertDialogHeader><AlertDialogTitle>Excluir esta instância?</AlertDialogTitle><AlertDialogDescription>A instância <strong className="text-foreground">{pendingDelete?.name}</strong> será removida do painel. O número precisará ler um novo QR Code para ser conectado novamente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deleteInstance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="size-4" />Excluir instância</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
