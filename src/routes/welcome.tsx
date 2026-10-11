import { pageHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/welcome")({
  head: () => pageHead("/welcome"),
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onEnter={() => void navigate({ to: "/auth", search: { tab: "signup" } })}
      onExplore={() => void navigate({ to: "/" })}
    />
  );
}
