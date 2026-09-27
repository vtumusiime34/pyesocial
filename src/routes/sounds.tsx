import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/sounds")({
  head: () => ({
    meta: [
      { title: "PYE Sounds — Original Audio for Creators" },
      {
        name: "description",
        content: "Browse, search and play PYE Sounds — original audio tracks creators use in their PYES videos.",
      },
      { property: "og:title", content: "PYE Sounds — Original Audio for Creators" },
      { property: "og:description", content: "Original audio tracks creators use in their PYES videos." },
    ],
  }),
  component: () => <PyeShell view="sounds" />,
});
