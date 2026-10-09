export type ApiErrorKind =
  | 'configuration'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'http';

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;
  readonly kind: ApiErrorKind;

  constructor(
    message: string,
    options: {
      status?: number;
      payload?: unknown;
      kind?: ApiErrorKind;
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.payload = options.payload;
    this.kind = options.kind ?? 'http';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getApiBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!baseUrl) {
    throw new ApiError('The mobile API URL is not configured.', {
      kind: 'configuration',
    });
  }

  return baseUrl.replace(/\/+$/, '');
}

function getApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getHttpErrorMessage(payload: unknown, status: number) {
  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message;
  }

  return `The API request failed with status ${status}.`;
}

export type ApiRequestOptions = RequestInit & {
  token?: string;
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    token,
    timeoutMs = 15000,
    signal: requestSignal,
    headers,
    ...requestOptions
  } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set('Accept', 'application/json');

  if (
    requestOptions.body &&
    !(typeof FormData !== 'undefined' && requestOptions.body instanceof FormData)
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  let timedOut = false;
  let removeAbortListener: (() => void) | undefined;

  if (requestSignal) {
    if (requestSignal.aborted) {
      controller.abort();
    } else {
      const handleAbort = () => controller.abort();

      requestSignal.addEventListener('abort', handleAbort, { once: true });
      removeAbortListener = () =>
        requestSignal.removeEventListener('abort', handleAbort);
    }
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response: Response;

  try {
    response = await fetch(getApiUrl(path), {
      ...requestOptions,
      headers: requestHeaders,
      signal: controller.signal,
    });
  } catch (error) {
    if (requestSignal?.aborted) {
      throw new ApiError('The API request was cancelled.', {
        kind: 'cancelled',
      });
    }

    if (timedOut) {
      throw new ApiError('The API request timed out.', {
        kind: 'timeout',
      });
    }

    throw new ApiError('The mobile API could not be reached.', {
      kind: 'network',
      payload: error,
    });
  } finally {
    clearTimeout(timeout);
    removeAbortListener?.();
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiError(getHttpErrorMessage(payload, response.status), {
      status: response.status,
      payload,
      kind: 'http',
    });
  }

  return payload as T;
}

export function getApiValidationErrors(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload.errors).filter(([, messages]) => {
      return (
        Array.isArray(messages) &&
        messages.every((message) => typeof message === 'string')
      );
    }),
  ) as Record<string, string[]>;
}
