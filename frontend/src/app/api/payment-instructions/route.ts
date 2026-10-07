import { proxyPaymentInstructionsRequest } from "@/lib/paymentInstructionsProxy";

export async function GET() {
  return proxyPaymentInstructionsRequest();
}
