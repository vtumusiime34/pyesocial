import React, { useRef, useState } from 'react';
import { Wand2, Loader2, Check } from 'lucide-react';
import { streamAi } from '@/lib/ai-client';

const TONES = ['Engaging', 'Funny', 'Hype', 'Chill', 'Professional'];

/** Turns a creator's rough draft into polished caption options via the PYE AI endpoint. */
export const AiCaptionHelper: React.FC<{ draft: string; onPick: (c: string) => void }> = ({ draft, onPick }) => {
  const [tone, setTone] = useState('Engaging');
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const options = raw
    .split(/\n\s*---\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const run = async () => {
    if (!draft.trim() || loading) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    setRaw('');
    try {
      await streamAi({ mode: 'caption', draft, tone }, setRaw, ac.signal);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-[#FF007A]/25 bg-gradient-to-br from-[#FF007A]/10 to-[#FFA000]/5 p-2.5 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TONES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            className={`px-2 py-0.5 rounded-full text-[10px] transition ${
              tone === t ? 'bg-[#FF007A] text-white font-semibold' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={run}
          disabled={!draft.trim() || loading}
          className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#FF007A] to-[#FFA000] text-black disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          {loading ? 'Polishing…' : 'Polish with AI'}
        </button>
      </div>
      {!draft.trim() && !raw && (
        <p className="text-[10px] text-zinc-500">Write a rough draft above, then let AI turn it into captions.</p>
      )}
      {error && <p className="text-[10px] text-rose-400">{error}</p>}
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(o)}
          className="group w-full text-left p-2 rounded-lg bg-zinc-950/70 border border-white/5 hover:border-[#FF007A]/60 text-[11px] text-zinc-200 whitespace-pre-wrap transition"
        >
          {o}
          {!loading && (
            <span className="mt-1 flex items-center gap-1 text-[10px] text-[#FF007A] opacity-70 group-hover:opacity-100">
              <Check className="w-3 h-3" /> Use this caption
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
