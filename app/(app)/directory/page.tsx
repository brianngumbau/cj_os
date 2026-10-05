import type { Metadata } from "next";

import { PeopleDirectory } from "@/components/people-directory";

export const metadata: Metadata = {
  title: "Directory",
};

export default function DirectoryPage() {
  return <PeopleDirectory />;
}
