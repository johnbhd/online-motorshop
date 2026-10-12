export type AssistantRole = "user" | "assistant";

export type AssistantReplyReference = {
  id: string;
  role: AssistantRole;
  content: string;
};

export const ASSISTANT_MAX_MESSAGE_LENGTH = 1000;

export const ASSISTANT_HISTORY_LIMIT = 6;

export type AssistantProductCard = {
  name: string;
  productCode: string | null;
  href: string;
  imageUrl: string | null;
  price: number | null;
  brand: string | null;
  category: string | null;
  description: string | null;
};

export type AssistantProductContext = {
  name: string;
  productCode: string | null;
  price: number | null;
  brand: string | null;
  category: string | null;
};

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  replyTo?: AssistantReplyReference | null;
  products?: AssistantProductCard[];
  totalMatches?: number | null;
  hasMore?: boolean;
};

export type AssistantHistoryItem = Pick<AssistantMessage, "role" | "content"> & {
  productContext?: AssistantProductContext[];
};

export type AssistantChatRequest = {
  message: string;
  history: AssistantHistoryItem[];
  replyTo?: Pick<AssistantReplyReference, "role" | "content"> | null;
};

export type AssistantChatResponse = {
  message: string;
  products?: AssistantProductCard[];
  totalMatches?: number | null;
  hasMore?: boolean;
};

export type AssistantErrorCode =
  | "assistant_unavailable"
  | "assistant_busy"
  | "assistant_rate_limited"
  | "assistant_burst_limited"
  | "assistant_daily_limit"
  | "duplicate_message"
  | "assistant_invalid_request"
  | "assistant_timeout";
