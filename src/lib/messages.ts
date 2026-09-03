export type MessageStatus = "draft" | "scheduled" | "sent";

export type SavedMessage = {
  id: number;
  title: string;
  body: string;
  type: "text" | "audio" | "poll";
  attachmentName?: string;
  attachmentDataUrl?: string;
  attachmentMimeType?: string;
  attachmentCaption: boolean;
  useAI: boolean;
  mentionAll: boolean;
  pinMessage: boolean;
  groupIds?: string[];
  groupNames?: string[];
  status: MessageStatus;
  createdAt: string;
  scheduledAt?: string;
};

export const MESSAGES_STORAGE_KEY = "tudozap-messages";

export function readMessages(): SavedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(MESSAGES_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeMessages(messages: SavedMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Imagens grandes podem ultrapassar a cota do navegador. Mantemos o
    // agendamento e seus metadados, descartando apenas a miniatura persistida.
    const withoutEmbeddedImages = messages.map(
      ({ attachmentDataUrl: _attachmentDataUrl, ...message }) => message,
    );
    try {
      window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(withoutEmbeddedImages));
    } catch {
      // O backend substituirá este armazenamento local; a interface continua
      // funcional na sessão atual mesmo quando o navegador estiver sem espaço.
    }
  }
}

export const statusLabel = (status: MessageStatus) =>
  status === "sent" ? "Enviada" : status === "scheduled" ? "Agendada" : "Salva";
