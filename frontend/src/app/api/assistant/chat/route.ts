import { NextRequest, NextResponse } from "next/server";
import {
  ASSISTANT_HISTORY_LIMIT,
  ASSISTANT_MAX_MESSAGE_LENGTH,
} from "@/lib/assistant/assistantTypes";

const REQUEST_TIMEOUT_MS = 35_000;

const unavailableMessage = "I’m having trouble connecting right now. Please try again.";
const timeoutMessage =
  "The assistant is taking a little longer than usual. Please try again.";

const assistantSessionPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assistantErrorCodes = new Set([
  "assistant_unavailable",
  "assistant_busy",
  "assistant_rate_limited",
  "assistant_burst_limited",
  "assistant_daily_limit",
  "duplicate_message",
  "assistant_invalid_request",
  "assistant_timeout",
]);

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssistantRole(value: unknown): value is "user" | "assistant" {
  return value === "user" || value === "assistant";
}

function jsonError(
  message: string,
  status: number,
  code: string,
  retryAfter?: number | null,
) {
  const headers = new Headers({ "Cache-Control": "no-store" });

  if (retryAfter) {
    headers.set("Retry-After", String(retryAfter));
  }

  return NextResponse.json(
    {
      message,
      code,
      ...(retryAfter ? { retryAfter } : {}),
    },
    {
      status,
      headers,
    },
  );
}

function getRetryAfter(value: unknown): number | null {
  const seconds = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return Math.min(120, Math.ceil(seconds));
}

function getValidAssistantSession(request: NextRequest): string | null {
  const value = request.headers.get("x-assistant-session")?.trim() ?? "";

  return assistantSessionPattern.test(value) ? value : null;
}

function getForwardableAuthorization(request: NextRequest): string | null {
  const value = request.headers.get("authorization")?.trim() ?? "";

  return /^Bearer\s+\S+$/i.test(value) ? value : null;
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

  if (!message) {
    return { error: "Please enter a message." } as const;
  }

  if (message.length > ASSISTANT_MAX_MESSAGE_LENGTH) {
    return {
      error: "Your message is too long. Please keep it under 1,000 characters.",
    } as const;
  }

  if (body.history !== undefined && !Array.isArray(body.history)) {
    return { error: "Please send a valid assistant history." } as const;
  }

  const history = (body.history ?? []) as unknown[];

  if (history.length > ASSISTANT_HISTORY_LIMIT) {
    return { error: "Please send a shorter assistant history." } as const;
  }

  const normalizedHistory = [];

  for (const item of history) {
    if (!isRecord(item) || !isAssistantRole(item.role) || typeof item.content !== "string") {
      return { error: "Please send a valid assistant history." } as const;
    }

    const content = item.content.trim();

    if (!content || content.length > ASSISTANT_MAX_MESSAGE_LENGTH) {
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

function getUpstreamError(
  status: number,
  body: unknown,
  retryAfterHeader: string | null,
) {
  const payload = isRecord(body) ? body : {};
  const code = assistantErrorCodes.has(String(payload.code))
    ? String(payload.code)
    : null;
  const retryAfter = getRetryAfter(
    payload.retryAfter ?? retryAfterHeader,
  );

  if (status === 429 && code !== null) {
    if (code === "assistant_daily_limit") {
      return {
        message:
          "You've reached today's ALD Assistant message limit. You can still browse ALD products or contact ALD staff for help.",
        code,
        status,
        retryAfter: null,
      };
    }

    if (code === "duplicate_message") {
      return {
        message:
          "That message was already sent. Please wait a moment before sending it again.",
        code,
        status,
        retryAfter,
      };
    }

    if (code === "assistant_busy") {
      return {
        message:
          "ALD Assistant is briefly busy. Please wait a few seconds and try again.",
        code,
        status,
        retryAfter,
      };
    }

    return {
      message:
        "Too many messages were sent in a short period. Please wait a few seconds and try again.",
      code:
        code === "assistant_burst_limited" || code === "assistant_rate_limited"
          ? code
          : "assistant_rate_limited",
      status,
      retryAfter,
    };
  }

  if (status === 429 && code === null) {
    return {
      message:
        "You’re sending messages a little too quickly. Please wait a moment and try again.",
      status: 429,
      code: "assistant_rate_limited",
      retryAfter,
    };
  }

  if (status === 422) {
    return {
      message: "Please check your message and try again.",
      code: "assistant_invalid_request",
      status: 422,
      retryAfter: null,
    };
  }

  return {
    message: unavailableMessage,
    code: status === 504 ? "assistant_timeout" : "assistant_unavailable",
    status: status === 504 ? 504 : 503,
    retryAfter: null,
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(
      "Please send a valid assistant message.",
      400,
      "assistant_invalid_request",
    );
  }

  const parsed = parseRequestBody(body);

  if (!("value" in parsed)) {
    return jsonError(parsed.error, 422, "assistant_invalid_request");
  }

  const baseUrl = getLaravelApiUrl();

  if (!baseUrl) {
    return jsonError(unavailableMessage, 503, "assistant_unavailable");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamHeaders = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    const authorization = getForwardableAuthorization(request);
    const assistantSession = getValidAssistantSession(request);

    if (authorization) {
      upstreamHeaders.set("Authorization", authorization);
    }

    if (assistantSession) {
      upstreamHeaders.set("X-Assistant-Session", assistantSession);
    }

    const response = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(parsed.value),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      let upstreamBody: unknown = null;

      try {
        upstreamBody = await response.json();
      } catch {
        // Normalize non-JSON upstream failures below.
      }

      const upstreamError = getUpstreamError(
        response.status,
        upstreamBody,
        response.headers.get("Retry-After"),
      );

      return jsonError(
        upstreamError.message,
        upstreamError.status,
        upstreamError.code,
        upstreamError.retryAfter,
      );
    }

    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      return jsonError(unavailableMessage, 503, "assistant_unavailable");
    }

    if (!isRecord(responseBody) || typeof responseBody.message !== "string") {
      return jsonError(unavailableMessage, 503, "assistant_unavailable");
    }

    const message = responseBody.message.trim();

    if (!message) {
      return jsonError(unavailableMessage, 503, "assistant_unavailable");
    }

    return NextResponse.json(
      { message },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    if (controller.signal.aborted) {
      return jsonError(timeoutMessage, 504, "assistant_timeout");
    }

    return jsonError(unavailableMessage, 503, "assistant_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}
