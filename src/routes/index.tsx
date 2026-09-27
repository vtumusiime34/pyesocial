import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PYE — The Social Universe for Creators" },
      {
        name: "description",
        content:
          "PYE is the social universe for creators: share pulses, post PYES videos, discover sounds, join conferences and earn PYE Coins.",
      },
      { property: "og:title", content: "PYE — The Social Universe for Creators" },
      {
        property: "og:description",
        content: "Share pulses, post PYES videos, discover sounds and earn PYE Coins.",
      },
    ],
  }),
  component: () => <PyeShell view="home" />,
});
