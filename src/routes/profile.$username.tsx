import { createFileRoute } from "@tanstack/react-router";
import { PyeShell } from "@/components/PyeShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) =>
    pageHead(`/profile/${params.username}`, {
      title: `@${params.username} on PYE`,
      description: `See PYES videos, sounds and activity from @${params.username} on PYE Social Universe.`,
    }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { username } = Route.useParams();
  return <PyeShell view="profile" profileUsername={username} />;
}
