export type AssistantRole = "user" | "assistant";

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
  | "duplicate_message"
  | "assistant_invalid_request"
  | "assistant_timeout";
