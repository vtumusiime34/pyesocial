import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const tab = search["tab"];
    return {
      tab: tab === "signup" || tab === "appeal" || tab === "login" ? (tab as "signup" | "appeal" | "login") : "login",
    };
  },
  head: () => ({
    meta: [
      { title: "Log in or join PYE" },
      {
        name: "description",
        content: "Log in to PYE or create your free account and claim your welcome PYE Coins.",
      },
      { property: "og:title", content: "Log in or join PYE" },
      { property: "og:description", content: "Create your free PYE account and claim your welcome PYE Coins." },
    ],
  }),
  component: AuthRoute,
});

function AuthRoute() {
  const navigate = useNavigate();
  const { tab } = Route.useSearch();

  return (
    <AuthPage
      initialTab={tab}
      onSuccess={() => {
        void navigate({ to: "/" });
      }}
      onExploreAsGuest={() => {
        void navigate({ to: "/" });
      }}
    />
  );
}
