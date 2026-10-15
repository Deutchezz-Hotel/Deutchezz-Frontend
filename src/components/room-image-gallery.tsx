import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

/**
 * Shows every uploaded image for a room type: a large lead image plus a
 * thumbnail strip for selecting the rest. A single image renders without
 * thumbnails, and an empty list falls back to a neutral placeholder.
 */
export function RoomImageGallery({ images, alt, className }: RoomImageGalleryProps) {
  const [active, setActive] = useState(0);
  const total = images.length;
  const current = total === 0 ? 0 : Math.min(active, total - 1);

  if (total === 0) {
    return (
      <div
        role="img"
        aria-label={`No images available for ${alt}`}
        className={cn('flex aspect-[4/3] items-center justify-center rounded-xl bg-muted text-muted-foreground', className)}
      >
        <ImageIcon className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        <img
          src={images[current]}
          alt={total > 1 ? `${alt} — image ${current + 1} of ${total}` : alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      {total > 1 ? (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((url, index) => (
            <li key={`${url}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${total}`}
                aria-current={index === current ? 'true' : undefined}
                className={cn(
                  'block aspect-square w-full overflow-hidden rounded-lg border transition-opacity',
                  index === current ? 'border-primary ring-2 ring-ring' : 'border-border opacity-80 hover:opacity-100',
                )}
              >
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
