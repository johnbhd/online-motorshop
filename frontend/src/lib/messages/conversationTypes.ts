export type ConversationParticipantType = "customer" | "guest";

export type ConversationMessageSender = "customer" | "staff";

export type ConversationParticipant = {
  id: number | null;
  name: string;
  email: string | null;
};

export type ConversationMessage = {
  id: number;
  sender: ConversationMessageSender;
  body: string;
  created_at: string;
};

export type Conversation = {
  id: number;
  participant_type: ConversationParticipantType;
  participant: ConversationParticipant;
  status: "open";
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type StaffConversationSummary = Omit<Conversation, "messages"> & {
  message_count: number;
  last_message: ConversationMessage | null;
};
