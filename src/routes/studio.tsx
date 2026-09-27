import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Creator Studio | PYE" },
      {
        name: "description",
        content: "Manage your PYE content and track views, likes, comments and coins earned in Creator Studio.",
      },
      { property: "og:title", content: "Creator Studio | PYE" },
      { property: "og:description", content: "Track your PYE content performance and coins earned." },
    ],
  }),
  component: () => <PyeShell view="studio" />,
});
