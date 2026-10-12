import { Suspense } from "react";
import { GoogleLinkAccountPage } from "@/components/auth/google/GoogleLinkAccountPage";

function GoogleLinkFallback() {
  return (
    <main className="auth-google-page" aria-live="polite">
      <p className="auth-google-loading">Preparing your account link…</p>
    </main>
  );
}

export default function GoogleLinkRoute() {
  return (
    <Suspense fallback={<GoogleLinkFallback />}>
      <GoogleLinkAccountPage />
    </Suspense>
  );
}
