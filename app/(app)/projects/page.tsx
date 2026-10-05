import type { Metadata } from "next";

import { ProjectsHub } from "@/components/projects-hub";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return <ProjectsHub />;
}
