import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to PYE — Create, Connect, Earn" },
      {
        name: "description",
        content:
          "PYE is a creator-first social universe: post pulses and PYES videos, join conferences, play arcade games and earn PYE Coins.",
      },
      { property: "og:title", content: "Welcome to PYE — Create, Connect, Earn" },
      {
        property: "og:description",
        content: "Post pulses and PYES videos, join conferences and earn PYE Coins.",
      },
    ],
  }),
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
