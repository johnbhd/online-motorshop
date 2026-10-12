export type AssistantRole = "user" | "assistant";

export type AssistantReplyReference = {
  id: string;
  role: AssistantRole;
  content: string;
};

export const ASSISTANT_MAX_MESSAGE_LENGTH = 1000;

export const ASSISTANT_HISTORY_LIMIT = 6;

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  replyTo?: AssistantReplyReference | null;
};

export type AssistantHistoryItem = Pick<
  AssistantMessage,
  "role" | "content"
>;

export type AssistantChatRequest = {
  message: string;
  history: AssistantHistoryItem[];
  replyTo?: Pick<AssistantReplyReference, "role" | "content"> | null;
};

export type AssistantChatResponse = {
  message: string;
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
