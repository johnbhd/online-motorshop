import {
  chatbotBranchResponse,
  chatbotResponses,
} from "./chatbotData";
import type {
  ChatbotResponse,
  ChatMessage,
  StoredStaffConversation,
} from "./chatbotTypes";

const staffConversationStorageKey = "ald_conversations";

// TEMPORARY FRONTEND CHATBOT DEMO.
// Replace deterministic responses with the real messaging/chatbot backend later.
export function resolveChatbotResponse(message: string): ChatbotResponse {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return { text: chatbotResponses.fallback };
  }

  if (matchesAny(normalizedMessage, ["price", "pricing", "cost", "how much"])) {
    return { text: chatbotResponses.price };
  }

  if (
    matchesAny(normalizedMessage, [
      "availability",
      "available",
      "in stock",
      "stock",
    ])
  ) {
    return { text: chatbotResponses.availability };
  }

  if (
    matchesAny(normalizedMessage, [
      "compatib",
      "compatible",
      "fit my",
      "will it fit",
      "fits my",
    ])
  ) {
    return { text: chatbotResponses.compatibility };
  }

  if (
    matchesAny(normalizedMessage, [
      "track",
      "tracking",
      "order status",
      "where is my order",
    ])
  ) {
    return { text: chatbotResponses.tracking };
  }

  if (
    matchesAny(normalizedMessage, [
      "lalamove",
      "delivery",
      "deliver",
    ])
  ) {
    return { text: chatbotResponses.delivery };
  }

  if (
    matchesAny(normalizedMessage, [
      "pickup",
      "pick up",
      "store pickup",
    ])
  ) {
    return { text: chatbotResponses.pickup };
  }

  if (
    matchesAny(normalizedMessage, [
      "branch",
      "branches",
      "location",
      "store location",
    ])
  ) {
    return { text: chatbotBranchResponse };
  }

  if (
    matchesAny(normalizedMessage, [
      "order",
      "ordering",
      "buy",
      "purchase",
    ])
  ) {
    return { text: chatbotResponses.ordering };
  }

  return { text: chatbotResponses.fallback };
}

export function saveStaffAssistanceRequest(messages: ChatMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  const request: StoredStaffConversation = {
    id: `chatbot-${Date.now()}`,
    source: "chatbot",
    status: "waiting-for-staff",
    messages,
    createdAt: new Date().toISOString(),
  };

  let existingConversations: StoredStaffConversation[] = [];

  try {
    const storedValue = window.localStorage.getItem(staffConversationStorageKey);

    if (storedValue) {
      const parsedValue: unknown = JSON.parse(storedValue);

      if (Array.isArray(parsedValue)) {
        existingConversations = parsedValue.filter(isStoredStaffConversation);
      }
    }

    window.localStorage.setItem(
      staffConversationStorageKey,
      JSON.stringify([...existingConversations, request]),
    );
  } catch {
    // Browser storage can be unavailable or contain malformed demo data.
  }
}

function matchesAny(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword));
}

function isStoredStaffConversation(
  value: unknown,
): value is StoredStaffConversation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredStaffConversation>;

  return (
    typeof candidate.id === "string" &&
    candidate.source === "chatbot" &&
    candidate.status === "waiting-for-staff" &&
    Array.isArray(candidate.messages) &&
    typeof candidate.createdAt === "string"
  );
}
