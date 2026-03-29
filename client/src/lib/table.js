const TABLE_STORAGE_KEY = 'table_number';

export const getTableNumber = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TABLE_STORAGE_KEY);
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const setTableNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return false;
  localStorage.setItem(TABLE_STORAGE_KEY, String(parsed));
  return true;
};

export const clearTableNumber = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TABLE_STORAGE_KEY);
};
