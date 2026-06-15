import { Suspense, lazy } from 'react';
import { Compass, Map, Bookmark, Loader2 } from 'lucide-react';
import { useUI, type Tab } from './store/useUI';
import { ExploreScreen } from './screens/ExploreScreen';
import { ListsScreen } from './screens/ListsScreen';

// Leaflet is heavy; only load it when the Map tab is opened.
const MapScreen = lazy(() =>
  import('./screens/MapScreen').then((m) => ({ default: m.MapScreen }))
);
import { FilterSheet } from './components/FilterSheet';
import { BoulderDetailSheet } from './components/BoulderDetailSheet';
import { ListPickerSheet } from './components/ListPickerSheet';
import { OfflineBanner } from './components/OfflineBanner';

const TABS: { key: Tab; label: string; icon: typeof Compass }[] = [
  { key: 'explore', label: 'Explore', icon: Compass },
  { key: 'map', label: 'Map', icon: Map },
  { key: 'lists', label: 'Lists', icon: Bookmark },
];

export default function App() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 max-w-lg mx-auto relative">
      <OfflineBanner />
      <main className="flex-1 min-h-0">
        {tab === 'explore' && <ExploreScreen />}
        {tab === 'map' && (
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-slate-500">
                <Loader2 className="animate-spin" />
              </div>
            }
          >
            <MapScreen />
          </Suspense>
        )}
        {tab === 'lists' && <ListsScreen />}
      </main>

      <nav
        className="shrink-0 grid grid-cols-3 border-t border-slate-800 bg-slate-900"
        // Clamp the home-indicator inset to a small, fixed clearance. iOS reports
        // ~34px when installed (0 in Safari); adding it all made the nav tall, so
        // we cap it — the bar stays compact and just clears the home indicator.
        style={{ paddingBottom: 'max(0.25rem, min(env(safe-area-inset-bottom), 0.5rem))' }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-col items-center gap-0.5 pt-1 pb-0.5 text-[10px] font-medium ${
              tab === key ? 'text-moss-300' : 'text-slate-500'
            }`}
          >
            <Icon size={19} className={tab === key ? 'fill-moss-300/15' : ''} />
            {label}
          </button>
        ))}
      </nav>

      <FilterSheet />
      <BoulderDetailSheet />
      <ListPickerSheet />
    </div>
  );
}
