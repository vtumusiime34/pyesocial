import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | PYE" },
      { name: "description", content: "Manage your PYE account, privacy and safety settings." },
      { property: "og:title", content: "Settings | PYE" },
      { property: "og:description", content: "Manage your PYE account and privacy." },
    ],
  }),
  component: () => <PyeShell view="settings" />,
});
