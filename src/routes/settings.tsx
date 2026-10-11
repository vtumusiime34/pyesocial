import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/settings")({
  head: () => pageHead("/settings"),
  component: () => <PyeShell view="settings" />,
});
