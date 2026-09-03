import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  Check,
  CheckCheck,
  ChevronDown,
  CircleUserRound,
  Copy,
  FileText,
  Forward,
  ImageIcon,
  MessageSquareReply,
  Mic,
  MoreVertical,
  Pause,
  Phone,
  Pin,
  Play,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Tag,
  Trash2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pill } from "@/components/app/Ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/crm")({
  head: () => ({
    meta: [
      { title: "CRM | Painel TudoZap" },
      {
        name: "description",
        content: "Central de conversas e relacionamento integrada ao WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CrmPage,
});

type ChatMessage = {
  id: number;
  direction: "in" | "out";
  text: string;
  time: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentUrl?: string;
  pinned?: boolean;
  reaction?: string;
  replyTo?: string;
  viewOnce?: boolean;
};
type Conversation = {
  id: number;
  name: string;
  phone: string;
  initials: string;
  color: string;
  lastMessage: string;
  time: string;
  unread: number;
  pinned: boolean;
  labels: string[];
  notes: string[];
  messages: ChatMessage[];
};

const LABELS = ["Novo lead", "Cliente", "Prioridade", "Pagamento", "Suporte"];
const EMOJI_OPTIONS = [
  { emoji: "😀", name: "rosto sorridente", keywords: "feliz alegria sorriso" },
  { emoji: "😃", name: "sorriso aberto", keywords: "feliz alegria" },
  { emoji: "😄", name: "sorrindo com olhos", keywords: "feliz alegria" },
  { emoji: "😁", name: "rosto radiante", keywords: "feliz dentes" },
  { emoji: "😂", name: "chorando de rir", keywords: "risada engraçado lágrimas" },
  { emoji: "🤣", name: "rolando de rir", keywords: "risada engraçado" },
  { emoji: "😊", name: "rosto feliz", keywords: "sorriso tímido" },
  { emoji: "🥰", name: "rosto com corações", keywords: "amor apaixonado" },
  { emoji: "😍", name: "olhos de coração", keywords: "amor apaixonado" },
  { emoji: "😘", name: "mandando beijo", keywords: "amor beijo" },
  { emoji: "😉", name: "piscando", keywords: "piscar brincadeira" },
  { emoji: "😎", name: "óculos escuros", keywords: "legal sol" },
  { emoji: "🤩", name: "olhos de estrela", keywords: "incrível empolgado" },
  { emoji: "🥳", name: "festa", keywords: "aniversário comemoração" },
  { emoji: "🤔", name: "pensando", keywords: "dúvida reflexão" },
  { emoji: "😅", name: "suor frio", keywords: "alívio nervoso" },
  { emoji: "😮", name: "surpreso", keywords: "espanto uau" },
  { emoji: "😢", name: "chorando", keywords: "triste lágrima" },
  { emoji: "😭", name: "chorando muito", keywords: "triste lágrimas" },
  { emoji: "😡", name: "bravo", keywords: "raiva zangado" },
  { emoji: "👍", name: "joinha", keywords: "positivo curtir aprovado" },
  { emoji: "👎", name: "não gostei", keywords: "negativo reprovar" },
  { emoji: "👏", name: "palmas", keywords: "parabéns aplausos" },
  { emoji: "🙌", name: "mãos levantadas", keywords: "comemoração vitória" },
  { emoji: "🙏", name: "mãos juntas", keywords: "obrigado oração por favor" },
  { emoji: "🤝", name: "aperto de mãos", keywords: "acordo parceria" },
  { emoji: "💪", name: "braço forte", keywords: "força academia" },
  { emoji: "👀", name: "olhos", keywords: "olhando atenção" },
  { emoji: "❤️", name: "coração vermelho", keywords: "amor paixão" },
  { emoji: "💚", name: "coração verde", keywords: "amor whatsapp tudozap" },
  { emoji: "🔥", name: "fogo", keywords: "quente sucesso" },
  { emoji: "✨", name: "brilhos", keywords: "mágica novidade" },
  { emoji: "🎉", name: "confete", keywords: "festa comemoração" },
  { emoji: "💯", name: "cem pontos", keywords: "perfeito nota" },
  { emoji: "✅", name: "marca de verificação", keywords: "certo concluído aprovado" },
  { emoji: "🚀", name: "foguete", keywords: "lançamento rápido" },
  { emoji: "📌", name: "alfinete", keywords: "fixar localização" },
  { emoji: "📣", name: "megafone", keywords: "anúncio divulgação" },
  { emoji: "💬", name: "balão de conversa", keywords: "mensagem chat" },
  { emoji: "📱", name: "celular", keywords: "telefone smartphone" },
];
const normalizeEmojiSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function renderInlineFormatting(text: string, keyPrefix: string, showMarkers = false): ReactNode[] {
  const pattern = /(`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    const inner = token.slice(1, -1);
    const key = `${keyPrefix}-${match.index}`;
    const marker = token[0];
    if (token.startsWith("`"))
      nodes.push(
        <code
          key={key}
          className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/10"
        >
          {showMarkers ? <span className="opacity-50">{marker}</span> : null}
          {inner}
          {showMarkers ? <span className="opacity-50">{marker}</span> : null}
        </code>,
      );
    else if (token.startsWith("*"))
      nodes.push(
        <strong key={key}>
          {showMarkers ? <span className="font-normal opacity-50">{marker}</span> : null}
          {renderInlineFormatting(inner, key, showMarkers)}
          {showMarkers ? <span className="font-normal opacity-50">{marker}</span> : null}
        </strong>,
      );
    else if (token.startsWith("_"))
      nodes.push(
        <em key={key}>
          {showMarkers ? <span className="not-italic opacity-50">{marker}</span> : null}
          {renderInlineFormatting(inner, key, showMarkers)}
          {showMarkers ? <span className="not-italic opacity-50">{marker}</span> : null}
        </em>,
      );
    else
      nodes.push(
        <s key={key}>
          {showMarkers ? <span className="no-underline opacity-50">{marker}</span> : null}
          {renderInlineFormatting(inner, key, showMarkers)}
          {showMarkers ? <span className="no-underline opacity-50">{marker}</span> : null}
        </s>,
      );
    cursor = match.index + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function WhatsAppFormattedText({
  text,
  className,
  showMarkers = false,
}: {
  text: string;
  className?: string;
  showMarkers?: boolean;
}) {
  const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);
  return (
    <div className={className}>
      {parts.map((part, partIndex) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          return (
            <pre
              key={`code-${partIndex}`}
              className="overflow-x-auto whitespace-pre-wrap rounded bg-black/10 px-2 py-1.5 font-mono text-[0.9em] dark:bg-white/10"
            >
              {showMarkers ? <span className="opacity-50">```</span> : null}
              {part.slice(3, -3)}
              {showMarkers ? <span className="opacity-50">```</span> : null}
            </pre>
          );
        }
        return part.split("\n").map((line, lineIndex) => {
          const key = `${partIndex}-${lineIndex}`;
          const quote = line.match(/^>\s(.*)$/);
          const bullet = line.match(/^[*-]\s(.*)$/);
          const numbered = line.match(/^(\d+)\.\s(.*)$/);
          if (quote)
            return (
              <div
                key={key}
                className="border-l-4 border-[#8696a0] pl-2 text-[#54656f] dark:text-[#aebac1]"
              >
                {showMarkers ? <span className="mr-1 opacity-50">&gt;</span> : null}
                {renderInlineFormatting(quote[1], key, showMarkers)}
              </div>
            );
          if (bullet)
            return (
              <div key={key} className="flex gap-2">
                <span aria-hidden="true">{showMarkers ? `${line[0]} ` : "•"}</span>
                <span>{renderInlineFormatting(bullet[1], key, showMarkers)}</span>
              </div>
            );
          if (numbered)
            return (
              <div key={key} className="flex gap-2">
                <span>{numbered[1]}.</span>
                <span>{renderInlineFormatting(numbered[2], key, showMarkers)}</span>
              </div>
            );
          if (!line) return <span key={key} className="block h-4" />;
          return <div key={key}>{renderInlineFormatting(line, key, showMarkers)}</div>;
        });
      })}
    </div>
  );
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Ana Martins",
    phone: "+55 11 99876-4321",
    initials: "AM",
    color: "bg-emerald-500",
    lastMessage: "Gostaria de saber mais sobre o plano",
    time: "10:42",
    unread: 2,
    pinned: true,
    labels: ["Novo lead", "Prioridade"],
    notes: [],
    messages: [
      { id: 1, direction: "in", text: "Olá! Vi a apresentação no grupo.", time: "10:38" },
      { id: 2, direction: "in", text: "Gostaria de saber mais sobre o plano", time: "10:42" },
    ],
  },
  {
    id: 2,
    name: "Bruno Lima",
    phone: "+55 21 98765-1200",
    initials: "BL",
    color: "bg-sky-500",
    lastMessage: "Perfeito, obrigado pelo atendimento!",
    time: "09:18",
    unread: 0,
    pinned: false,
    labels: ["Cliente"],
    notes: ["Cliente interessado em ampliar o número de grupos."],
    messages: [
      { id: 1, direction: "out", text: "Seu acesso já está liberado, Bruno.", time: "09:15" },
      { id: 2, direction: "in", text: "Perfeito, obrigado pelo atendimento!", time: "09:18" },
    ],
  },
  {
    id: 3,
    name: "Comunidade TudoZap",
    phone: "Grupo · 284 participantes",
    initials: "TZ",
    color: "bg-primary",
    lastMessage: "Carlos: Já conseguimos conectar",
    time: "Ontem",
    unread: 5,
    pinned: false,
    labels: ["Suporte"],
    notes: [],
    messages: [
      { id: 1, direction: "in", text: "Já conseguimos conectar a nova instância.", time: "18:04" },
    ],
  },
  {
    id: 4,
    name: "Camila Rocha",
    phone: "+55 31 99122-7744",
    initials: "CR",
    color: "bg-violet-500",
    lastMessage: "Pode me enviar o link de pagamento?",
    time: "Ontem",
    unread: 0,
    pinned: false,
    labels: ["Pagamento"],
    notes: [],
    messages: [
      { id: 1, direction: "in", text: "Pode me enviar o link de pagamento?", time: "17:31" },
    ],
  },
  {
    id: 5,
    name: "Diego Santos",
    phone: "+55 41 98811-2210",
    initials: "DS",
    color: "bg-amber-500",
    lastMessage: "Tudo certo por aqui",
    time: "Terça",
    unread: 0,
    pinned: false,
    labels: [],
    notes: [],
    messages: [
      { id: 1, direction: "out", text: "Conseguiu testar a configuração?", time: "14:20" },
      { id: 2, direction: "in", text: "Tudo certo por aqui", time: "14:37" },
    ],
  },
];

const CRM_STORAGE_KEY = "tudozap-crm-conversations";

function CrmPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "mine">("all");
  const [messageText, setMessageText] = useState("");
  const [composerScrollTop, setComposerScrollTop] = useState(0);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [viewOnceAudio, setViewOnceAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const shouldSendRecordingRef = useRef(false);
  const recordingSecondsRef = useRef(0);
  const viewOnceAudioRef = useRef(false);
  const [noteText, setNoteText] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; type: string; url: string } | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [reactionTarget, setReactionTarget] = useState<number | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(CRM_STORAGE_KEY) || "null");
      if (Array.isArray(stored) && stored.length) setConversations(stored);
    } catch {
      /* mantém os dados visuais iniciais */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      /* a mídia continua disponível durante a sessão */
    }
  }, [conversations]);
  useEffect(() => {
    if (!isRecording || isRecordingPaused) return;
    const timer = window.setInterval(() => {
      recordingSecondsRef.current += 1;
      setRecordingSeconds(recordingSecondsRef.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording, isRecordingPaused]);
  useEffect(
    () => () => {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) || conversations[0];
  const visibleConversations = useMemo(
    () =>
      conversations
        .filter(
          (conversation) =>
            conversation.name.toLowerCase().includes(query.toLowerCase()) ||
            conversation.lastMessage.toLowerCase().includes(query.toLowerCase()),
        )
        .filter((conversation) => filter !== "unread" || conversation.unread > 0)
        .sort((first, second) => Number(second.pinned) - Number(first.pinned)),
    [conversations, filter, query],
  );
  const filteredEmojis = useMemo(() => {
    const normalizedQuery = normalizeEmojiSearch(emojiQuery.trim());
    if (!normalizedQuery) return EMOJI_OPTIONS;
    return EMOJI_OPTIONS.filter(({ emoji, name, keywords }) =>
      normalizeEmojiSearch(`${emoji} ${name} ${keywords}`).includes(normalizedQuery),
    );
  }, [emojiQuery]);

  const updateSelected = (changes: Partial<Conversation>) =>
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selected.id ? { ...conversation, ...changes } : conversation,
      ),
    );
  const updateConversation = (id: number, changes: Partial<Conversation>) =>
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, ...changes } : conversation,
      ),
    );
  const selectConversation = (id: number) => {
    setSelectedId(id);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation,
      ),
    );
  };
  const toggleLabel = (label: string) =>
    updateSelected({
      labels: selected.labels.includes(label)
        ? selected.labels.filter((item) => item !== label)
        : [...selected.labels, label],
    });
  const sendMessage = () => {
    if (!messageText.trim() && !attachment) return;
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const message: ChatMessage = {
      id: Date.now(),
      direction: "out",
      text: messageText.trim(),
      time,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
      attachmentUrl: attachment?.url,
      replyTo: replyingTo?.text || replyingTo?.attachmentName,
    };
    updateSelected({
      messages: [...selected.messages, message],
      lastMessage: messageText.trim() || attachment?.name || "Anexo",
      time,
    });
    setMessageText("");
    setAttachment(null);
    setReplyingTo(null);
  };
  const addNote = () => {
    if (!noteText.trim()) return;
    updateSelected({ notes: [...selected.notes, noteText.trim()] });
    setNoteText("");
  };
  const chooseAttachment = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setAttachment({
        name: file.name,
        type: file.type,
        url: typeof reader.result === "string" ? reader.result : "",
      });
    reader.readAsDataURL(file);
  };
  const formatRecordingTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const appendRecordedAudio = (url: string, type: string) => {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const message: ChatMessage = {
      id: Date.now(),
      direction: "out",
      text: "",
      time,
      attachmentName: `Áudio · ${formatRecordingTime(recordingSecondsRef.current)}`,
      attachmentType: type || "audio/webm",
      attachmentUrl: url,
      replyTo: replyingTo?.text || replyingTo?.attachmentName,
      viewOnce: viewOnceAudioRef.current,
    };
    updateSelected({ messages: [...selected.messages, message], lastMessage: "🎤 Áudio", time });
    setReplyingTo(null);
  };
  const resetRecorder = () => {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
    recordingChunksRef.current = [];
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
    setViewOnceAudio(false);
    viewOnceAudioRef.current = false;
  };
  const startRecording = async () => {
    setRecordingError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      shouldSendRecordingRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = [...recordingChunksRef.current];
        const shouldSend = shouldSendRecordingRef.current;
        const type = recorder.mimeType || "audio/webm";
        if (shouldSend && chunks.length) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") appendRecordedAudio(reader.result, type);
            resetRecorder();
          };
          reader.readAsDataURL(new Blob(chunks, { type }));
        } else resetRecorder();
      };
      recorder.start(250);
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      setIsRecordingPaused(false);
      setIsRecording(true);
    } catch {
      setRecordingError(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador.",
      );
    }
  };
  const stopRecording = (send: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    shouldSendRecordingRef.current = send;
    recorder.stop();
  };
  const toggleRecordingPause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setIsRecordingPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      setIsRecordingPaused(false);
    }
  };
  const updateMessage = (messageId: number, changes: Partial<ChatMessage>) =>
    updateSelected({
      messages: selected.messages.map((message) =>
        message.id === messageId ? { ...message, ...changes } : message,
      ),
    });
  const removeConversation = () => {
    if (!conversationToDelete) return;
    const next = conversations.filter(
      (conversation) => conversation.id !== conversationToDelete.id,
    );
    setConversations(next);
    if (selectedId === conversationToDelete.id && next.length) setSelectedId(next[0].id);
    setConversationToDelete(null);
  };
  const removeMessage = () => {
    if (!messageToDelete) return;
    updateSelected({
      messages: selected.messages.filter((message) => message.id !== messageToDelete.id),
    });
    setMessageToDelete(null);
  };

  return (
    <section className="-m-4 overflow-hidden border-y border-border bg-background sm:-m-6 lg:grid lg:h-[calc(100vh-65px)] lg:grid-cols-[330px_minmax(380px,1fr)_320px] lg:border lg:rounded-2xl">
      <aside className="flex min-h-[720px] flex-col border-r border-[#e9edef] bg-white dark:border-[#222d34] dark:bg-[#111b21] lg:min-h-0">
        <header className="flex h-16 items-center justify-between bg-[#f0f2f5] px-4 dark:bg-[#202c33]">
          <div>
            <h1 className="font-semibold text-[#111b21] dark:text-[#e9edef]">Conversas</h1>
            <p className="text-[11px] text-[#667781] dark:text-[#8696a0]">
              Central de atendimento TudoZap
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#54656f] dark:text-[#aebac1]"
            aria-label="Nova conversa"
          >
            <Plus className="size-5" />
          </Button>
        </header>
        <div className="space-y-3 border-b border-[#e9edef] p-3 dark:border-[#222d34]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#667781]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar ou iniciar conversa"
              className="h-9 rounded-lg border-0 bg-[#f0f2f5] pl-10 shadow-none dark:bg-[#202c33]"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { key: "all", label: "Todas" },
                { key: "unread", label: "Não lidas" },
                { key: "mine", label: "Minhas" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  filter === item.key
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-[#e9edef] text-[#667781] hover:bg-[#f5f6f6] dark:border-[#313d45] dark:text-[#aebac1] dark:hover:bg-[#202c33]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visibleConversations.map((conversation) => (
            <ContextMenu key={conversation.id}>
              <ContextMenuTrigger asChild>
                <button
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-b border-[#f0f2f5] px-3 py-3 text-left transition-colors dark:border-[#202c33]",
                    selected.id === conversation.id
                      ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
                      : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]",
                  )}
                >
                  <Avatar className="size-12">
                    <AvatarFallback className={`${conversation.color} font-semibold text-white`}>
                      {conversation.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 self-center">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-[#111b21] dark:text-[#e9edef]">
                        {conversation.name}
                      </span>
                      {conversation.pinned ? (
                        <Pin className="size-3 rotate-45 text-[#667781]" />
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#667781] dark:text-[#8696a0]">
                      {conversation.lastMessage}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1 self-center">
                    <span
                      className={cn(
                        "text-[10px]",
                        conversation.unread
                          ? "font-medium text-primary"
                          : "text-[#667781] dark:text-[#8696a0]",
                      )}
                    >
                      {conversation.time}
                    </span>
                    {conversation.unread ? (
                      <span className="grid min-w-5 place-items-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    ) : null}
                  </span>
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <ContextMenuItem
                  onSelect={() =>
                    updateConversation(conversation.id, { pinned: !conversation.pinned })
                  }
                >
                  <Pin className="mr-2 size-4" />
                  {conversation.pinned ? "Desafixar conversa" : "Fixar conversa"}
                </ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <Tag className="mr-2 size-4" />
                    Adicionar etiqueta
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    {LABELS.map((label) => (
                      <ContextMenuItem
                        key={label}
                        onSelect={() =>
                          updateConversation(conversation.id, {
                            labels: conversation.labels.includes(label)
                              ? conversation.labels.filter((item) => item !== label)
                              : [...conversation.labels, label],
                          })
                        }
                      >
                        {conversation.labels.includes(label) ? (
                          <Check className="mr-2 size-4 text-primary" />
                        ) : (
                          <Plus className="mr-2 size-4" />
                        )}
                        {label}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuItem
                  onSelect={() =>
                    updateConversation(conversation.id, {
                      unread: Math.max(1, conversation.unread),
                    })
                  }
                >
                  <MessageSquareReply className="mr-2 size-4" />
                  Marcar como não lida
                </ContextMenuItem>
                <ContextMenuItem>
                  <Archive className="mr-2 size-4" />
                  Arquivar conversa
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => setConversationToDelete(conversation)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Apagar conversa
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </aside>

      <main className="flex min-h-[720px] min-w-0 flex-col bg-[#f5f1eb] dark:bg-[#0b141a] lg:min-h-0">
        <header className="relative z-20 flex h-16 items-center gap-3 border-b border-black/5 bg-[#f0f2f5] px-4 dark:border-white/5 dark:bg-[#202c33]">
          <Avatar className="size-10">
            <AvatarFallback className={`${selected.color} font-semibold text-white`}>
              {selected.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium text-[#111b21] dark:text-[#e9edef]">
              {selected.name}
            </h2>
            <p className="truncate text-xs text-[#667781] dark:text-[#8696a0]">{selected.phone}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-[#54656f] dark:text-[#aebac1]",
              selected.pinned && "bg-primary/10 text-primary",
            )}
            onClick={() => updateSelected({ pinned: !selected.pinned })}
            aria-label={selected.pinned ? "Desafixar conversa" : "Fixar conversa"}
            title={selected.pinned ? "Desafixar conversa" : "Fixar conversa"}
          >
            <Pin className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#54656f] dark:text-[#aebac1]"
            aria-label="Mais opções"
          >
            <MoreVertical className="size-5" />
          </Button>
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-[#f5f1eb] px-[7%] py-6 dark:bg-[#0b141a]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[#eae0d3] dark:bg-[#182229]"
            style={{
              WebkitMaskImage: 'url("https://static.whatsapp.net/rsrc.php/yx/r/voSdkk88H7C.svg")',
              maskImage: 'url("https://static.whatsapp.net/rsrc.php/yx/r/voSdkk88H7C.svg")',
              WebkitMaskRepeat: "repeat",
              maskRepeat: "repeat",
              WebkitMaskSize: "540px 960px",
              maskSize: "540px 960px",
            }}
          />
          <div className="relative z-10 space-y-2">
            <div className="mx-auto mb-4 w-fit rounded-lg bg-white/90 px-3 py-1 text-[10px] font-medium text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#aebac1]">
              HOJE
            </div>
            {selected.messages.map((message) => (
              <div
                key={message.id}
                className={cn("group flex", message.direction === "out" && "justify-end")}
              >
                <div
                  className={cn(
                    "relative max-w-[78%] rounded-lg px-3 py-2 text-sm text-[#111b21] shadow-sm dark:text-[#e9edef]",
                    message.direction === "out"
                      ? "rounded-tr-sm bg-[#d9fdd3] dark:bg-[#005c4b]"
                      : "rounded-tl-sm bg-white dark:bg-[#202c33]",
                  )}
                >
                  {reactionTarget === message.id ? (
                    <div className="absolute -top-12 right-0 z-30 flex items-center gap-1 rounded-full border border-border bg-popover p-1.5 shadow-lg">
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="grid size-8 place-items-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-muted"
                          onClick={() => {
                            updateMessage(message.id, { reaction: emoji });
                            setReactionTarget(null);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Opções da mensagem"
                        className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-inherit text-[#667781] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100 dark:text-[#aebac1]"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      collisionPadding={16}
                      className="w-60"
                    >
                      <DropdownMenuItem onSelect={() => setReplyingTo(message)}>
                        <Reply />
                        Responder
                      </DropdownMenuItem>
                      {message.direction === "in" ? (
                        <DropdownMenuItem
                          onSelect={() => {
                            setReplyingTo(message);
                            setMessageText(`@${selected.name} `);
                          }}
                        >
                          <MessageSquareReply />
                          Responder em particular
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem onSelect={() => setMessageText(`Olá, ${selected.name}! `)}>
                        <CircleUserRound />
                        Conversar com {selected.name.split(" ")[0]}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() =>
                          navigator.clipboard.writeText(
                            message.text || message.attachmentName || "",
                          )
                        }
                      >
                        <Copy />
                        Copiar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setReactionTarget(message.id)}>
                        <Smile />
                        Reagir
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          setMessageText(
                            `Encaminhada: ${message.text || message.attachmentName || "mensagem"}`,
                          )
                        }
                      >
                        <Forward />
                        Encaminhar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => updateMessage(message.id, { pinned: !message.pinned })}
                      >
                        <Pin />
                        {message.pinned ? "Desafixar" : "Fixar"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onSelect={() => setMessageToDelete(message)}
                      >
                        <Trash2 />
                        Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {message.pinned ? (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-primary">
                      <Pin className="size-3" />
                      Mensagem fixada
                    </div>
                  ) : null}
                  {message.replyTo ? (
                    <div className="mb-2 border-l-2 border-primary bg-black/5 px-2 py-1 text-[11px] text-[#667781] dark:bg-white/5 dark:text-[#aebac1]">
                      {message.replyTo}
                    </div>
                  ) : null}
                  {message.attachmentUrl ? (
                    <div className="mb-2 overflow-hidden rounded-md">
                      {message.attachmentType?.startsWith("image/") ? (
                        <img
                          src={message.attachmentUrl}
                          alt={message.attachmentName || "Imagem anexada"}
                          className="max-h-80 w-full object-contain"
                        />
                      ) : message.attachmentType?.startsWith("audio/") ? (
                        <div className="flex items-center gap-2 bg-black/5 p-2 dark:bg-white/5">
                          <Mic className="size-5 text-primary" />
                          <audio
                            src={message.attachmentUrl}
                            controls
                            className="h-9 min-w-0 flex-1"
                          />
                          {message.viewOnce ? (
                            <span
                              className="grid size-6 shrink-0 place-items-center rounded-full border border-primary text-[10px] font-semibold text-primary"
                              title="Visualização única"
                            >
                              1
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-black/5 p-3 dark:bg-white/5">
                          <FileText className="size-6 text-primary" />
                          <span className="min-w-0 truncate text-xs">{message.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                  {message.text ? (
                    <WhatsAppFormattedText text={message.text} className="pr-5 leading-relaxed" />
                  ) : null}
                  <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781] dark:text-[#aebac1]">
                    {message.time}
                    {message.direction === "out" ? (
                      <CheckCheck className="size-3 text-[#53bdeb]" />
                    ) : null}
                  </span>
                  {message.reaction ? (
                    <button
                      type="button"
                      onClick={() => setReactionTarget(message.id)}
                      className="absolute -bottom-4 right-2 rounded-full border border-white bg-white px-1.5 py-0.5 text-sm shadow-sm dark:border-[#202c33] dark:bg-[#202c33]"
                    >
                      {message.reaction}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        <footer className="relative bg-[#f0f2f5] px-3 py-2.5 dark:bg-[#202c33]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-[#2a3942]">
            {replyingTo ? (
              <div className="m-2 mb-0 flex items-center gap-3 rounded-lg bg-[#f0f2f5] p-2.5 text-xs dark:bg-[#202c33]">
                <div className="min-w-0 flex-1 border-l-4 border-[#c47a4a] pl-3">
                  <p className="font-medium text-[#a85f34] dark:text-[#ff9f69]">
                    {replyingTo.direction === "in" ? selected.name : "Você"}
                  </p>
                  <p className="truncate text-[#667781] dark:text-[#aebac1]">
                    {replyingTo.text || replyingTo.attachmentName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-full text-[#54656f] dark:text-[#aebac1]"
                  aria-label="Cancelar resposta"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="size-5" />
                </Button>
              </div>
            ) : null}
            {attachment ? (
              <div className="m-2 mb-0 flex items-center gap-3 rounded-lg bg-[#f0f2f5] p-2.5 text-xs dark:bg-[#202c33]">
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={attachment.url}
                    alt="Prévia do anexo"
                    className="size-14 rounded-md object-cover"
                  />
                ) : attachment.type.startsWith("video/") ? (
                  <video src={attachment.url} className="size-14 rounded-md object-cover" muted />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-md bg-white dark:bg-[#2a3942]">
                    <FileText className="size-5 text-primary" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{attachment.name}</p>
                  <p className="text-muted-foreground">Adicione uma legenda abaixo</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-full text-[#54656f] dark:text-[#aebac1]"
                  aria-label="Remover anexo"
                  onClick={() => setAttachment(null)}
                >
                  <X className="size-5" />
                </Button>
              </div>
            ) : null}
            {isRecording ? (
              <div className="flex min-h-14 items-center gap-3 px-3 py-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-[#54656f] hover:bg-destructive/10 hover:text-destructive dark:text-[#aebac1]"
                  aria-label="Cancelar gravação"
                  title="Cancelar gravação"
                  onClick={() => stopRecording(false)}
                >
                  <Trash2 className="size-5" />
                </Button>
                <div className="flex shrink-0 items-center gap-2 text-sm tabular-nums text-[#3b4a54] dark:text-[#d1d7db]">
                  <span
                    className={cn(
                      "size-2.5 rounded-full bg-red-500",
                      !isRecordingPaused && "animate-pulse",
                    )}
                  />
                  <span>{formatRecordingTime(recordingSeconds)}</span>
                </div>
                <div
                  className="flex h-8 min-w-16 flex-1 items-center justify-center gap-[3px] overflow-hidden"
                  aria-label="Forma de onda da gravação"
                >
                  {Array.from({ length: 38 }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "w-0.5 shrink-0 rounded-full bg-[#8696a0]",
                        !isRecordingPaused && "animate-pulse",
                      )}
                      style={{
                        height: `${6 + ((index * 7) % 17)}px`,
                        animationDelay: `${index * 35}ms`,
                      }}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-[#54656f] dark:text-[#aebac1]"
                  aria-label={isRecordingPaused ? "Continuar gravação" : "Pausar gravação"}
                  title={isRecordingPaused ? "Continuar gravação" : "Pausar gravação"}
                  onClick={toggleRecordingPause}
                >
                  {isRecordingPaused ? (
                    <Play className="size-5 fill-current" />
                  ) : (
                    <Pause className="size-5 fill-current" />
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    setViewOnceAudio((current) => {
                      viewOnceAudioRef.current = !current;
                      return !current;
                    })
                  }
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-colors",
                    viewOnceAudio
                      ? "border-primary bg-primary text-white"
                      : "border-[#54656f] text-[#54656f] dark:border-[#aebac1] dark:text-[#aebac1]",
                  )}
                  aria-label="Ativar a visualização única"
                  title="Visualização única"
                >
                  1
                </button>
                <Button
                  size="icon"
                  className="shrink-0 rounded-full bg-[#00a884] text-white hover:bg-[#008f72]"
                  onClick={() => stopRecording(true)}
                  aria-label="Enviar áudio"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex min-h-12 items-center gap-0.5 px-2 py-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-full text-[#54656f] dark:text-[#aebac1]"
                      aria-label="Adicionar anexo"
                    >
                      <Plus className="size-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="top"
                    className="w-56 space-y-1 rounded-xl p-2"
                  >
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <span className="grid size-8 place-items-center rounded-full bg-violet-500 text-white">
                        <ImageIcon className="size-4" />
                      </span>
                      Fotos e vídeos
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="sr-only"
                        onChange={(event) => chooseAttachment(event.target.files?.[0])}
                      />
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <span className="grid size-8 place-items-center rounded-full bg-sky-500 text-white">
                        <FileText className="size-4" />
                      </span>
                      Documento
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(event) => chooseAttachment(event.target.files?.[0])}
                      />
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <span className="grid size-8 place-items-center rounded-full bg-orange-500 text-white">
                        <Mic className="size-4" />
                      </span>
                      Áudio
                      <input
                        type="file"
                        accept="audio/*"
                        className="sr-only"
                        onChange={(event) => chooseAttachment(event.target.files?.[0])}
                      />
                    </label>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-full text-[#54656f] dark:text-[#aebac1]"
                      aria-label="Abrir emojis"
                    >
                      <Smile className="size-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="top"
                    className="w-[340px] overflow-hidden rounded-2xl border-[#e9edef] bg-white p-0 dark:border-[#313d45] dark:bg-[#202c33]"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold">Emojis</p>
                    </div>
                    <div className="p-3">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={emojiQuery}
                          onChange={(event) => setEmojiQuery(event.target.value)}
                          className="h-9 rounded-lg border-0 bg-[#f0f2f5] pl-9 shadow-none dark:bg-[#111b21]"
                          placeholder="Pesquisar emoji"
                        />
                      </div>
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {emojiQuery ? "Resultados" : "Emojis disponíveis"}
                      </p>
                      {filteredEmojis.length ? (
                        <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto">
                          {filteredEmojis.map(({ emoji, name }) => (
                            <button
                              key={name}
                              type="button"
                              title={name}
                              aria-label={name}
                              className="grid size-9 place-items-center rounded-lg text-xl hover:bg-muted"
                              onClick={() => setMessageText((current) => `${current}${emoji}`)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-xs text-muted-foreground">
                          Nenhum emoji encontrado.
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="relative min-w-0 flex-1 self-stretch">
                  {messageText ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 overflow-hidden px-2 py-2.5 text-base leading-5 text-[#111b21] md:text-sm dark:text-[#e9edef]"
                    >
                      <div style={{ transform: `translateY(-${composerScrollTop}px)` }}>
                        <WhatsAppFormattedText text={messageText} showMarkers />
                      </div>
                    </div>
                  ) : null}
                  <Textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onScroll={(event) => setComposerScrollTop(event.currentTarget.scrollTop)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={attachment ? "Escreva uma legenda..." : "Digite uma mensagem"}
                    rows={1}
                    className="relative max-h-28 !min-h-10 w-full resize-none border-0 bg-transparent px-2 py-2.5 leading-5 text-transparent caret-[#111b21] shadow-none selection:bg-[#00a884]/25 placeholder:text-[#667781] focus-visible:ring-0 dark:caret-[#e9edef] dark:placeholder:text-[#aebac1]"
                  />
                </div>
                {messageText.trim() || attachment ? (
                  <Button
                    size="icon"
                    className="shrink-0 rounded-full bg-[#00a884] text-white hover:bg-[#008f72]"
                    onClick={sendMessage}
                    aria-label="Enviar mensagem"
                  >
                    <Send className="size-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full text-[#54656f] dark:text-[#aebac1]"
                    onClick={startRecording}
                    aria-label="Gravar mensagem de voz"
                    title="Gravar mensagem de voz"
                  >
                    <Mic className="size-5" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {recordingError ? (
            <p className="mt-1.5 px-3 text-xs text-destructive">{recordingError}</p>
          ) : null}
        </footer>
      </main>

      <aside className="hidden min-w-0 flex-col border-l border-[#e9edef] bg-white dark:border-[#222d34] dark:bg-[#111b21] lg:flex">
        <header className="flex h-16 items-center justify-between border-b border-[#e9edef] px-4 dark:border-[#222d34]">
          <div>
            <h2 className="text-sm font-semibold">Dados do contato</h2>
            <p className="text-[11px] text-muted-foreground">Informações do atendimento</p>
          </div>
          <CircleUserRound className="size-5 text-primary" />
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <section className="text-center">
            <Avatar className="mx-auto size-20">
              <AvatarFallback className={`${selected.color} text-xl font-semibold text-white`}>
                {selected.initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-3 font-semibold">{selected.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{selected.phone}</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button variant="outline" size="sm">
                <Phone className="size-3.5" />
                Ligar
              </Button>
              <Button variant="outline" size="sm">
                <UserRoundCheck className="size-3.5" />
                Atribuir
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="size-4 text-primary" />
                Etiquetas
              </h3>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {LABELS.map((label) => {
                const active = selected.labels.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary",
                    )}
                  >
                    {active ? <Check className="size-3" /> : <Plus className="size-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Archive className="size-4 text-primary" />
              Notas do cliente
            </h3>
            <div className="mt-3 space-y-2">
              {selected.notes.length ? (
                selected.notes.map((note, index) => (
                  <div
                    key={`${note}-${index}`}
                    className="rounded-lg bg-muted/45 p-2.5 text-xs leading-relaxed"
                  >
                    {note}
                  </div>
                ))
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Nenhuma nota adicionada.
                </p>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <Textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Escreva uma nota interna..."
                className="min-h-20 resize-none text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!noteText.trim()}
                onClick={addNote}
              >
                <Plus className="size-3.5" />
                Adicionar nota
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-primary/20 bg-credit/55 p-3">
            <h3 className="text-sm font-semibold">Ações da conversa</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSelected({ pinned: !selected.pinned })}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-xs hover:border-primary/35"
              >
                <Pin className={cn("size-4", selected.pinned && "text-primary")} />
                {selected.pinned ? "Desafixar" : "Fixar"}
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-xs hover:border-primary/35"
              >
                <Archive className="size-4" />
                Arquivar
              </button>
            </div>
          </section>
        </div>
      </aside>

      <AlertDialog
        open={Boolean(conversationToDelete)}
        onOpenChange={(open) => {
          if (!open) setConversationToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico de{" "}
              <strong className="text-foreground">{conversationToDelete?.name}</strong> será
              removido deste CRM. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={removeConversation}
            >
              <Trash2 className="size-4" />
              Apagar conversa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(messageToDelete)}
        onOpenChange={(open) => {
          if (!open) setMessageToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              A mensagem será removida apenas desta demonstração do CRM. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={removeMessage}
            >
              <Trash2 className="size-4" />
              Apagar mensagem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
