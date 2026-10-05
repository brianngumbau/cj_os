import { AppHeader } from "@/components/app-header";
import { AuthGate } from "@/components/auth-gate";

/**
 * Shell for every signed-in route (/dashboard, /directory, …). The `(app)`
 * route group shares this layout without adding a URL segment. The gate runs
 * first, so nothing beneath it renders — or opens a Firestore subscription —
 * until a session is confirmed.
 */
export default function SignedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <AppHeader />
      {children}
    </AuthGate>
  );
}
