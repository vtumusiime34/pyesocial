import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  head: () => {
    const head = pageHead("/admin", { title: "PYE Administration — Account & Safety Review", description: "Restricted PYE account management and safety review." });
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex, nofollow" }] };
  },
  component: () => <PyeShell view="admin" />,
});
