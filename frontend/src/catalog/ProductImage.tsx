import { useEffect, useState } from "react";
import { ImageIcon } from "../components/icons";

/**
 * A product's image, or a neutral fallback.
 *
 * The caller owns the box — pass its size and shape through `className`; this
 * component just fills it. The fallback (a muted block with an icon) shows in
 * two cases that should look identical: `src` is null (product never had an
 * image), or the URL failed to load (a stored `imageUrl` can rot). Neither is a
 * broken page, so neither should read as one.
 *
 * `alt` is only attached to the real <img>. The fallback is decorative — every
 * place this renders, the product name sits right next to it.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  fallbackIconClassName = "text-xl",
}: {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Clear a prior load failure when the URL changes — the component instance can
  // be reused across products (client-side nav on the detail page).
  useEffect(() => setFailed(false), [src]);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-surface-muted ${className}`}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true" className={`text-ink-faint ${fallbackIconClassName}`}>
          <ImageIcon />
        </span>
      )}
    </div>
  );
}
