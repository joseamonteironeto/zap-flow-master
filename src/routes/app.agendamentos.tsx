import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ImageIcon,
  MessageSquareText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, PageHeader, Pill, StatCard } from "@/components/app/Ui";
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
import { Calendar } from "@/components/ui/calendar";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { readMessages, type SavedMessage, writeMessages } from "@/lib/messages";
import { ensureCleanPanelStorage } from "@/lib/panel-data";

export const Route = createFileRoute("/app/agendamentos")({
  head: () => ({
    meta: [
      { title: "Agendamentos | Painel TudoZap" },
      {
        name: "description",
        content: "Consulte no calendário as mensagens programadas para seus grupos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SchedulesPage,
});

function MessageTabs() {
  return (
    <div className="flex w-fit rounded-xl border border-border bg-muted/40 p-1">
      <Button asChild variant="ghost" size="sm">
        <Link to="/app/mensagens">
          <MessageSquareText className="size-4" />
          Mensagens
        </Link>
      </Button>
      <Button asChild size="sm" className="shadow-none">
        <Link to="/app/agendamentos">
          <CalendarClock className="size-4" />
          Agendamentos
        </Link>
      </Button>
    </div>
  );
}

function sameDay(value: string, date: Date) {
  const candidate = new Date(value);
  return (
    candidate.getFullYear() === date.getFullYear() &&
    candidate.getMonth() === date.getMonth() &&
    candidate.getDate() === date.getDate()
  );
}

type ScheduleDraft = {
  title: string;
  body: string;
  scheduledAt: string;
  attachmentName: string;
  attachmentDataUrl: string;
  attachmentMimeType: string;
  mentionAll: boolean;
  pinMessage: boolean;
};

function toLocalDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const emptyDraft: ScheduleDraft = {
  title: "",
  body: "",
  scheduledAt: "",
  attachmentName: "",
  attachmentDataUrl: "",
  attachmentMimeType: "",
  mentionAll: false,
  pinMessage: false,
};

function SchedulesPage() {
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [query, setQuery] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ScheduleDraft>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [removalTarget, setRemovalTarget] = useState<SavedMessage | null>(null);

  useEffect(() => {
    ensureCleanPanelStorage();
    setMessages(readMessages());
  }, []);
  const scheduled = useMemo(
    () => messages.filter((message) => message.status === "scheduled" && message.scheduledAt),
    [messages],
  );
  const scheduledDates = useMemo(
    () => scheduled.map((message) => new Date(message.scheduledAt!)),
    [scheduled],
  );
  const filtered = useMemo(
    () =>
      scheduled.filter(
        (message) =>
          message.title.toLowerCase().includes(query.toLowerCase()) &&
          (!selectedDate || sameDay(message.scheduledAt!, selectedDate)),
      ),
    [query, scheduled, selectedDate],
  );
  const weekStart = useMemo(() => addDays(startOfDay(new Date()), weekOffset * 7), [weekOffset]);
  const visibleDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const weekLabel = `${visibleDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${visibleDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  const cancelSchedule = (id: number) => {
    const next = messages.map((message) =>
      message.id === id
        ? { ...message, status: "draft" as const, scheduledAt: undefined }
        : message,
    );
    setMessages(next);
    writeMessages(next);
  };

  const openCreate = (day: Date) => {
    const scheduledAt = new Date(day);
    scheduledAt.setHours(
      sameDay(new Date().toISOString(), day) ? Math.max(new Date().getHours() + 1, 9) : 9,
      0,
      0,
      0,
    );
    setEditingId(null);
    setDraft({ ...emptyDraft, scheduledAt: toLocalDateTime(scheduledAt) });
    setEditorOpen(true);
  };

  const openEdit = (message: SavedMessage) => {
    setEditingId(message.id);
    setDraft({
      title: message.title,
      body: message.body,
      scheduledAt: toLocalDateTime(message.scheduledAt!),
      attachmentName: message.attachmentName || "",
      attachmentDataUrl: message.attachmentDataUrl || "",
      attachmentMimeType: message.attachmentMimeType || "",
      mentionAll: message.mentionAll,
      pinMessage: message.pinMessage,
    });
    setEditorOpen(true);
  };

  const selectDraftImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setDraft((current) => ({
        ...current,
        attachmentName: file.name,
        attachmentMimeType: file.type,
        attachmentDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    reader.readAsDataURL(file);
  };

  const saveSchedule = () => {
    if (
      savingRef.current ||
      draft.title.trim().length < 3 ||
      !draft.body.trim() ||
      !draft.scheduledAt
    )
      return;
    savingRef.current = true;
    setIsSaving(true);
    const shared = {
      title: draft.title.trim(),
      body: draft.body.trim(),
      scheduledAt: new Date(draft.scheduledAt).toISOString(),
      attachmentName: draft.attachmentName || undefined,
      attachmentDataUrl: draft.attachmentDataUrl || undefined,
      attachmentMimeType: draft.attachmentMimeType || undefined,
      mentionAll: draft.mentionAll,
      pinMessage: draft.pinMessage,
      status: "scheduled" as const,
    };
    const alreadyExists = messages.some(
      (message) =>
        message.status === "scheduled" &&
        message.title === shared.title &&
        message.body === shared.body &&
        message.scheduledAt === shared.scheduledAt,
    );
    const next =
      editingId === null
        ? alreadyExists
          ? messages
          : [
              {
                id: Date.now(),
                type: "text" as const,
                attachmentCaption: true,
                useAI: false,
                createdAt: new Date().toISOString(),
                ...shared,
              },
              ...messages,
            ]
        : messages.map((message) =>
            message.id === editingId ? { ...message, ...shared } : message,
          );
    setMessages(next);
    writeMessages(next);
    setEditorOpen(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setIsSaving(false);
    savingRef.current = false;
  };

  return (
    <>
      <PageHeader
        title="Agendamentos"
        subtitle="Visualize e organize as mensagens programadas no calendário"
        actions={<MessageTabs />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total agendado"
          value={`${scheduled.length}`}
          delta="mensagens programadas"
        />
        <StatCard
          label="Hoje"
          value={`${scheduled.filter((message) => sameDay(message.scheduledAt!, new Date())).length}`}
          delta="envios previstos"
        />
        <StatCard
          label="Próximos 7 dias"
          value={`${
            scheduled.filter((message) => {
              const time = new Date(message.scheduledAt!).getTime() - Date.now();
              return time >= 0 && time <= 604800000;
            }).length
          }`}
        />
        <StatCard label="Executados" value="0" delta="aguardando backend" />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card title="Calendário" description="Selecione um dia para filtrar" bodyClassName="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              modifiers={{ scheduled: scheduledDates }}
              modifiersClassNames={{
                scheduled:
                  "after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
              }}
              className="mx-auto w-full [--cell-size:2.35rem]"
            />
            {selectedDate ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full"
                onClick={() => setSelectedDate(undefined)}
              >
                Limpar data selecionada
              </Button>
            ) : null}
          </Card>
          <div className="rounded-2xl border border-primary/20 bg-credit/55 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-primary" />
              Como funciona
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Os dias com um ponto verde têm envios agendados. Clique na data para ver apenas as
              mensagens daquele dia.
            </p>
          </div>
        </aside>

        <Card
          title="Mensagens agendadas"
          description={
            selectedDate
              ? `Filtrando ${selectedDate.toLocaleDateString("pt-BR")}`
              : "Todos os próximos envios"
          }
          actions={
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título"
                className="h-8 w-52 pl-9"
              />
            </div>
          }
        >
          {filtered.length ? (
            <div className="space-y-3">
              {filtered.map((message) => (
                <article
                  key={message.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{message.title}</h3>
                        <Pill tone="warning">Programada</Pill>
                        {message.mentionAll ? (
                          <Pill tone="success">
                            <AtSign className="size-3" />
                            Marcar todos
                          </Pill>
                        ) : null}
                      </div>
                      <p className="mt-1 max-w-2xl truncate text-sm text-muted-foreground">
                        {message.body}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRemovalTarget(message)}
                    >
                      <XCircle className="size-4" />
                      Cancelar
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-primary" />
                      {new Date(message.scheduledAt!).toLocaleDateString("pt-BR", {
                        dateStyle: "long",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-primary" />
                      {new Date(message.scheduledAt!).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquareText className="size-3.5 text-primary" />
                      {message.type === "text"
                        ? "Texto e/ou anexo"
                        : message.type === "audio"
                          ? "Áudio"
                          : "Enquete"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CalendarClock className="size-7" />
              </span>
              <h2 className="mt-4 font-semibold">Nenhum agendamento encontrado</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Crie uma mensagem e escolha “Agendar envio” para ela aparecer no calendário.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/app/mensagens">Criar mensagem</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Agenda dos próximos dias"
        description="Acompanhe cada envio programado em uma visão diária"
        bodyClassName="p-0"
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Ver sete dias anteriores"
              onClick={() => setWeekOffset((value) => value - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-xs font-medium capitalize text-muted-foreground">
              {weekLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Ver próximos sete dias"
              onClick={() => setWeekOffset((value) => value + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <div className="grid min-w-[1120px] grid-cols-7 divide-x divide-border">
            {visibleDays.map((day) => {
              const dayMessages = scheduled
                .filter((message) => sameDay(message.scheduledAt!, day))
                .sort(
                  (first, second) =>
                    new Date(first.scheduledAt!).getTime() -
                    new Date(second.scheduledAt!).getTime(),
                );
              const isToday = sameDay(new Date().toISOString(), day);

              return (
                <section key={day.toISOString()} className="min-h-[390px] bg-background/35">
                  <header className="border-b border-border px-3 py-3 text-center">
                    <p
                      className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span
                        className={`grid size-7 place-items-center rounded-full text-sm font-semibold ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                      >
                        {day.getDate()}
                      </span>
                      {dayMessages.length ? (
                        <span className="text-[10px] text-muted-foreground">
                          {dayMessages.length} {dayMessages.length === 1 ? "envio" : "envios"}
                        </span>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-primary"
                        aria-label={`Adicionar agendamento em ${day.toLocaleDateString("pt-BR")}`}
                        onClick={() => openCreate(day)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </header>

                  <div className="space-y-2.5 p-2.5">
                    {dayMessages.length ? (
                      dayMessages.map((message) => (
                        <article
                          key={message.id}
                          className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-colors hover:border-primary/35"
                        >
                          {message.attachmentDataUrl ? (
                            <img
                              src={message.attachmentDataUrl}
                              alt={`Mídia de ${message.title}`}
                              className="aspect-[16/9] w-full object-cover"
                            />
                          ) : message.attachmentName ? (
                            <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-primary/18 via-credit to-primary/5">
                              <ImageIcon className="size-7 text-primary" />
                            </div>
                          ) : null}
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 text-xs font-semibold">
                                <Clock3 className="size-3.5 text-primary" />
                                {new Date(message.scheduledAt!).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-primary"
                                  aria-label={`Editar ${message.title}`}
                                  onClick={() => openEdit(message)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="-mr-1 size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label={`Remover agendamento ${message.title}`}
                                  title="Remover da agenda"
                                  onClick={() => setRemovalTarget(message)}
                                >
                                  <XCircle className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            <h3 className="mt-2 line-clamp-1 text-xs font-semibold">
                              {message.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                              {message.body}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <Pill tone="warning" className="px-2 py-0.5">
                                Agendada
                              </Pill>
                              {message.mentionAll ? (
                                <Pill tone="success" className="px-2 py-0.5">
                                  <AtSign className="size-3" />
                                  Marcar todos
                                </Pill>
                              ) : null}
                              <span className="ml-auto text-[10px] text-muted-foreground">
                                Envio único
                              </span>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/80 px-2 py-6 text-center">
                        <CalendarClock className="mx-auto size-5 text-muted-foreground/55" />
                        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                          Sem agendamentos
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:px-5">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-primary" />
            Os cartões verdes indicam mensagens confirmadas para envio
          </span>
          {weekOffset !== 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Voltar para hoje
            </Button>
          ) : null}
        </div>
      </Card>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingId(null);
            setDraft(emptyDraft);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId === null ? "Novo agendamento" : "Editar mensagem agendada"}
            </DialogTitle>
            <DialogDescription>
              {editingId === null
                ? "Crie uma mensagem diretamente neste dia da agenda."
                : "Altere o conteúdo, a mídia, o horário e as opções de envio."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <Label htmlFor="schedule-title">Título</Label>
                <Input
                  id="schedule-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="Ex.: Aviso para a comunidade"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Data e horário</Label>
                <Input
                  id="schedule-date"
                  type="datetime-local"
                  value={draft.scheduledAt}
                  onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-body">Mensagem</Label>
              <Textarea
                id="schedule-body"
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder="Digite a mensagem que será enviada..."
                className="min-h-32 resize-y"
                maxLength={4096}
              />
              <p className="text-right text-[11px] text-muted-foreground">
                {draft.body.length}/4096
              </p>
            </div>

            <div className="space-y-2">
              <Label>Mídia da mensagem</Label>
              {draft.attachmentDataUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
                  <img
                    src={draft.attachmentDataUrl}
                    alt="Prévia da mídia agendada"
                    className="max-h-64 w-full object-contain"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        attachmentName: "",
                        attachmentDataUrl: "",
                        attachmentMimeType: "",
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                    Remover
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="schedule-media"
                  className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <Paperclip className="size-5 text-primary" />
                  <span className="mt-2 text-sm font-medium">Adicionar uma imagem</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    Ela aparecerá no cartão e acompanhará a mensagem
                  </span>
                </label>
              )}
              <input
                id="schedule-media"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => selectDraftImage(event.target.files?.[0])}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3">
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <AtSign className="size-3.5" />
                    Marcar todos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Marca os participantes do grupo
                  </span>
                </span>
                <Switch
                  checked={draft.mentionAll}
                  onCheckedChange={(mentionAll) => setDraft({ ...draft, mentionAll })}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3">
                <span>
                  <span className="block text-sm font-medium">Fixar mensagem</span>
                  <span className="text-xs text-muted-foreground">Fixa no topo após o envio</span>
                </span>
                <Switch
                  checked={draft.pinMessage}
                  onCheckedChange={(pinMessage) => setDraft({ ...draft, pinMessage })}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                isSaving ||
                draft.title.trim().length < 3 ||
                !draft.body.trim() ||
                !draft.scheduledAt
              }
              onClick={saveSchedule}
            >
              <CheckCircle2 className="size-4" />
              {isSaving
                ? "Salvando..."
                : editingId === null
                  ? "Criar agendamento"
                  : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removalTarget)}
        onOpenChange={(open) => {
          if (!open) setRemovalTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Você realmente deseja remover “{removalTarget?.title}” da agenda? A mensagem não será
              enviada e continuará salva no histórico como rascunho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removalTarget) cancelSchedule(removalTarget.id);
                setRemovalTarget(null);
              }}
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
