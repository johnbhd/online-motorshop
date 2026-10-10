import { assistantUnavailableMessage } from "./assistantConstants";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
} from "./assistantTypes";

export class AssistantRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "AssistantRequestError";
    this.status = status;
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

function getErrorMessage(status: number) {
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
  let response: Response;

  try {
    response = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    throw error;
  }

  let body: unknown = null;

  try {
    body = (await response.json()) as unknown;
  } catch {
    // Normalize a non-JSON upstream response below.
  }

  if (!response.ok) {
    throw new AssistantRequestError(getErrorMessage(response.status), response.status);
  }

  if (!isResponse(body)) {
    throw new AssistantRequestError(assistantUnavailableMessage, response.status);
  }

  return body.message.trim();
}
