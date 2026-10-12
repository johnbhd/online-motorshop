import type {
  AdminArchiveMutationResponse,
  AdminArchiveResponse,
  AdminArchiveType,
} from "./adminArchiveTypes";

type Query = {
  type?: AdminArchiveType | "";
  search?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export class AdminArchiveApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "AdminArchiveApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function getAdminArchive(
  token: string,
  query: Query = {},
): Promise<AdminArchiveResponse> {
  const params = new URLSearchParams();
  const values: Record<string, string | number | undefined> = {
    type: query.type,
    search: query.search,
    page: query.page,
    per_page: query.perPage,
  };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const response = await fetch(
    `/api/admin/archive${params.size ? `?${params.toString()}` : ""}`,
    { headers: authHeaders(token), cache: "no-store", signal: query.signal },
  );

  return parseResponse<AdminArchiveResponse>(response);
}

export async function archiveAdminRecord(
  token: string,
  type: AdminArchiveType,
  id: number,
): Promise<AdminArchiveMutationResponse> {
  const response = await fetch(`/api/admin/archive/${type}/${id}`, {
    method: "POST",
    headers: authHeaders(token),
  });

  return parseResponse<AdminArchiveMutationResponse>(response);
}

export async function restoreAdminRecord(
  token: string,
  type: AdminArchiveType,
  id: number,
): Promise<AdminArchiveMutationResponse> {
  const response = await fetch(`/api/admin/archive/${type}/${id}/restore`, {
    method: "POST",
    headers: authHeaders(token),
  });

  return parseResponse<AdminArchiveMutationResponse>(response);
}

export async function permanentlyDeleteAdminRecord(
  token: string,
  type: AdminArchiveType,
  id: number,
): Promise<AdminArchiveMutationResponse> {
  const response = await fetch(`/api/admin/archive/${type}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  return parseResponse<AdminArchiveMutationResponse>(response);
}

export function getAdminArchiveErrorMessage(error: unknown): string {
  if (error instanceof AdminArchiveApiError) {
    if (error.status === 401) return "Your Admin session has expired. Please sign in again.";
    if (error.status === 403) return "Only Admin users can manage archived records.";
    if (error.status >= 500) return "The Admin Archive service is unavailable. Please try again.";
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to complete the archive request.";
}

function authHeaders(token: string): HeadersInit {
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await readPayload(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Admin archive request failed with status ${response.status}.`;
    throw new AdminArchiveApiError(response.status, message, payload);
  }

  return payload as T;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
