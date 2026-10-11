import { pageHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const tab = search["tab"];
    return {
      tab: tab === "signup" || tab === "appeal" || tab === "login" ? (tab as "signup" | "appeal" | "login") : "login",
    };
  },
  head: () => pageHead("/auth"),
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
