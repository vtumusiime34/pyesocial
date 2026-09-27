import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Search PYE — Creators, PYES, Sounds & Conferences" },
      {
        name: "description",
        content: "Search PYE for creators, PYES videos, pulses, hashtags, sounds and conferences.",
      },
      { property: "og:title", content: "Search PYE" },
      { property: "og:description", content: "Find creators, PYES videos, sounds and conferences on PYE." },
    ],
  }),
  component: SearchRoute,
});

function SearchRoute() {
  const { q } = Route.useSearch();
  return <PyeShell view="search" initialQuery={q} />;
}
