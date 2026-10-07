import type { PublicPaymentInstructionsResponse } from "./adminSettingsTypes";

export async function getPublicPaymentInstructions(signal?: AbortSignal) {
  const response = await fetch("/api/payment-instructions", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Payment instructions could not be loaded.");
  }

  return (await response.json()) as PublicPaymentInstructionsResponse;
}
