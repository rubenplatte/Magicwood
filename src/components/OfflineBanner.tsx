import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// Thin banner shown when the device loses connectivity, reassuring the user
// that saved data still works.
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="shrink-0 flex items-center justify-center gap-2 py-1.5 text-xs font-medium bg-amber-500/15 text-amber-300 border-b border-amber-500/20">
      <WifiOff size={13} /> Offline — showing saved data
    </div>
  );
}
