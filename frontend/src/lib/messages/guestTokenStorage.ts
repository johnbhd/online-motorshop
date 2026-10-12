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

export function getOrCreateGuestConversationToken(): string {
  const existingToken = getGuestConversationToken();

  if (existingToken) {
    return existingToken;
  }

  let token = "";

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } else {
    token = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.padEnd(64, "0").slice(0, 64);
  }

  setGuestConversationToken(token);

  return token;
}
