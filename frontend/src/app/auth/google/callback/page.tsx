import { Suspense } from "react";
import { GoogleCallbackPage } from "@/components/auth/google/GoogleCallbackPage";

function GoogleCallbackFallback() {
  return (
    <main className="auth-google-page" aria-live="polite">
      <p className="auth-google-loading">Preparing Google sign-in…</p>
    </main>
  );
}

export default function GoogleCallbackRoute() {
  return (
    <Suspense fallback={<GoogleCallbackFallback />}>
      <GoogleCallbackPage />
    </Suspense>
  );
}
