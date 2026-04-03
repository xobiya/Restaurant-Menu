import { useMemo, useState } from 'react';
import { buildResponsiveSrcSet, optimizeImageUrl } from '../../lib/images';

function Placeholder({ alt, className }) {
  return (
    <div
      className={`${className} flex items-center justify-center bg-surfaceSoft text-textMuted`}
      aria-label={alt || 'Image unavailable'}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.3em]">
        {(alt || 'Menu').slice(0, 2)}
      </span>
    </div>
  );
}

export default function SmartImage({
  src,
  alt,
  className = '',
  width = 720,
  sizes = '100vw',
}) {
  const [failed, setFailed] = useState(false);

  const optimizedSrc = useMemo(() => optimizeImageUrl(src, { width }), [src, width]);
  const srcSet = useMemo(() => buildResponsiveSrcSet(src), [src]);

  if (!src || failed) {
    return <Placeholder alt={alt} className={className} />;
  }

  return (
    <img
      src={optimizedSrc || src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
