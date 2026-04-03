import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CUSTOMER_EVENTS, getQueuedOrders } from '../../lib/customerState';

export default function OfflineBanner({ syncing = false, recentlySyncedCount = 0 }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [queuedCount, setQueuedCount] = useState(() => getQueuedOrders().length);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueChange = () => setQueuedCount(getQueuedOrders().length);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(CUSTOMER_EVENTS.queue, handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(CUSTOMER_EVENTS.queue, handleQueueChange);
    };
  }, []);

  const bannerState = useMemo(() => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        className: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
        message:
          queuedCount > 0
            ? `${queuedCount} order${queuedCount === 1 ? '' : 's'} waiting for connection. Menu browsing still works.`
            : 'You are offline. Cached menu browsing is still available.',
      };
    }

    if (syncing) {
      return {
        icon: RefreshCw,
        className: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
        message: 'Connection restored. Syncing queued orders now...',
      };
    }

    if (recentlySyncedCount > 0) {
      return {
        icon: Wifi,
        className: 'border-green-500/25 bg-green-500/10 text-green-100',
        message: `${recentlySyncedCount} queued order${recentlySyncedCount === 1 ? '' : 's'} synced successfully.`,
      };
    }

    return null;
  }, [isOnline, queuedCount, syncing, recentlySyncedCount]);

  if (!bannerState) return null;

  const Icon = bannerState.icon;

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className={`mx-auto flex w-full max-w-6xl items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${bannerState.className}`}>
        <Icon size={16} className={syncing ? 'animate-spin' : ''} />
        <span>{bannerState.message}</span>
      </div>
    </div>
  );
}
