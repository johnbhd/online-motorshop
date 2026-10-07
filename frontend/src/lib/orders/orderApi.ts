export type OrderApiBranch = {
  id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
};

export type OrderApiSummary = {
  id: number;
  reference: string;
  status: string;
  payment_status: string;
  payment: OrderApiPayment | null;
  fulfillment_method: string;
  branch: OrderApiBranch | null;
  item_count: number;
  line_item_count: number;
  subtotal: number;
  delivery_fee: number;
  estimated_total: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type OrderApiCustomer = {
  id: number;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  address: string | null;
};

export type OrderApiItem = {
  product_id: number;
  part_number: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderApiPickup = {
  branch_id: number | null;
  status: string;
  pickup_date: string | null;
  pickup_time: string | null;
  remarks: string | null;
  completed_at: string | null;
};

export type OrderApiDelivery = {
  branch_id: number | null;
  address: string | null;
  fee: number | null;
  status: string;
  booking_reference: string | null;
  tracking_url: string | null;
  rider_name: string | null;
  rider_contact: string | null;
  remarks: string | null;
  delivered_at: string | null;
};

export type OrderApiPayment = {
  id: number;
  method: string;
  amount: number | null;
  reference: string | null;
  proof_image_url: string | null;
  status: string;
  verified_at: string | null;
};

export type OrderApiDetails = OrderApiSummary & {
  customer?: OrderApiCustomer | null;
  items: OrderApiItem[];
  customer_notes: string | null;
  payment: OrderApiPayment | null;
  pickup?: OrderApiPickup | null;
  delivery?: OrderApiDelivery | null;
};

export type OrderApiPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CustomerOrdersApiResponse = {
  orders: OrderApiSummary[];
  meta: OrderApiPagination;
};

export type OrderDetailsApiResponse = {
  order: OrderApiDetails;
};

export type CustomerPaymentProofApiResponse = OrderDetailsApiResponse & {
  message: string;
};

export type TrackOrderApiResponse = {
  order: OrderApiDetails;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class OrderApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "OrderApiError";
    this.status = status;
    this.payload = payload;
  }
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

async function requestOrderApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(path, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new OrderApiError(
      502,
      "The Laravel order service could not be reached.",
      error,
    );
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Order request failed with status ${response.status}.`;

    throw new OrderApiError(response.status, message, payload);
  }

  return payload as T;
}

export async function getCustomerOrders(
  token: string,
  options: {
    scope: "active" | "history";
    page: number;
    perPage: number;
    signal?: AbortSignal;
  },
): Promise<CustomerOrdersApiResponse> {
  const query = new URLSearchParams();

  query.set("scope", options.scope);
  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestOrderApi<CustomerOrdersApiResponse>(
    `/api/customer/orders?${query.toString()}`,
    {
      method: "GET",
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function getCustomerOrder(
  token: string,
  reference: string,
  signal?: AbortSignal,
): Promise<OrderDetailsApiResponse> {
  return requestOrderApi<OrderDetailsApiResponse>(
    `/api/customer/orders/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function submitPaymentProof(
  token: string,
  reference: string,
  file: File,
  signal?: AbortSignal,
): Promise<CustomerPaymentProofApiResponse> {
  const formData = new FormData();
  formData.append("proof", file);

  return requestOrderApi<CustomerPaymentProofApiResponse>(
    `/api/customer/orders/${encodeURIComponent(reference)}/payment-proof`,
    {
      method: "POST",
      signal,
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function trackOrder(
  reference: string,
  contactNumber: string,
  signal?: AbortSignal,
): Promise<TrackOrderApiResponse> {
  return requestOrderApi<TrackOrderApiResponse>("/api/order-requests/track", {
    method: "POST",
    signal,
    body: JSON.stringify({
      order_reference: reference,
      contact_number: contactNumber,
    }),
  });
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}

export function getOrderApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof OrderApiError) {
    if (error.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view these orders.";
    }

    if (error.status === 422 && isApiErrorPayload(error.payload)) {
      const validationErrors = error.payload.errors;

      if (typeof validationErrors === "object" && validationErrors !== null) {
        const firstError = Object.values(validationErrors).flat()[0];

        if (typeof firstError === "string") {
          return firstError;
        }
      }
    }

    if (error.status >= 500 || error.status === 0) {
      return "The order service is unavailable. Please try again.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}
