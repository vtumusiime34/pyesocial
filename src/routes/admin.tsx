import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | PYE" },
      { name: "description", content: "PYE moderation and administration dashboard." },
      { property: "og:title", content: "Admin | PYE" },
      { property: "og:description", content: "PYE moderation dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PyeShell view="admin" />,
});
