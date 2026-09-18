import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type ChatSender = "bot" | "customer";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
};

export type ChatQuickAction = {
  id: string;
  label: string;
  query: string;
  icon: IconDefinition;
};

export type ChatbotResponse = {
  text: string;
};

export type StoredStaffConversation = {
  id: string;
  source: "chatbot";
  status: "waiting-for-staff";
  messages: ChatMessage[];
  createdAt: string;
};
