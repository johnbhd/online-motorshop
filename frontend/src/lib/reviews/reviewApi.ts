export type ProductReview = {
  id: number;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
  customer: { id: number; name: string; initials: string };
  product: { id: number; part_number: string; name: string } | null;
  response: { text: string; author: string | null; created_at: string | null } | null;
  status?: "pending_review" | "published" | "flagged" | "hidden";
  order_reference?: string | null;
  branch?: string | null;
  flag_reason?: string | null;
  created_at: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};

export type ReviewSummary = {
  total: number;
  average_rating: number;
  published: number;
  pending_review: number;
  flagged: number;
  hidden: number;
  awaiting_reply: number;
  needs_admin_review: number;
};

export type ReviewResponse = {
  summary: ReviewSummary;
  reviews: ProductReview[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export class ReviewApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ReviewApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers ?? {}) },
    cache: "no-store",
  });
  const text = await response.text();
  let body: Record<string, unknown> = {};

  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    // The status fallback still gives the customer a useful error.
  }

  if (!response.ok) {
    const errors = body.errors as Record<string, string[]> | undefined;
    const firstValidationError = errors ? Object.values(errors).flat()[0] : undefined;
    throw new ReviewApiError(
      response.status,
      firstValidationError ?? (typeof body.message === "string" ? body.message : "Review request failed."),
    );
  }

  return body as T;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function getProductReviews(partNumber: string, signal?: AbortSignal) {
  return request<ReviewResponse>(`/api/products/${encodeURIComponent(partNumber)}/reviews`, { signal });
}

export function getReviewEligibility(partNumber: string, token: string) {
  return request<{ eligible: boolean; reason: string | null; existing_review: ProductReview | null }>(
    `/api/customer/products/${encodeURIComponent(partNumber)}/reviews/eligibility`,
    { headers: authHeaders(token) },
  );
}

export function submitProductReview(partNumber: string, token: string, input: { rating: number; review_text: string }) {
  return request<{ message: string; review: ProductReview }>(
    `/api/customer/products/${encodeURIComponent(partNumber)}/reviews`,
    { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
}

export function getManagedReviews(role: "staff" | "admin", token: string, options: { status?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  if (options.status) query.set("status", options.status);
  if (options.search) query.set("search", options.search);
  const suffix = query.toString() ? `?${query}` : "";
  return request<ReviewResponse>(`/api/${role}/reviews${suffix}`, { headers: authHeaders(token) });
}

export function sendStaffReviewResponse(token: string, id: number, response_text: string) {
  return request<{ review: ProductReview }>(`/api/staff/reviews/${id}/response`, {
    method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ response_text }),
  });
}

export function flagStaffReview(token: string, id: number, flag_reason: string) {
  return request<{ review: ProductReview }>(`/api/staff/reviews/${id}/flag`, {
    method: "PATCH", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ flag_reason }),
  });
}

export function moderateReview(token: string, id: number, action: "publish" | "hide" | "restore" | "resolve-flag") {
  return request<{ review: ProductReview }>(`/api/admin/reviews/${id}/${action}`, { method: "PATCH", headers: authHeaders(token) });
}

export function getReviewErrorMessage(error: unknown, fallback: string) {
  return error instanceof ReviewApiError && error.message ? error.message : fallback;
}
