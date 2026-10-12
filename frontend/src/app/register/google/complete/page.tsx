import { Suspense } from "react";
import { GoogleCompleteAccountPage } from "@/components/auth/google/GoogleCompleteAccountPage";

function GoogleCompleteFallback() {
  return (
    <main className="auth-google-page" aria-live="polite">
      <p className="auth-google-loading">Preparing your Google account…</p>
    </main>
  );
}

export default function GoogleCompleteRoute() {
  return (
    <Suspense fallback={<GoogleCompleteFallback />}>
      <GoogleCompleteAccountPage />
    </Suspense>
  );
}
