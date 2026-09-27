import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages | PYE" },
      { name: "description", content: "Your private PYE conversations with other creators." },
      { property: "og:title", content: "Messages | PYE" },
      { property: "og:description", content: "Private conversations on PYE." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PyeShell view="messages" />,
});
