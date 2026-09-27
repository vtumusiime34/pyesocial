import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/spaces")({
  head: () => ({
    meta: [
      { title: "PYE Spaces — Communities by Interest" },
      {
        name: "description",
        content: "Explore PYE Spaces: technology, gaming, music, science, art and future protocols communities.",
      },
      { property: "og:title", content: "PYE Spaces — Communities by Interest" },
      { property: "og:description", content: "Communities for technology, gaming, music, science and art." },
    ],
  }),
  component: () => <PyeShell view="spaces" />,
});
