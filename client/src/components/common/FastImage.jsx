import { useMemo, useState } from 'react';
import { buildResponsiveSrcSet, optimizeImageUrl } from '../../lib/images';

export default function FastImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  sizes = '(max-width: 768px) 50vw, 33vw',
  priority = false,
  width = 720,
}) {
  const [loaded, setLoaded] = useState(false);

  const optimizedSrc = useMemo(
    () => optimizeImageUrl(src, { width, quality: priority ? 78 : 72 }),
    [src, width, priority]
  );
  const srcSet = useMemo(() => buildResponsiveSrcSet(src), [src]);

  if (!src) return null;

  return (
    <div className={`relative ${wrapperClassName}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/10" />}
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </div>
  );
}
