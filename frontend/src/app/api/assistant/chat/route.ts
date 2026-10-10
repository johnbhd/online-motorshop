import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 10;
const REQUEST_TIMEOUT_MS = 35_000;

const unavailableMessage = "I’m having trouble connecting right now. Please try again.";
const timeoutMessage =
  "The assistant is taking a little longer than usual. Please try again.";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssistantRole(value: unknown): value is "user" | "assistant" {
  return value === "user" || value === "assistant";
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function parseRequestBody(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Please send a valid assistant message." } as const;
  }

  const allowedKeys = new Set(["message", "history"]);

  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    return { error: "Please send a valid assistant message." } as const;
  }

  if (typeof body.message !== "string") {
    return { error: "Please enter a message." } as const;
  }

  const message = body.message.trim();

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return { error: "Please enter a message up to 2000 characters." } as const;
  }

  if (body.history !== undefined && !Array.isArray(body.history)) {
    return { error: "Please send a valid assistant history." } as const;
  }

  const history = (body.history ?? []) as unknown[];

  if (history.length > MAX_HISTORY_ITEMS) {
    return { error: "Please send a shorter assistant history." } as const;
  }

  const normalizedHistory = [];

  for (const item of history) {
    if (!isRecord(item) || !isAssistantRole(item.role) || typeof item.content !== "string") {
      return { error: "Please send a valid assistant history." } as const;
    }

    const content = item.content.trim();

    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return { error: "Please send a valid assistant history." } as const;
    }

    normalizedHistory.push({ role: item.role, content });
  }

  return { value: { message, history: normalizedHistory } } as const;
}

function getLaravelApiUrl() {
  const baseUrl = process.env.LARAVEL_API_URL?.trim();

  return baseUrl ? baseUrl.replace(/\/$/, "") : null;
}

function getUpstreamError(status: number) {
  if (status === 429) {
    return {
      message:
        "You’re sending messages a little too quickly. Please wait a moment and try again.",
      status: 429,
    };
  }

  if (status === 422) {
    return { message: "Please check your message and try again.", status: 422 };
  }

  return { message: unavailableMessage, status: 503 };
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Please send a valid assistant message.", 400);
  }

  const parsed = parseRequestBody(body);

  if (!("value" in parsed)) {
    return jsonError(parsed.error, 422);
  }

  const baseUrl = getLaravelApiUrl();

  if (!baseUrl) {
    return jsonError(unavailableMessage, 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.value),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const upstreamError = getUpstreamError(response.status);

      return jsonError(upstreamError.message, upstreamError.status);
    }

    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      return jsonError(unavailableMessage, 503);
    }

    if (!isRecord(responseBody) || typeof responseBody.message !== "string") {
      return jsonError(unavailableMessage, 503);
    }

    const message = responseBody.message.trim();

    if (!message) {
      return jsonError(unavailableMessage, 503);
    }

    return NextResponse.json(
      { message },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    if (controller.signal.aborted) {
      return jsonError(timeoutMessage, 504);
    }

    return jsonError(unavailableMessage, 503);
  } finally {
    clearTimeout(timeout);
  }
}
