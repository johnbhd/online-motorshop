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
