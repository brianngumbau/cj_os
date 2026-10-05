import type { Metadata } from "next";

import { Ledger } from "@/components/ledger";

export const metadata: Metadata = {
  title: "Ledger",
};

export default function DashboardPage() {
  return <Ledger />;
}
