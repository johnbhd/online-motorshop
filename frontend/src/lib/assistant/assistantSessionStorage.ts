const ASSISTANT_SESSION_STORAGE_KEY = "ald_assistant_session_id";

const assistantSessionPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isBrowser() {
  return typeof window !== "undefined";
}

function isAssistantSessionId(value: string | null): value is string {
  return value !== null && assistantSessionPattern.test(value);
}

function createAssistantSessionId(): string | null {
  if (!isBrowser() || typeof window.crypto?.getRandomValues !== "function") {
    return null;
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

export function getAssistantSessionId(): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(ASSISTANT_SESSION_STORAGE_KEY);

    if (isAssistantSessionId(stored)) {
      return stored;
    }

    const created = createAssistantSessionId();

    if (!created) {
      return null;
    }

    window.localStorage.setItem(ASSISTANT_SESSION_STORAGE_KEY, created);

    return created;
  } catch {
    return null;
  }
}
