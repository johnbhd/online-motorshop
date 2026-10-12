import type {
  AdminMediaAsset,
  AdminMediaDetailsResponse,
  AdminMediaMutationResponse,
  AdminMediaPurpose,
  AdminMediaResponse,
  AdminMediaStatus,
} from "./adminMediaTypes";

type Query = {
  search?: string;
  type?: AdminMediaPurpose | "";
  status?: AdminMediaStatus | "";
  sort?: "newest" | "oldest" | "status" | "type";
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export class AdminMediaApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "AdminMediaApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function getAdminMedia(
  token: string,
  query: Query = {},
): Promise<AdminMediaResponse> {
  const params = new URLSearchParams();
  const values: Record<string, string | number | undefined> = {
    search: query.search,
    type: query.type,
    status: query.status,
    sort: query.sort,
    page: query.page,
    per_page: query.perPage,
  };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  const response = await fetch(
    "/api/admin/media" + (queryString ? "?" + queryString : ""),
    {
      headers: authHeaders(token),
      cache: "no-store",
      signal: query.signal,
    },
  );

  return parseResponse<AdminMediaResponse>(response);
}

export async function getAdminMediaAsset(
  token: string,
  id: number,
  signal?: AbortSignal,
): Promise<AdminMediaAsset> {
  const response = await fetch("/api/admin/media/" + id, {
    headers: authHeaders(token),
    cache: "no-store",
    signal,
  });
  const payload = await parseResponse<AdminMediaDetailsResponse>(response);

  return payload.media;
}

export async function deleteAdminMediaAsset(
  token: string,
  id: number,
): Promise<AdminMediaMutationResponse> {
  const response = await fetch("/api/admin/media/" + id, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  return parseResponse<AdminMediaMutationResponse>(response);
}

export async function retryAdminMediaCleanup(
  token: string,
  id: number,
): Promise<AdminMediaMutationResponse> {
  const response = await fetch(
    "/api/admin/media/" + id + "/retry-cleanup",
    {
      method: "POST",
      headers: authHeaders(token),
    },
  );

  return parseResponse<AdminMediaMutationResponse>(response);
}

export function getAdminMediaErrorMessage(error: unknown): string {
  if (error instanceof AdminMediaApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "Only Admin users can manage media assets.";
    }

    if (error.status >= 500) {
      return "The Admin Media service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to complete the media request.";
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: "Bearer " + token,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await readPayload(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Admin media request failed with status " + response.status + ".";

    throw new AdminMediaApiError(response.status, message, payload);
  }

  return payload as T;
}

async function readPayload(response: Response): Promise<unknown> {
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
