import type {
  AssistantMessage,
  AssistantReplyReference,
  AssistantRole,
} from "./assistantTypes";

export const ASSISTANT_HISTORY_STORAGE_KEY = "ald_assistant_history";

const MAX_STORED_ASSISTANT_MESSAGES = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssistantRole(value: unknown): value is AssistantRole {
  return value === "user" || value === "assistant";
}

function normalizeReplyReference(value: unknown): AssistantReplyReference | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isAssistantRole(value.role)) {
    return null;
  }

  const content = typeof value.content === "string" ? value.content.trim() : "";

  if (!content || content.length > 1000) {
    return null;
  }

  return { id: value.id, role: value.role, content };
}

function normalizeAssistantMessage(value: unknown): AssistantMessage | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isAssistantRole(value.role) ||
    typeof value.content !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  const content = value.content.trim();

  if (!content || content.length > 1000) {
    return null;
  }

  return {
    id: value.id,
    role: value.role,
    content,
    createdAt: value.createdAt,
    replyTo: value.replyTo === undefined ? null : normalizeReplyReference(value.replyTo),
  };
}

export function loadAssistantHistory(): AssistantMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ASSISTANT_HISTORY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeAssistantMessage)
      .filter((message): message is AssistantMessage => message !== null)
      .slice(-MAX_STORED_ASSISTANT_MESSAGES);
  } catch {
    return [];
  }
}

export function saveAssistantHistory(messages: AssistantMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ASSISTANT_HISTORY_STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_STORED_ASSISTANT_MESSAGES)),
    );
  } catch {
    // Storage can be unavailable in private browsing or when it is full.
  }
}
