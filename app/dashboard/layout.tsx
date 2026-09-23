import { AppHeader } from "@/components/app-header";
import { AuthGate } from "@/components/auth-gate";

/**
 * Shell for every signed-in route. The gate runs first, so nothing beneath it
 * renders — or opens a Firestore subscription — until a session is confirmed.
 */
export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <AuthGate>
      <AppHeader />
      {children}
    </AuthGate>
  );
}
