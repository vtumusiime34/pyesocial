import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PYE" }, { name: "robots", content: "noindex" }] }),
  component: () => <PyeShell view="admin" />,
});
