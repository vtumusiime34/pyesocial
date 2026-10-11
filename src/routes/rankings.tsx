import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/rankings")({
  head: () => pageHead("/rankings"),
  component: () => <PyeShell view="rankings" />,
});
