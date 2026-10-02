const GUEST_CONVERSATION_TOKEN_KEY = "ald_guest_conversation_token";

export function getGuestConversationToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(GUEST_CONVERSATION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setGuestConversationToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(GUEST_CONVERSATION_TOKEN_KEY, token);
  } catch {
    // Continue without local persistence if browser storage is unavailable.
  }
}
