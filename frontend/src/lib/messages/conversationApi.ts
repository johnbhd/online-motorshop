import { getAuthToken } from "@/lib/auth/authStorage";
import type {
  AdminConversationSummary,
  ContactInquiryMetadata,
  Conversation,
  ProductInquiryMetadata,
  StaffConversationSummary,
} from "./conversationTypes";

type CustomerConversationMessageOptions = {
  messageType?: "text" | "contact_inquiry" | "product_inquiry";
  metadata?: ContactInquiryMetadata | ProductInquiryMetadata;
  productId?: number;
  attachment?: File | null;
};

type ConversationResponse = {
  conversation: Conversation;
};
type StartConversationResponse = ConversationResponse & {
  guest_token?: string;
};
type StaffConversationsResponse = {
  summary: {
    total: number;
    open: number;
    needs_reply: number;
  };
  conversations: StaffConversationSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminConversationsResponse = {
  summary: {
    total: number;
    open: number;
    needs_reply: number;
  };
  conversations: AdminConversationSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export class ConversationApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ConversationApiError";
    this.status = status;
    this.payload = payload;
  }
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

function messageFromPayload(payload: unknown, status: number) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return `Conversation request failed with status ${status}.`;
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    guestToken?: string | null;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (options.guestToken) {
    headers.set("X-Guest-Token", options.guestToken);
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const requestBody: BodyInit | undefined =
    options.body === undefined
      ? undefined
      : isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body);

  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: requestBody,
    cache: "no-store",
    signal: options.signal,
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ConversationApiError(
      response.status,
      messageFromPayload(payload, response.status),
      payload,
    );
  }

  return payload as T;
}

function notifyStaffSidebar() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("staff-data-updated"));
  }
}

export async function getCurrentConversation(
  token: string | null,
  guestToken: string | null,
): Promise<Conversation | null> {
  try {
    const response = await request<ConversationResponse>(
      "/api/conversations/current",
      { token, guestToken },
    );

    return response.conversation;
  } catch (error) {
    if (error instanceof ConversationApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function startConversation(
  body: string,
  guestToken: string | null,
  options: CustomerConversationMessageOptions = {},
) {
  const requestBody =
    options.messageType === "contact_inquiry" ||
    options.messageType === "product_inquiry" ||
    options.metadata ||
    options.productId ||
    options.attachment
      ? createCustomerMessageFormData(body, guestToken, options)
      : { body, ...(guestToken ? { guest_token: guestToken } : {}) };
  const response = await request<StartConversationResponse>(
    "/api/conversations",
    {
      method: "POST",
      token: getAuthToken(),
      body: requestBody,
    },
  );

  notifyStaffSidebar();
  return response;
}

export async function sendCustomerConversationMessage(
  conversationId: number,
  body: string,
  guestToken: string | null,
  options: CustomerConversationMessageOptions = {},
) {
  const requestBody =
    options.messageType === "contact_inquiry" ||
    options.messageType === "product_inquiry" ||
    options.metadata ||
    options.productId ||
    options.attachment
      ? createCustomerMessageFormData(body, guestToken, options)
      : { body, ...(guestToken ? { guest_token: guestToken } : {}) };
  const response = await request<ConversationResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      token: getAuthToken(),
      body: requestBody,
    },
  );

  notifyStaffSidebar();
  return response.conversation;
}

function createCustomerMessageFormData(
  body: string,
  guestToken: string | null,
  options: CustomerConversationMessageOptions,
): FormData {
  const formData = new FormData();
  formData.set("body", body);

  if (guestToken) {
    formData.set("guest_token", guestToken);
  }

  if (options.messageType) {
    formData.set("message_type", options.messageType);
  }

  if (typeof options.productId === "number") {
    formData.set("product_id", String(options.productId));
  }

  if (options.metadata) {
    formData.set("metadata", JSON.stringify(options.metadata));
  }

  if (options.attachment) {
    formData.set("attachment", options.attachment, options.attachment.name);
  }

  return formData;
}

export async function getStaffConversations(
  token: string,
  options: {
    search?: string;
    status?: string;
    page?: number;
    perPage?: number;
  } = {},
) {
  const params = new URLSearchParams();

  if (options.search) {
    params.set("search", options.search);
  }
  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }

  if (options.page) {
    params.set("page", String(options.page));
  }

  if (options.perPage) {
    params.set("per_page", String(options.perPage));
  }

  const query = params.toString();
  return request<StaffConversationsResponse>(
    `/api/staff/conversations${query ? `?${query}` : ""}`,
    { token },
  );
}

export async function getAdminConversations(
  token: string,
  options: {
    search?: string;
    needsReply?: boolean;
    page?: number;
    perPage?: number;
    signal?: AbortSignal;
  } = {},
): Promise<AdminConversationsResponse> {
  const params = new URLSearchParams();

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.needsReply) {
    params.set("needs_reply", "1");
  }

  if (options.page) {
    params.set("page", String(options.page));
  }

  if (options.perPage) {
    params.set("per_page", String(options.perPage));
  }

  const query = params.toString();

  return request<AdminConversationsResponse>(
    `/api/admin/conversations${query ? `?${query}` : ""}`,
    { token, signal: options.signal },
  );
}

export async function getAdminConversation(
  token: string,
  conversationId: number,
  signal?: AbortSignal,
): Promise<Conversation> {
  const response = await request<ConversationResponse>(
    `/api/admin/conversations/${conversationId}`,
    { token, signal },
  );

  return response.conversation;
}

export async function sendAdminConversationMessage(
  token: string,
  conversationId: number,
  body: string,
): Promise<Conversation> {
  const response = await request<ConversationResponse>(
    `/api/admin/conversations/${conversationId}/messages`,
    { method: "POST", token, body: { body } },
  );

  notifyStaffSidebar();
  return response.conversation;
}

export async function getStaffConversation(
  token: string,
  conversationId: number,
) {
  const response = await request<ConversationResponse>(
    `/api/staff/conversations/${conversationId}`,
    { token },
  );

  return response.conversation;
}

export async function sendStaffConversationMessage(
  token: string,
  conversationId: number,
  body: string,
) {
  const response = await request<ConversationResponse>(
    `/api/staff/conversations/${conversationId}/messages`,
    { method: "POST", token, body: { body } },
  );

  notifyStaffSidebar();
  return response.conversation;
}
