const getLocale = (language) => (language === 'am' ? 'am-ET' : 'en-ET');

export const formatCurrency = (value, language = 'en') => {
  try {
    return new Intl.NumberFormat(getLocale(language), {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `ETB ${(Number(value) || 0).toFixed(2)}`;
  }
};

export const formatDateTime = (value, language = 'en') => {
  if (!value) return 'N/A';

  try {
    return new Intl.DateTimeFormat(getLocale(language), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};
