import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => {
    const handle = `@${params.username}`;
    return {
      meta: [
        { title: `${handle} on PYE` },
        { name: "description", content: `See ${handle}'s pulses, PYES videos, followers and PYE activity.` },
        { property: "og:title", content: `${handle} on PYE` },
        { property: "og:description", content: `${handle}'s pulses and PYES videos on PYE.` },
        { property: "og:type", content: "profile" },
      ],
    };
  },
  component: ProfileRoute,
});

function ProfileRoute() {
  const { username } = Route.useParams();
  return <PyeShell view="profile" profileUsername={username} />;
}
