import { useEffect, useMemo, useState } from 'react';
import { CloudDownload, Check, Loader2, Trash2, WifiOff, Image } from 'lucide-react';
import {
  downloadOffline,
  downloadHighResPhotos,
  offlineUrlPlan,
  highResPlan,
  offlineCachedCount,
  clearOffline,
  type DownloadProgress,
} from '../lib/offline';

const FLAG = 'mw-offline-ready';
const FLAG_HR = 'mw-offline-photos';

export function OfflineCard() {
  const plan = useMemo(() => offlineUrlPlan(), []);
  const hr = useMemo(() => highResPlan(), []);
  const total = plan.tiles.length + plan.photos.length;
  // Rough estimate: tiles ~16KB, thumbnails ~6KB.
  const estMb = Math.round((plan.tiles.length * 16 + plan.photos.length * 6) / 1024);

  const [ready, setReady] = useState(false);
  const [photosReady, setPhotosReady] = useState(false);
  const [cached, setCached] = useState(0);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [photoProgress, setPhotoProgress] = useState<DownloadProgress | null>(null);

  const refresh = () => offlineCachedCount().then(setCached);

  useEffect(() => {
    setReady(localStorage.getItem(FLAG) === '1');
    setPhotosReady(localStorage.getItem(FLAG_HR) === '1');
    refresh();
  }, []);

  const run = async () => {
    setProgress({ done: 0, total, phase: 'tiles' });
    await downloadOffline(setProgress);
    localStorage.setItem(FLAG, '1');
    setReady(true);
    setProgress(null);
    refresh();
  };

  const runPhotos = async () => {
    setPhotoProgress({ done: 0, total: hr.urls.length, phase: 'photos' });
    await downloadHighResPhotos(setPhotoProgress);
    localStorage.setItem(FLAG_HR, '1');
    setPhotosReady(true);
    setPhotoProgress(null);
    refresh();
  };

  const wipe = async () => {
    await clearOffline();
    localStorage.removeItem(FLAG);
    localStorage.removeItem(FLAG_HR);
    setReady(false);
    setPhotosReady(false);
    setCached(0);
  };

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  const photoPct = photoProgress
    ? Math.round((photoProgress.done / photoProgress.total) * 100)
    : 0;

  return (
    <section className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-moss-300">
          {ready ? <Check size={22} /> : <WifiOff size={22} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold">Offline use</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {ready
              ? 'Map and photos are saved on this device — works with no signal in the forest.'
              : 'Save the map tiles and boulder photos so the app works without signal at the crag.'}
          </p>
        </div>
      </div>

      {/* Base download: tiles + thumbnails */}
      {progress ? (
        <Progress pct={pct} label={`Saving ${progress.phase}… ${progress.done}/${progress.total}`} />
      ) : ready ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={run}
            className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-100 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <CloudDownload size={17} /> Update map
          </button>
          <button
            onClick={wipe}
            className="py-2.5 px-3 rounded-xl bg-slate-700 text-slate-300"
            aria-label="Clear offline data"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ) : (
        <button
          onClick={run}
          className="mt-3 w-full py-3 rounded-xl bg-moss-500 text-white font-semibold inline-flex items-center justify-center gap-2"
        >
          <CloudDownload size={18} /> Download offline map (~{estMb} MB)
        </button>
      )}

      {/* Optional heavier download: full-size detail photos */}
      <div className="mt-3 pt-3 border-t border-slate-700/60">
        {photoProgress ? (
          <Progress
            pct={photoPct}
            label={`Saving full-size photos… ${photoProgress.done}/${photoProgress.total}`}
          />
        ) : photosReady ? (
          <p className="text-sm text-moss-300 inline-flex items-center gap-2">
            <Check size={16} /> Full-size photos saved
          </p>
        ) : (
          <button
            onClick={runPhotos}
            className="w-full py-2.5 rounded-xl bg-slate-700 text-slate-100 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <Image size={16} /> Also save full-size photos (~{hr.estMb} MB)
          </button>
        )}
        {!photosReady && !photoProgress && (
          <p className="text-xs text-slate-500 mt-1.5">
            Larger download — only needed if you want every boulder's full photo offline.
          </p>
        )}
      </div>

      {ready && cached > 0 && (
        <p className="text-xs text-slate-500 mt-2">{cached} files cached on this device.</p>
      )}
    </section>
  );
}

function Progress({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="mt-3">
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full bg-moss-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1.5 inline-flex items-center gap-1.5">
        <Loader2 size={13} className="animate-spin" />
        {label}
      </p>
    </div>
  );
}
