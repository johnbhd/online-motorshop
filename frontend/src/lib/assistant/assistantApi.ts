import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantErrorCode,
} from "./assistantTypes";
import { getAssistantSessionId } from "./assistantSessionStorage";
import { getAuthToken } from "@/lib/auth/authStorage";

const assistantUnavailableMessage =
  "I'm having trouble connecting right now. Please try again.";

export class AssistantRequestError extends Error {
  readonly status: number;
  readonly code: AssistantErrorCode | null;
  readonly retryAfter: number | null;

  constructor(
    message: string,
    status = 0,
    code: AssistantErrorCode | null = null,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "AssistantRequestError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function isResponse(value: unknown): value is AssistantChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string" &&
    value.message.trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssistantErrorCode(value: unknown): value is AssistantErrorCode {
  return (
    value === "assistant_unavailable" ||
    value === "assistant_busy" ||
    value === "assistant_rate_limited" ||
    value === "assistant_burst_limited" ||
    value === "duplicate_message" ||
    value === "assistant_invalid_request" ||
    value === "assistant_timeout"
  );
}

function getRetryAfter(value: unknown): number | null {
  const seconds = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return Math.min(120, Math.ceil(seconds));
}

function getErrorMessage(
  status: number,
  code: AssistantErrorCode | null,
  serverMessage: string | null,
) {
  if (code === "duplicate_message") {
    return "That message was already sent. Please wait a moment before sending it again.";
  }

  if (code === "assistant_rate_limited" || code === "assistant_burst_limited") {
    return "Too many messages were sent in a short period. Please wait a few seconds and try again.";
  }

  if (code === "assistant_daily_limit") {
    return "You've reached today's ALD Assistant message limit. You can still browse ALD products or contact ALD staff for help.";
  }

  if (code === "assistant_busy") {
    return "ALD Assistant is briefly busy. Please wait a few seconds and try again.";
  }

  if (code === "assistant_invalid_request" && serverMessage) {
    return serverMessage;
  }

  if (status === 429) {
    return "You’re sending messages a little too quickly. Please wait a moment and try again.";
  }

  if (status === 422) {
    return "Please check your message and try again.";
  }

  return assistantUnavailableMessage;
}

export async function sendAssistantMessage(
  request: AssistantChatRequest & { signal?: AbortSignal },
): Promise<string> {
  const { signal, ...payload } = request;
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  const token = getAuthToken();
  const assistantSessionId = getAssistantSessionId();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (assistantSessionId) {
    headers.set("X-Assistant-Session", assistantSessionId);
  }

  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  let body: unknown = null;

  try {
    body = (await response.json()) as unknown;
  } catch {
    // Normalize a non-JSON upstream response below.
  }

  if (!response.ok) {
    const errorPayload = isRecord(body) ? body : {};
    const code = isAssistantErrorCode(errorPayload.code)
      ? errorPayload.code
      : null;
    const retryAfter = getRetryAfter(
      errorPayload.retryAfter ?? response.headers.get("Retry-After"),
    );

    throw new AssistantRequestError(
      getErrorMessage(
        response.status,
        code,
        typeof errorPayload.message === "string"
          ? errorPayload.message
          : null,
      ),
      response.status,
      code,
      retryAfter,
    );
  }

  if (!isResponse(body)) {
    throw new AssistantRequestError(assistantUnavailableMessage, response.status);
  }

  return body.message.trim();
}
