import type {
  Conversation,
  ConversationMessage,
  StaffConversationSummary,
} from "./conversationTypes";

type ConversationListItem = Conversation | StaffConversationSummary;

export function sortConversationsByRecent(
  conversations: ConversationListItem[],
): ConversationListItem[] {
  return [...conversations].sort((firstConversation, secondConversation) => {
    return (
      new Date(
        secondConversation.last_message_at ?? secondConversation.updated_at,
      ).getTime() -
      new Date(
        firstConversation.last_message_at ?? firstConversation.updated_at,
      ).getTime()
    );
  });
}

export function getLastConversationMessage(
  conversation: ConversationListItem,
): ConversationMessage | null {
  return ("messages" in conversation
    ? conversation.messages.at(-1)
    : conversation.last_message) ?? null;
}

export function formatConversationTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getConversationInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "G";
}
