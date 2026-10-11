export const SITE_URL = "https://pyesocial.lovable.app";
export const SHARE_IMAGE = `${SITE_URL}/og/pye-share.jpg`;

export interface PageSeo {
  path: string;
  title: string;
  description: string;
}

/** Every public PYE page, with its search/share text. Used by route heads and the SEO status page. */
export const PUBLIC_PAGES: PageSeo[] = [
  { path: "/", title: "PYE — The Social Universe for Creators", description: "Share pulses, post PYES videos, discover sounds, join conferences and earn PYE Coins on PYE." },
  { path: "/welcome", title: "Welcome to PYE — Create, Connect, Belong", description: "Discover PYE: short PYES videos, original sounds, arcade games and a creator economy with Silver and Gold PYE Coins." },
  { path: "/pyes", title: "PYES — Short Videos on PYE", description: "Watch and share PYES, the full-screen short videos made by PYE creators." },
  { path: "/spaces", title: "PYE Spaces — Communities by Interest", description: "Explore PYE Spaces for technology, music, gaming, art and more creator communities." },
  { path: "/sounds", title: "PYE Sounds — Original Audio for Creators", description: "Listen to, upload and use original sounds in your PYES videos." },
  { path: "/games", title: "PYE Arcade — Football, Chess, Ludo & More", description: "Play PYE Football, chess, checkers, ludo and tic-tac-toe and earn Silver PYE Coins." },
  { path: "/football", title: "PYE Football — 3D Matches, Career & Leagues", description: "Play 3D football on PYE: quick matches, career mode, leagues, tournaments and penalty shootouts." },
  { path: "/conferences", title: "PYE Summits — Live Creator Conferences", description: "Join and host PYE Summits: conferences and talks with creators across the PYE Universe." },
  { path: "/rankings", title: "PYE Rankings — Top Creators", description: "See the top PYE creators and players on the PYE leaderboards." },
  { path: "/studio", title: "PYE Creator Studio — Manage Your Content", description: "Track your PYES, sounds and earnings in PYE Creator Studio." },
  { path: "/search", title: "Search PYE — Creators, PYES & Sounds", description: "Search PYE for creators, PYES videos, sounds and spaces." },
  { path: "/auth", title: "Sign in or Sign up — PYE", description: "Log in to PYE or create a free account and get 15 Silver and 2 Gold PYE Coins." },
  { path: "/messages", title: "Messages — PYE", description: "Chat, call and video call other PYE creators." },
  { path: "/settings", title: "Settings — PYE", description: "Manage your PYE account, privacy and preferences." },
];

const byPath = new Map(PUBLIC_PAGES.map((p) => [p.path, p]));

export function pageHead(path: string, override?: Partial<PageSeo>) {
  const base = byPath.get(path) ?? PUBLIC_PAGES[0];
  const title = override?.title ?? base.title;
  const description = override?.description ?? base.description;
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SHARE_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
