import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "PYE Rankings — Top Creators & Pulses" },
      {
        name: "description",
        content: "See the top PYE creators by pulses, growth and PYE Coins, ranked from real activity on PYE.",
      },
      { property: "og:title", content: "PYE Rankings — Top Creators & Pulses" },
      { property: "og:description", content: "Top PYE creators ranked from real activity." },
    ],
  }),
  component: () => <PyeShell view="rankings" />,
});
