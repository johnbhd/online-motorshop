import {
  chatbotBranchResponse,
  chatbotResponses,
} from "./chatbotData";
import type { ChatbotResponse } from "./chatbotTypes";

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

function matchesAny(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword));
}
