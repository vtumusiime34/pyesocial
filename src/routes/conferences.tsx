import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/conferences")({
  head: () => ({
    meta: [
      { title: "PYE Conferences — Live Creator Sessions" },
      {
        name: "description",
        content: "Discover and join PYE Conferences hosted by creators, with schedules, speakers and categories.",
      },
      { property: "og:title", content: "PYE Conferences — Live Creator Sessions" },
      { property: "og:description", content: "Join conferences hosted by PYE creators." },
    ],
  }),
  component: () => <PyeShell view="conferences" />,
});
