import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/pyes")({
  head: () => ({
    meta: [
      { title: "PYES — Vertical Video Feed | PYE" },
      {
        name: "description",
        content: "Watch PYES, PYE's vertical short video feed. Like, comment, save and share creator videos.",
      },
      { property: "og:title", content: "PYES — Vertical Video Feed | PYE" },
      { property: "og:description", content: "PYE's vertical short video feed from real creators." },
    ],
  }),
  component: () => <PyeShell view="shorts" />,
});
