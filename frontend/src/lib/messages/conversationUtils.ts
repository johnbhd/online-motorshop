import type {
  ConversationMessage,
  DemoConversation,
} from "./conversationTypes";

export function sortConversationsByRecent(
  conversations: DemoConversation[],
): DemoConversation[] {
  return [...conversations].sort((firstConversation, secondConversation) => {
    return (
      new Date(secondConversation.updatedAt).getTime() -
      new Date(firstConversation.updatedAt).getTime()
    );
  });
}

export function getLastConversationMessage(
  conversation: DemoConversation,
): ConversationMessage | null {
  return conversation.messages.at(-1) ?? null;
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
