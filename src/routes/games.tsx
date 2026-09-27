import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "PYE Arcade — Chess, Checkers, Ludo & More" },
      {
        name: "description",
        content: "Play PYE Arcade games — chess, checkers, ludo and tik tak toe — and earn Silver PYE Coins.",
      },
      { property: "og:title", content: "PYE Arcade — Chess, Checkers, Ludo & More" },
      { property: "og:description", content: "Play arcade games on PYE and earn Silver PYE Coins." },
    ],
  }),
  component: () => <PyeShell view="games" />,
});
