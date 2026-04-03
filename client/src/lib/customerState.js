const PREFERENCES_KEY = 'restaurant_preferences_v2';
const PROFILE_KEY = 'restaurant_profile_v1';
const ORDER_HISTORY_KEY = 'restaurant_order_history_v1';
const ORDER_QUEUE_KEY = 'restaurant_order_queue_v1';

export const CUSTOMER_EVENTS = {
  preferences: 'restaurant-preferences-change',
  profile: 'restaurant-profile-change',
  history: 'restaurant-history-change',
  queue: 'restaurant-queue-change',
};

const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readJson = (key, fallback) => {
  if (!canUseStorage()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

const emit = (eventName, detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const sortByNewest = (items) =>
  [...items].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));

export const getCustomerPreferences = () => {
  const defaultLowData =
    typeof navigator !== 'undefined' &&
    typeof navigator.connection !== 'undefined' &&
    navigator.connection?.saveData === true;

  return {
    lowDataMode: defaultLowData,
    fastingOnly: false,
    ...readJson(PREFERENCES_KEY, {}),
  };
};

export const saveCustomerPreferences = (partialPreferences) => {
  const nextPreferences = {
    ...getCustomerPreferences(),
    ...partialPreferences,
  };

  writeJson(PREFERENCES_KEY, nextPreferences);
  emit(CUSTOMER_EVENTS.preferences, nextPreferences);
  return nextPreferences;
};

export const getCustomerProfile = () =>
  readJson(PROFILE_KEY, {
    customerName: '',
    phone: '',
  });

export const saveCustomerProfile = (partialProfile) => {
  const nextProfile = {
    ...getCustomerProfile(),
    ...partialProfile,
  };

  writeJson(PROFILE_KEY, nextProfile);
  emit(CUSTOMER_EVENTS.profile, nextProfile);
  return nextProfile;
};

export const getOrderHistory = () => sortByNewest(readJson(ORDER_HISTORY_KEY, []));

export const upsertOrderHistory = (entry) => {
  const currentHistory = getOrderHistory();
  const index = currentHistory.findIndex(
    (item) =>
      (entry.localId && item.localId === entry.localId) ||
      (entry.orderId && item.orderId === entry.orderId) ||
      (entry.txRef && item.txRef === entry.txRef)
  );

  const existing = index >= 0 ? currentHistory[index] : null;
  const nextEntry = {
    ...existing,
    ...entry,
    updatedAt: new Date().toISOString(),
  };

  const nextHistory =
    index >= 0
      ? currentHistory.map((item, itemIndex) => (itemIndex === index ? nextEntry : item))
      : [nextEntry, ...currentHistory];

  const trimmedHistory = sortByNewest(nextHistory).slice(0, 20);
  writeJson(ORDER_HISTORY_KEY, trimmedHistory);
  emit(CUSTOMER_EVENTS.history, trimmedHistory);
  return nextEntry;
};

export const getQueuedOrders = () => sortByNewest(readJson(ORDER_QUEUE_KEY, []));

export const enqueueOrder = (draft) => {
  const currentQueue = getQueuedOrders();
  const nextQueue = sortByNewest([
    {
      ...draft,
      syncState: 'queued',
      updatedAt: new Date().toISOString(),
    },
    ...currentQueue.filter((item) => item.localId !== draft.localId),
  ]);

  writeJson(ORDER_QUEUE_KEY, nextQueue);
  emit(CUSTOMER_EVENTS.queue, nextQueue);
  return draft;
};

export const updateQueuedOrder = (localId, partialDraft) => {
  const nextQueue = getQueuedOrders().map((item) =>
    item.localId === localId
      ? {
          ...item,
          ...partialDraft,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  writeJson(ORDER_QUEUE_KEY, nextQueue);
  emit(CUSTOMER_EVENTS.queue, nextQueue);
  return nextQueue.find((item) => item.localId === localId) || null;
};

export const removeQueuedOrder = (localId) => {
  const nextQueue = getQueuedOrders().filter((item) => item.localId !== localId);
  writeJson(ORDER_QUEUE_KEY, nextQueue);
  emit(CUSTOMER_EVENTS.queue, nextQueue);
  return nextQueue;
};
