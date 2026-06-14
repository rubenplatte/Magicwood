import { Users, MapPin } from 'lucide-react';
import { Stars } from './Stars';
import { ActionBar } from './ActionBar';
import { useUI } from '../store/useUI';
import type { Boulder } from '../lib/types';

export function BoulderCard({ boulder }: { boulder: Boulder }) {
  const openDetail = useUI((s) => s.openDetail);

  return (
    <div
      onClick={() => openDetail(boulder.slug)}
      className="flex gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 active:bg-slate-800 cursor-pointer"
    >
      <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-700">
        {boulder.image ? (
          <img
            src={boulder.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            no photo
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight truncate">{boulder.name}</h3>
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-moss-600/30 text-moss-200 font-bold text-sm">
            {boulder.grade ?? 'proj'}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm">
          <Stars rating={boulder.rating} />
          {boulder.votes > 0 && (
            <span className="text-slate-500 text-xs">({boulder.votes})</span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> {boulder.ascents}
          </span>
          {boulder.sector && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin size={12} /> {boulder.sector}
            </span>
          )}
        </div>

        <div className="mt-1.5 -ml-1">
          <ActionBar boulder={boulder} />
        </div>
      </div>
    </div>
  );
}
