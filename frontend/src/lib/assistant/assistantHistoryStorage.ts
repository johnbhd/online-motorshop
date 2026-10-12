import type {
  AssistantMessage,
  AssistantProductCard,
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

function normalizeProductCard(value: unknown): AssistantProductCard | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.href !== "string") {
    return null;
  }

  const name = value.name.trim();
  const href = value.href.trim();

  if (!name || name.length > 200 || !href.startsWith("/products/") || href.includes("//")) {
    return null;
  }

  const imageUrl = typeof value.imageUrl === "string" ? value.imageUrl.trim() : "";
  const priceValue = typeof value.price === "number" ||
    (typeof value.price === "string" && value.price.trim() !== "")
    ? Number(value.price)
    : NaN;

  return {
    name,
    productCode:
      typeof value.productCode === "string" && value.productCode.trim().length <= 100
        ? value.productCode.trim() || null
        : null,
    href,
    imageUrl: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null,
    price: Number.isFinite(priceValue) && priceValue >= 0 ? priceValue : null,
    brand:
      typeof value.brand === "string" && value.brand.trim().length <= 100
        ? value.brand.trim() || null
        : null,
    category:
      typeof value.category === "string" && value.category.trim().length <= 100
        ? value.category.trim() || null
        : null,
    description:
      typeof value.description === "string" && value.description.trim().length <= 500
        ? value.description.trim() || null
        : null,
  };
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

  const products = Array.isArray(value.products)
    ? value.products
        .map(normalizeProductCard)
        .filter((product): product is AssistantProductCard => product !== null)
        .slice(0, 5)
    : undefined;
  const totalValue = typeof value.totalMatches === "number" ||
    (typeof value.totalMatches === "string" && value.totalMatches.trim() !== "")
    ? Number(value.totalMatches)
    : NaN;

  return {
    id: value.id,
    role: value.role,
    content,
    createdAt: value.createdAt,
    replyTo: value.replyTo === undefined ? null : normalizeReplyReference(value.replyTo),
    ...(products !== undefined ? { products } : {}),
    ...(Number.isInteger(totalValue) && totalValue >= 0
      ? { totalMatches: totalValue }
      : {}),
    ...(typeof value.hasMore === "boolean" ? { hasMore: value.hasMore } : {}),
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
