import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/games")({
  head: () => pageHead("/games"),
  component: () => <><div className="dark bg-background px-4 py-2 flex justify-end"><Button asChild variant="secondary"><Link to="/football">PYE Football</Link></Button></div><PyeShell view="games" /></>,
});
