import { lazy, Suspense } from 'react';
import { createFileRoute, ClientOnly } from '@tanstack/react-router';
import { pageHead } from '@/lib/seo';
const Football = lazy(() => import('@/components/game/FootballApp').then(m => ({ default: m.FootballApp })));
export const Route = createFileRoute('/football')({ head: () => pageHead('/football', {description: 'Play PYE Football: 3D 11-vs-11 matches with club selection, touch controls and keyboard play.'}), component: FootballRoute });
function FootballRoute() { return <ClientOnly fallback={<p>Loading PYE Football…</p>}><Suspense fallback={<p>Loading PYE Football…</p>}><Football /></Suspense></ClientOnly>; }