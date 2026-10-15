import { useEffect, useState } from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fullAddress, getDirectionsUrl, getEmbedSrc, getOpenUrl } from '@/lib/maps';
import { cn } from '@/lib/utils';

function MapActions({ layout }: { layout: 'row' | 'center' }) {
  return (
    <div
      className={cn(
        'flex gap-3',
        layout === 'row'
          ? 'flex-col sm:flex-row sm:items-center sm:justify-between'
          : 'flex-wrap items-center justify-center',
      )}
    >
      <a
        href={getOpenUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md px-1 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Open in Google Maps
      </a>
      <Button asChild size="sm">
        <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
          <Navigation className="mr-2 h-4 w-4" aria-hidden="true" />
          Get directions
        </a>
      </Button>
    </div>
  );
}

/**
 * Embedded Google Map card. No API key or SDK is required �?" the iframe points
 * at a plain Google Maps embed URL (see `src/lib/maps.ts`). When the embed
 * cannot load, a visible fallback shows the address and an "Open in Google
 * Maps" link.
 *
 * NOTE: if a Content-Security-Policy is ever introduced, its `frame-src`
 * directive must allow `https://www.google.com` or the map will not render.
 */
export function HotelMap({ className }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const timeout = window.setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [loaded]);

  const showFallback = failed && !loaded;

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      <div className="relative h-[320px] w-full sm:h-[420px]">
        {showFallback ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
            <MapPin className="h-6 w-6 text-gold" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-ink-900">We couldn&rsquo;t load the map</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">{fullAddress()}</p>
            </div>
            <MapActions layout="center" />
          </div>
        ) : (
          <>
            <iframe
              src={getEmbedSrc()}
              title="Map showing the location of Deutchezz Hotel Ispahan"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className="h-full w-full border-0"
            />
            {!loaded ? (
              <Skeleton
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full rounded-none"
              />
            ) : null}
          </>
        )}
      </div>
      {showFallback ? null : (
        <div className="border-t p-4">
          <MapActions layout="row" />
        </div>
      )}
    </div>
  );
}
