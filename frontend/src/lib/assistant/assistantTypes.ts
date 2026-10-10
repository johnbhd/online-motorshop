export type AssistantRole = "user" | "assistant";

export const ASSISTANT_MAX_MESSAGE_LENGTH = 1000;

export const ASSISTANT_HISTORY_LIMIT = 6;

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
};

export type AssistantHistoryItem = Pick<
  AssistantMessage,
  "role" | "content"
>;

export type AssistantChatRequest = {
  message: string;
  history: AssistantHistoryItem[];
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
