import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/spaces")({
  head: () => pageHead("/spaces"),
  component: () => <PyeShell view="spaces" />,
});
