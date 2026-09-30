export type ConversationParticipantType = "customer" | "guest";

export type ConversationMessageSender = "customer" | "staff";

export type ConversationParticipant = {
  id: string;
  name: string;
  type: ConversationParticipantType;
  email?: string;
};

export type ConversationMessage = {
  id: string;
  sender: ConversationMessageSender;
  text: string;
  createdAt: string;
};

export type DemoConversation = {
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
