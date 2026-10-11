import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/pyes")({
  head: () => pageHead("/pyes"),
  component: () => <PyeShell view="shorts" />,
});
