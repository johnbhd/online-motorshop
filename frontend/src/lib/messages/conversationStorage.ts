import type { AuthUser } from "@/lib/auth/authTypes";
import type { ConversationMessageSender, ConversationParticipantType } from "./conversationTypes";

// Legacy storage parser kept only so existing browser data can be ignored safely.
// Human conversations are now read and written through the Laravel API.
type ConversationParticipant = {
  id: string;
  name: string;
  type: ConversationParticipantType;
  email?: string;
};

type ConversationMessage = {
  id: string;
  sender: ConversationMessageSender;
  text: string;
  createdAt: string;
};

type DemoConversation = {
  id: string;
  participantId: string;
  participantName: string;
  participantType: ConversationParticipantType;
  participantEmail?: string;
  status: "open";
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
};

export const CONVERSATIONS_STORAGE_KEY = "ald_conversations";
export const CONVERSATIONS_UPDATED_EVENT = "ald-conversations-updated";

let messageSequence = 0;

function isBrowser() {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.sender === "customer" || value.sender === "staff") &&
    typeof value.text === "string" &&
    typeof value.createdAt === "string"
  );
}

function isDemoConversation(value: unknown): value is DemoConversation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.participantId === "string" &&
    typeof value.participantName === "string" &&
    (value.participantType === "customer" ||
      value.participantType === "guest") &&
    (!("participantEmail" in value) ||
      typeof value.participantEmail === "string") &&
    value.status === "open" &&
    Array.isArray(value.messages) &&
    value.messages.every(isConversationMessage) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function notifyConversationUpdate() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(CONVERSATIONS_UPDATED_EVENT));
}

function saveConversations(conversations: DemoConversation[]) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      CONVERSATIONS_STORAGE_KEY,
      JSON.stringify(conversations),
    );
    notifyConversationUpdate();
  } catch {
    // Ignore unavailable or quota-exceeded browser storage in the demo.
  }
}

// TEMPORARY FRONTEND MESSAGING DEMO.
// Conversations are stored in localStorage for presentation only.
// Replace with Laravel/API/realtime messaging persistence later.
export function getConversations(): DemoConversation[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(
      CONVERSATIONS_STORAGE_KEY,
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isDemoConversation)
      : [];
  } catch {
    return [];
  }
}

export function getConversationById(
  conversationId: string,
): DemoConversation | null {
  return (
    getConversations().find((conversation) => {
      return conversation.id === conversationId;
    }) ?? null
  );
}

export function getConversationByParticipant(
  participantId: string,
  participantType?: ConversationParticipantType,
): DemoConversation | null {
  return (
    getConversations().find((conversation) => {
      return (
        conversation.participantId === participantId &&
        (!participantType || conversation.participantType === participantType)
      );
    }) ?? null
  );
}

export function getCurrentConversationParticipant(
  user: AuthUser | null,
): ConversationParticipant {
  if (user?.role === "customer") {
    return {
      id: String(user.id),
      name: user.name,
      type: "customer",
      email: user.email,
    };
  }

  return {
    id: "guest",
    name: "Guest",
    type: "guest",
  };
}

export function getOrCreateConversation(
  participant: ConversationParticipant,
): DemoConversation {
  const existingConversation = getConversationByParticipant(participant.id, participant.type);

  if (existingConversation) {
    return existingConversation;
  }

  const now = new Date().toISOString();
  const conversation: DemoConversation = {
    id: `conversation-${participant.type}-${participant.id}`,
    participantId: participant.id,
    participantName: participant.name,
    participantType: participant.type,
    ...(participant.email ? { participantEmail: participant.email } : {}),
    status: "open",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  saveConversations([...getConversations(), conversation]);

  return conversation;
}

export function appendConversationMessage(
  conversationId: string,
  sender: ConversationMessageSender,
  text: string,
): DemoConversation | null {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return getConversationById(conversationId);
  }

  const conversations = getConversations();
  let updatedConversation: DemoConversation | null = null;

  const nextConversations = conversations.map((conversation) => {
    if (conversation.id !== conversationId) {
      return conversation;
    }

    const now = new Date().toISOString();
    const message: ConversationMessage = {
      id: createMessageId(),
      sender,
      text: normalizedText,
      createdAt: now,
    };

    updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, message],
      updatedAt: now,
    };

    return updatedConversation;
  });

  if (!updatedConversation) {
    return null;
  }

  saveConversations(nextConversations);

  return updatedConversation;
}

function createMessageId() {
  messageSequence += 1;

  return `message-${Date.now()}-${messageSequence}`;
}
