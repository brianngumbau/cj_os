import type { Metadata } from "next";

import { DepartmentsOverview } from "@/components/departments-overview";

export const metadata: Metadata = {
  title: "Departments",
};

export default function DepartmentsPage() {
  return <DepartmentsOverview />;
}
