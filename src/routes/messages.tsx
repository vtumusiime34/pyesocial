import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/messages")({
  head: () => pageHead("/messages"),
  component: () => <PyeShell view="messages" />,
});
