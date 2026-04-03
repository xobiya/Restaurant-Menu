import { useEffect, useState } from 'react';
import { CUSTOMER_EVENTS, getQueuedOrders } from '../../lib/customerState';
import { syncQueuedOrders } from '../../lib/orderFlow';

export default function SyncManager({ children }) {
  const [syncing, setSyncing] = useState(false);
  const [recentlySyncedCount, setRecentlySyncedCount] = useState(0);

  useEffect(() => {
    let timeoutId;

    const triggerSync = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (!getQueuedOrders().length) return;
      if (syncing) return;

      setSyncing(true);

      try {
        const synced = await syncQueuedOrders();
        setRecentlySyncedCount(synced.length);

        if (synced.length) {
          timeoutId = window.setTimeout(() => {
            setRecentlySyncedCount(0);
          }, 5000);
        }
      } finally {
        setSyncing(false);
      }
    };

    const handleOnline = () => {
      triggerSync();
    };

    const handleQueueChange = () => {
      triggerSync();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        triggerSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener(CUSTOMER_EVENTS.queue, handleQueueChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    triggerSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(CUSTOMER_EVENTS.queue, handleQueueChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [syncing]);

  return children({ syncing, recentlySyncedCount });
}
