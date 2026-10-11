import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => pageHead("/search"),
  component: SearchRoute,
});

function SearchRoute() {
  const { q } = Route.useSearch();
  return <PyeShell view="search" initialQuery={q} />;
}
