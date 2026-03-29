const UNSPLASH_HOSTS = new Set(['images.unsplash.com', 'source.unsplash.com']);

const asUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isUnsplashUrl = (value) => {
  const parsed = asUrl(value);
  return parsed ? UNSPLASH_HOSTS.has(parsed.hostname) : false;
};

export const optimizeImageUrl = (value, options = {}) => {
  const { width = 720, quality = 72, fit = 'crop' } = options;
  if (!value) return '';

  if (!isUnsplashUrl(value)) {
    return value;
  }

  const parsed = asUrl(value);
  parsed.searchParams.set('auto', 'format');
  parsed.searchParams.set('fit', fit);
  parsed.searchParams.set('q', String(quality));
  parsed.searchParams.set('w', String(width));
  return parsed.toString();
};

export const buildResponsiveSrcSet = (value, widths = [240, 360, 480, 720, 960]) => {
  if (!isUnsplashUrl(value)) return undefined;
  return widths
    .map((width) => `${optimizeImageUrl(value, { width })} ${width}w`)
    .join(', ');
};
