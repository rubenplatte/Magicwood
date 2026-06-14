import { Users, MapPin, ExternalLink, Video } from 'lucide-react';
import { Sheet } from './Sheet';
import { Stars } from './Stars';
import { ActionBar } from './ActionBar';
import { useUI } from '../store/useUI';
import { useStore } from '../store/useStore';
import { getBoulder } from '../lib/data';

export function BoulderDetailSheet() {
  const slug = useUI((s) => s.detailSlug);
  const close = useUI((s) => s.closeDetail);
  const tick = useStore((s) => (slug ? s.ticks[slug] : undefined));
  const lists = useStore((s) => s.lists);

  const boulder = slug ? getBoulder(slug) : undefined;
  if (!boulder) return null;

  const inLists = lists.filter((l) => l.slugs.includes(boulder.slug));

  return (
    <Sheet open={!!slug} onClose={close} title={boulder.name}>
      {boulder.thumb && (
        <img
          src={boulder.thumb}
          alt=""
          className="w-full h-44 object-cover rounded-xl mb-3 bg-slate-800"
        />
      )}

      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-lg bg-moss-600/30 text-moss-200 font-bold text-lg">
          {boulder.grade ?? 'project'}
        </span>
        <div className="text-right">
          <Stars rating={boulder.rating} size={18} />
          <div className="text-xs text-slate-500">
            {boulder.rating.toFixed(2)} · {boulder.votes} votes
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Users size={15} /> {boulder.ascents} sends
        </span>
        {boulder.sector && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} /> {boulder.sector}
          </span>
        )}
        {boulder.hasVideo && (
          <span className="inline-flex items-center gap-1.5 text-rose-300">
            <Video size={15} /> video beta
          </span>
        )}
      </div>

      {tick && (
        <div className="mt-3 text-sm">
          <span
            className={`px-2 py-0.5 rounded-md font-medium ${
              tick.style === 'flash'
                ? 'bg-yellow-400/15 text-yellow-300'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {tick.style === 'flash' ? '⚡ Flashed' : '✓ Redpointed'} ·{' '}
            {new Date(tick.date).toLocaleDateString()}
          </span>
        </div>
      )}

      {inLists.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {inLists.map((l) => (
            <span key={l.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 p-2 bg-slate-800/50 rounded-2xl">
        <ActionBar boulder={boulder} size="lg" />
      </div>

      <a
        href={boulder.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 mb-2 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-200 font-medium"
      >
        <ExternalLink size={16} /> View on 27crags
      </a>
    </Sheet>
  );
}
