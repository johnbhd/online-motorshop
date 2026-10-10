import {
  ASSISTANT_MAX_HISTORY_ITEMS,
  ASSISTANT_MAX_MESSAGE_LENGTH,
  ASSISTANT_MAX_VISIBLE_MESSAGES,
  ASSISTANT_STORAGE_KEY,
} from "./assistantConstants";
import type {
  AssistantHistoryItem,
  AssistantMessage,
} from "./assistantTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssistantRole(value: unknown): value is AssistantMessage["role"] {
  return value === "user" || value === "assistant";
}

function normalizeMessage(value: unknown, index: number): AssistantMessage | null {
  if (!isRecord(value) || !isAssistantRole(value.role)) {
    return null;
  }

  if (typeof value.content !== "string") {
    return null;
  }

  const content = value.content.trim();

  if (!content || content.length > ASSISTANT_MAX_MESSAGE_LENGTH) {
    return null;
  }

  const createdAt =
    typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt))
      ? value.createdAt
      : new Date().toISOString();

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `assistant-${index}-${Date.now()}`,
    role: value.role,
    content,
    createdAt,
  };
}

export function loadAssistantHistory(): AssistantMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ASSISTANT_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeMessage)
      .filter((message): message is AssistantMessage => message !== null)
      .slice(-ASSISTANT_MAX_VISIBLE_MESSAGES);
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
      ASSISTANT_STORAGE_KEY,
      JSON.stringify(messages.slice(-ASSISTANT_MAX_VISIBLE_MESSAGES)),
    );
  } catch {
    // Local history is an enhancement; unavailable or full storage is safe to ignore.
  }
}

export function clearAssistantHistory() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(ASSISTANT_STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}

export function getRecentAssistantHistory(
  messages: AssistantMessage[],
): AssistantHistoryItem[] {
  return messages.slice(-ASSISTANT_MAX_HISTORY_ITEMS).map(({ role, content }) => ({
    role,
    content,
  }));
}
