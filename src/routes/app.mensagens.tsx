import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  Bold,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Italic,
  MessageSquareText,
  Paperclip,
  Pin,
  Send,
  Sparkles,
  Strikethrough,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, Pill } from "@/components/app/Ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { readGroups, type ManagedGroup } from "@/lib/groups";
import { readMessages, statusLabel, type SavedMessage, writeMessages } from "@/lib/messages";
import { ensureCleanPanelStorage } from "@/lib/panel-data";

export const Route = createFileRoute("/app/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens | Painel TudoZap" },
      { name: "description", content: "Crie, salve, envie e agende mensagens para seus grupos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

const emptyForm = {
  title: "",
  body: "",
  type: "text" as SavedMessage["type"],
  attachmentName: "",
  attachmentDataUrl: "",
  attachmentMimeType: "",
  attachmentCaption: false,
  useAI: false,
  mentionAll: false,
  pinMessage: false,
  groupIds: [] as string[],
};

function MessageTabs() {
  return (
    <div className="flex w-fit rounded-xl border border-border bg-muted/40 p-1">
      <Button asChild size="sm" className="shadow-none">
        <Link to="/app/mensagens">
          <MessageSquareText className="size-4" />
          Mensagens
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link to="/app/agendamentos">
          <CalendarClock className="size-4" />
          Agendamentos
        </Link>
      </Button>
    </div>
  );
}

function statusTone(status: SavedMessage["status"]) {
  return status === "sent" ? "success" : status === "scheduled" ? "warning" : "muted";
}

function MessagesPage() {
  const [form, setForm] = useState(emptyForm);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [groups, setGroups] = useState<ManagedGroup[]>([]);
  const [created, setCreated] = useState<SavedMessage | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    ensureCleanPanelStorage();
    setMessages(readMessages());
    setGroups(readGroups());
  }, []);
  useEffect(
    () => () => {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview.url);
    },
    [attachmentPreview],
  );
  const valid =
    form.title.trim().length >= 3 && form.body.trim().length >= 1 && form.groupIds.length > 0;
  const charCount = form.body.length;

  const persist = (next: SavedMessage[]) => {
    setMessages(next);
    writeMessages(next);
  };
  const resetForm = () => {
    setForm(emptyForm);
    setAttachmentPreview(null);
  };
  const createMessage = () => {
    if (!valid) return;
    const message: SavedMessage = {
      id: Date.now(),
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      attachmentName: form.attachmentName || undefined,
      attachmentDataUrl: form.attachmentDataUrl || undefined,
      attachmentMimeType: form.attachmentMimeType || undefined,
      attachmentCaption: form.attachmentCaption,
      useAI: form.useAI,
      mentionAll: form.mentionAll,
      pinMessage: form.pinMessage,
      groupIds: form.groupIds,
      groupNames: groups
        .filter((group) => form.groupIds.includes(group.id))
        .map((group) => group.name),
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    persist([message, ...messages]);
    setCreated(message);
    setActionOpen(true);
  };
  const updateCreated = (changes: Partial<SavedMessage>) => {
    if (!created) return;
    const nextCreated = { ...created, ...changes };
    persist(messages.map((message) => (message.id === created.id ? nextCreated : message)));
    setCreated(nextCreated);
  };
  const finish = (status: SavedMessage["status"]) => {
    updateCreated({ status });
    setActionOpen(false);
    resetForm();
  };
  const confirmSchedule = () => {
    if (!scheduledAt) return;
    updateCreated({ status: "scheduled", scheduledAt: new Date(scheduledAt).toISOString() });
    setScheduleOpen(false);
    resetForm();
  };
  const addFormatting = (token: string) =>
    setForm((current) => ({
      ...current,
      body: `${current.body}${current.body ? " " : ""}${token}`,
    }));
  const selectAttachment = (file?: File) => {
    if (!file) {
      setForm({ ...form, attachmentName: "", attachmentDataUrl: "", attachmentMimeType: "" });
      setAttachmentPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setForm({
      ...form,
      attachmentName: file.name,
      attachmentDataUrl: "",
      attachmentMimeType: file.type,
    });
    setAttachmentPreview({ url: previewUrl, type: file.type, name: file.name });
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((current) => ({
          ...current,
          attachmentDataUrl: typeof reader.result === "string" ? reader.result : "",
        }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <PageHeader
        title="Mensagens"
        subtitle="Crie uma vez e escolha se deseja enviar, agendar ou guardar para depois"
        actions={<MessageTabs />}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,.65fr)]">
        <Card title="Criar nova mensagem" description="Conteúdo e comportamento do envio">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="message-title">Título da mensagem</Label>
              <Input
                id="message-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Ex.: Aviso importante da comunidade"
                maxLength={100}
              />
              <div className="text-right text-[11px] text-muted-foreground">
                {form.title.length}/100
              </div>
            </div>

            <section className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    Grupos da campanha
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha onde esta mensagem será enviada ou agendada.
                  </p>
                </div>
                {groups.length ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setForm({ ...form, groupIds: groups.map((group) => group.id) })
                      }
                    >
                      Selecionar todos
                    </Button>
                    {form.groupIds.length ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground"
                        onClick={() => setForm({ ...form, groupIds: [] })}
                      >
                        Limpar
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {groups.length ? (
                <div className="mt-4 grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {groups.map((group) => {
                    const checked = form.groupIds.includes(group.id);
                    return (
                      <label
                        key={group.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/35"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setForm({
                              ...form,
                              groupIds: value
                                ? [...form.groupIds, group.id]
                                : form.groupIds.filter((id) => id !== group.id),
                            })
                          }
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{group.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {group.instanceName} ·{" "}
                            {group.type === "community" ? "Comunidade" : "Grupo"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-sm font-medium">Nenhum grupo disponível</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Adicione ou sincronize os grupos da campanha primeiro.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/app/grupos">Ir para Grupos</Link>
                  </Button>
                </div>
              )}
              {groups.length ? (
                <p className="mt-3 text-xs font-medium text-primary">
                  {form.groupIds.length} de {groups.length} grupos selecionados
                </p>
              ) : null}
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border p-3">
                <span>
                  <span className="block text-sm font-medium">Anexo com legenda</span>
                  <span className="text-xs text-muted-foreground">Usar o texto como legenda</span>
                </span>
                <Switch
                  checked={form.attachmentCaption}
                  onCheckedChange={(attachmentCaption) => setForm({ ...form, attachmentCaption })}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border p-3">
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">Assistente de IA</span>
                    <span className="text-xs text-muted-foreground">
                      Preparado para integração futura
                    </span>
                  </span>
                </span>
                <Switch
                  checked={form.useAI}
                  onCheckedChange={(useAI) => setForm({ ...form, useAI })}
                />
              </label>
            </div>

            <div className="rounded-xl border border-primary/20 bg-credit/55 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" />
                Randomização de palavras
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Use{" "}
                <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
                  {"{Oi | Olá | Tudo bem?}"}
                </code>{" "}
                para variar automaticamente o texto em cada envio.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="message-body">Mensagem</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Adicionar negrito"
                    onClick={() => addFormatting("*texto*")}
                  >
                    <Bold />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Adicionar itálico"
                    onClick={() => addFormatting("_texto_")}
                  >
                    <Italic />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Adicionar riscado"
                    onClick={() => addFormatting("~texto~")}
                  >
                    <Strikethrough />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => addFormatting("{{nome}}")}
                  >
                    <Bot />
                    Variável
                  </Button>
                </div>
              </div>
              <Textarea
                id="message-body"
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                placeholder="Digite a mensagem que será enviada aos grupos..."
                className="min-h-44 resize-y"
                maxLength={4096}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Compatível com a formatação do WhatsApp</span>
                <span>{charCount}/4096</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-muted/35">
                <span>
                  <span className="block text-sm font-medium">Mencionar todos</span>
                  <span className="text-xs text-muted-foreground">
                    Marca os participantes do grupo
                  </span>
                </span>
                <Switch
                  checked={form.mentionAll}
                  onCheckedChange={(mentionAll) => setForm({ ...form, mentionAll })}
                  aria-label="Mencionar todos os participantes"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-muted/35">
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Pin className="size-3.5" />
                    Fixar mensagem
                  </span>
                  <span className="text-xs text-muted-foreground">Fixa no topo após o envio</span>
                </span>
                <Switch
                  checked={form.pinMessage}
                  onCheckedChange={(pinMessage) => setForm({ ...form, pinMessage })}
                  aria-label="Fixar mensagem no topo"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de mensagem</Label>
                <Select
                  value={form.type}
                  onValueChange={(type) => setForm({ ...form, type: type as SavedMessage["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto e/ou anexo</SelectItem>
                    <SelectItem value="audio">Áudio como gravado</SelectItem>
                    <SelectItem value="poll">Enquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-file">Anexo opcional</Label>
                <div className="flex gap-2">
                  <label
                    htmlFor="message-file"
                    className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 text-sm text-muted-foreground hover:bg-muted/40"
                  >
                    <Paperclip className="size-4 shrink-0" />
                    <span className="truncate">{form.attachmentName || "Escolher arquivo"}</span>
                  </label>
                  {attachmentPreview ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0"
                      aria-label="Remover anexo"
                      onClick={() => selectAttachment()}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <input
                  id="message-file"
                  type="file"
                  className="sr-only"
                  accept="image/*,video/*,audio/*,.pdf"
                  onChange={(event) => selectAttachment(event.target.files?.[0])}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-5">
              <Button variant="outline" onClick={resetForm}>
                Limpar
              </Button>
              <Button disabled={!valid} onClick={createMessage}>
                <CheckCircle2 className="size-4" />
                Criar mensagem
              </Button>
            </div>
          </div>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card title="Prévia no WhatsApp" description="Com o fundo padrão do WhatsApp">
            <div className="overflow-hidden rounded-2xl border border-border bg-[#f5f1eb] dark:bg-[#0b141a]">
              <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-3 dark:bg-[#202c33]">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  TZ
                </span>
                <div>
                  <p className="text-sm font-medium text-[#111b21] dark:text-white">
                    Grupo TudoZap
                  </p>
                  <p className="text-[11px] text-[#667781] dark:text-[#aebac1]">online</p>
                </div>
              </div>
              <div className="relative min-h-80 bg-[#f5f1eb] p-4 dark:bg-[#0b141a]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[#eae0d3] dark:bg-[#182229]"
                  style={{
                    WebkitMaskImage:
                      'url("https://static.whatsapp.net/rsrc.php/yx/r/voSdkk88H7C.svg")',
                    maskImage: 'url("https://static.whatsapp.net/rsrc.php/yx/r/voSdkk88H7C.svg")',
                    WebkitMaskRepeat: "repeat",
                    maskRepeat: "repeat",
                    WebkitMaskSize: "540px 960px",
                    maskSize: "540px 960px",
                  }}
                />
                <div className="relative z-10">
                  <p className="mb-3 text-center text-[10px] font-medium text-[#667781] dark:text-[#8696a0]">
                    HOJE
                  </p>
                  <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-2 text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-white">
                    {attachmentPreview ? (
                      <div className="mb-2 overflow-hidden rounded-lg bg-black/5">
                        {attachmentPreview.type.startsWith("image/") ? (
                          <img
                            src={attachmentPreview.url}
                            alt={`Prévia de ${attachmentPreview.name}`}
                            className="max-h-96 w-full object-contain"
                          />
                        ) : attachmentPreview.type.startsWith("video/") ? (
                          <video
                            src={attachmentPreview.url}
                            controls
                            className="max-h-96 w-full object-contain bg-black"
                          />
                        ) : attachmentPreview.type.startsWith("audio/") ? (
                          <div className="p-2">
                            <audio src={attachmentPreview.url} controls className="h-10 w-full" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 text-xs">
                            <span className="grid size-9 place-items-center rounded-lg bg-white/55 dark:bg-black/20">
                              <FileText className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {attachmentPreview.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="px-1 pb-1">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {form.body ||
                          (attachmentPreview ? "" : "Digite sua mensagem para ver a prévia...")}
                      </p>
                      <p className="mt-1 text-right text-[10px] opacity-60">agora ✓✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <Card
        title="Histórico de mensagens"
        description="Mensagens criadas, agendadas e enviadas"
        actions={<Pill>{messages.length} mensagens</Pill>}
      >
        {messages.length ? (
          <div className="space-y-2">
            {messages.map((message) => (
              <article
                key={message.id}
                className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{message.title}</h3>
                    <Pill tone={statusTone(message.status)}>{statusLabel(message.status)}</Pill>
                    <Pill>
                      <Users className="size-3" />
                      {message.groupIds?.length || 0} grupos
                    </Pill>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{message.body}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  {message.scheduledAt
                    ? new Date(message.scheduledAt).toLocaleString("pt-BR")
                    : new Date(message.createdAt).toLocaleString("pt-BR")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-9 text-center">
            <Archive className="size-8 text-primary" />
            <p className="mt-3 text-sm font-medium">Seu histórico está vazio</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A primeira mensagem criada aparecerá aqui.
            </p>
          </div>
        )}
      </Card>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <div className="mb-2 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle>Mensagem criada com sucesso!</DialogTitle>
            <DialogDescription>O que você gostaria de fazer agora?</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{created?.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{created?.body}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Users className="size-3.5" />
                  {created?.groupIds?.length || 0} grupos selecionados
                </p>
              </div>
              <Pill tone="success">Mensagem criada</Pill>
            </div>
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => finish("sent")}
              className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/35 hover:bg-credit/40"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                <Send />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Enviar agora</span>
                <span className="text-xs text-muted-foreground">
                  Enviar agora para os {created?.groupIds?.length || 0} grupos selecionados
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActionOpen(false);
                setScheduleOpen(true);
              }}
              className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:border-warning/40 hover:bg-warning/5"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-warning/12 text-warning">
                <CalendarClock />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Agendar envio</span>
                <span className="text-xs text-muted-foreground">
                  Definir a data e a hora do envio
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => finish("draft")}
              className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Archive />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Fazer depois</span>
                <span className="text-xs text-muted-foreground">Manter salva no histórico</span>
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar mensagem</DialogTitle>
            <DialogDescription>Escolha quando a mensagem deverá ser enviada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-at">Data e hora</Label>
              <Input
                id="schedule-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <Users className="mt-0.5 size-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Grupos do envio:</strong>{" "}
                {created?.groupNames?.join(", ") || "Nenhum grupo selecionado"}.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!scheduledAt} onClick={confirmSchedule}>
              <CalendarClock className="size-4" />
              Confirmar agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
