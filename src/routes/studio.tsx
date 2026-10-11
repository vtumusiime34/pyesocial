import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/studio")({
  head: () => pageHead("/studio"),
  component: () => <PyeShell view="studio" />,
});
