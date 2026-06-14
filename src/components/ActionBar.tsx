import { Heart, Target, Check, ListPlus, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { Boulder } from '../lib/types';

// Compact row of like / project / tick / add-to-list actions.
export function ActionBar({ boulder, size = 'sm' }: { boulder: Boulder; size?: 'sm' | 'lg' }) {
  const liked = useStore((s) => !!s.liked[boulder.slug]);
  const project = useStore((s) => !!s.projects[boulder.slug]);
  const tick = useStore((s) => s.ticks[boulder.slug]);
  const toggleLike = useStore((s) => s.toggleLike);
  const toggleProject = useStore((s) => s.toggleProject);
  const setTick = useStore((s) => s.setTick);
  const openListPicker = useUI((s) => s.openListPicker);

  const btn =
    size === 'lg'
      ? 'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium'
      : 'p-2 rounded-lg';
  const icon = size === 'lg' ? 22 : 19;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={size === 'lg' ? 'grid grid-cols-4 gap-2' : 'flex items-center gap-1'}>
      <button
        onClick={stop(() => toggleLike(boulder.slug))}
        className={`${btn} ${liked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:bg-slate-800'}`}
        aria-label="Like"
      >
        <Heart size={icon} className={liked ? 'fill-rose-400' : ''} />
        {size === 'lg' && <span>Like</span>}
      </button>

      <button
        onClick={stop(() => toggleProject(boulder.slug))}
        className={`${btn} ${project ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:bg-slate-800'}`}
        aria-label="Mark as project"
      >
        <Target size={icon} className={project ? 'fill-amber-400/30' : ''} />
        {size === 'lg' && <span>Project</span>}
      </button>

      {size === 'lg' ? (
        <>
          <button
            onClick={stop(() =>
              setTick(boulder.slug, tick?.style === 'flash' ? null : 'flash')
            )}
            className={`${btn} ${tick?.style === 'flash' ? 'text-yellow-300 bg-yellow-400/10' : 'text-slate-400 hover:bg-slate-800'}`}
            aria-label="Flash"
          >
            <Zap size={icon} className={tick?.style === 'flash' ? 'fill-yellow-300' : ''} />
            <span>Flash</span>
          </button>
          <button
            onClick={stop(() =>
              setTick(boulder.slug, tick?.style === 'redpoint' ? null : 'redpoint')
            )}
            className={`${btn} ${tick?.style === 'redpoint' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-800'}`}
            aria-label="Redpoint"
          >
            <Check size={icon} className={tick?.style === 'redpoint' ? '' : ''} />
            <span>Redpoint</span>
          </button>
        </>
      ) : (
        <button
          onClick={stop(() => {
            // Quick cycle: untracked -> redpoint -> flash -> untracked
            const next = !tick ? 'redpoint' : tick.style === 'redpoint' ? 'flash' : null;
            setTick(boulder.slug, next);
          })}
          className={`${btn} ${
            tick?.style === 'flash'
              ? 'text-yellow-300 bg-yellow-400/10'
              : tick?.style === 'redpoint'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:bg-slate-800'
          }`}
          aria-label="Tick"
        >
          {tick?.style === 'flash' ? (
            <Zap size={icon} className="fill-yellow-300" />
          ) : (
            <Check size={icon} />
          )}
        </button>
      )}

      <button
        onClick={stop(() => openListPicker(boulder.slug))}
        className={`${btn} text-slate-400 hover:bg-slate-800`}
        aria-label="Add to list"
      >
        <ListPlus size={icon} />
        {size === 'lg' && <span>List</span>}
      </button>
    </div>
  );
}
