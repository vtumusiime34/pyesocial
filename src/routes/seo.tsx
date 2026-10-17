import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { RefreshCw, Check, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PyeLogo } from '@/components/ui/PyeLogo';
import { PUBLIC_PAGES, SITE_URL, pageHead } from '@/lib/seo';

export const Route = createFileRoute('/seo')({ head: () => pageHead('/seo'), component: SeoStatus });
type Row = { path: string; status: number; sitemap: boolean; canonical: boolean; indexable: boolean; error?: string };
function SeoStatus() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async () => {
    setBusy(true); setRows([]); setError('');
    try {
      const sitemapResponse = await fetch('/sitemap.xml');
      if (!sitemapResponse.ok) throw new Error('Sitemap could not be read.');
      const xml = new DOMParser().parseFromString(await sitemapResponse.text(), 'application/xml');
      const locations = new Set(Array.from(xml.querySelectorAll('loc')).map(n => n.textContent?.replace(/\/$/, '')));
      const robots = await fetch('/robots.txt').then(r => r.ok ? r.text() : Promise.reject(new Error('Crawler rules could not be read.')));
      const blocked = /^Disallow:\s*\/\s*$/mi.test(robots);
      for (const item of PUBLIC_PAGES) {
        const url = `${SITE_URL}${item.path === '/' ? '' : item.path}`;
        try {
          const response = await fetch(item.path, { headers: { accept: 'text/html' } });
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.replace(/\/$/, '');
          const meta = Array.from(doc.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')).map(n => n.getAttribute('content')).join(' ');
          setRows(prev => [...prev, { path: item.path, status: response.status, sitemap: locations.has(url), canonical: canonical === url, indexable: response.ok && !blocked && !/noindex|none/i.test(meta + ' ' + (response.headers.get('x-robots-tag') ?? '')) }]);
        } catch (e) {
          setRows(prev => [...prev, { path: item.path, status: 0, sitemap: locations.has(url), canonical: false, indexable: false, error: e instanceof Error ? e.message : 'Page unavailable' }]);
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Check failed.'); }
    finally { setBusy(false); }
  };
  const mark = (ok: boolean) => ok ? <Check aria-label="Pass" className="size-4 text-primary" /> : <X aria-label="Needs attention" className="size-4 text-destructive" />;
  return <main className="dark min-h-screen bg-background text-foreground px-4 py-8">
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5"><div className="flex items-center gap-3"><PyeLogo size={42} /><h1 className="text-2xl font-bold">PYE SEO Status</h1></div><Button asChild variant="ghost"><Link to="/"><ArrowLeft /> PYE</Link></Button></header>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Public page coverage</h2><p className="text-sm text-muted-foreground">{rows.length} / {PUBLIC_PAGES.length} checked · {rows.filter(r => r.sitemap && r.canonical && r.indexable).length} passing</p></div><Button onClick={run} disabled={busy}><RefreshCw className={busy ? 'animate-spin' : ''} />{busy ? 'Checking…' : 'Check pages'}</Button></div>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="py-3">Page</th><th>HTTP</th><th>Sitemap</th><th>Canonical</th><th>Indexable</th></tr></thead><tbody>{rows.map(row => <tr key={row.path} className="border-b border-border"><td className="py-3 pr-4"><a className="text-primary" href={row.path}>{row.path}</a>{row.error && <p className="text-destructive">{row.error}</p>}</td><td>{row.status || 'Unavailable'}</td><td>{mark(row.sitemap)}</td><td>{mark(row.canonical)}</td><td>{mark(row.indexable)}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-muted-foreground">Search-engine indexing is not guaranteed. These checks reflect this version of PYE; Google Search Console reports Google's indexing status. Individual creator profiles are not included in this static-page review.</p>
    </div>
  </main>;
}