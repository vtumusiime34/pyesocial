import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/games")({
  head: () => pageHead("/games"),
  component: () => <PyeShell view="games" />,
});
