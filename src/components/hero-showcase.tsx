import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RoomTypeResponse } from '@/types';

type Slide = {
  key: string;
  kind: 'intro' | 'room';
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  price?: string;
  meta?: string;
  href?: string;
};

interface HeroShowcaseProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  introActions: ReactNode;
  rooms?: RoomTypeResponse[];
  fallbackImage?: string;
  intervalMs?: number;
  maxRooms?: number;
}

export function HeroShowcase({
  eyebrow,
  title,
  description,
  introActions,
  rooms = [],
  fallbackImage = '/images/hotel_view.jpg',
  intervalMs = 30000,
  maxRooms = 4,
}: HeroShowcaseProps) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  const slides = useMemo<Slide[]>(() => {
    const intro: Slide = {
      key: 'intro',
      kind: 'intro',
      image: fallbackImage,
      imageAlt: 'Deutchezz Hotel Ispahan',
      eyebrow,
      title,
      description,
    };
    const roomSlides = rooms.slice(0, maxRooms).map<Slide>((room) => ({
      key: room.id,
      kind: 'room',
      image: room.imageUrls[0] ?? fallbackImage,
      imageAlt: room.name,
      eyebrow: 'Room type',
      title: room.name,
      description: room.description,
      price: formatMoney(room.basePrice),
      meta: `${room.bedType} · Up to ${room.maximumOccupancy} guests`,
      href: `/rooms/${room.id}`,
    }));
    return [intro, ...roomSlides];
  }, [eyebrow, title, description, fallbackImage, rooms, maxRooms]);

  const active = slides.length ? index % slides.length : 0;
  const current = slides[active];

  useEffect(() => {
    if (reduced || slides.length <= 1) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => window.clearTimeout(timer);
  }, [index, slides.length, intervalMs, reduced]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured rooms at Deutchezz Hotel Ispahan"
      className="relative isolate flex min-h-[72vh] items-center overflow-hidden bg-ink-950"
    >
      {slides.map((slide, i) => {
        const isActive = i === active;
        return (
          <img
            key={slide.key}
            src={slide.image}
            alt={slide.imageAlt}
            aria-hidden={!isActive}
            className="absolute inset-0 -z-20 h-full w-full object-cover will-change-transform"
            style={{
              transitionProperty: 'opacity, transform',
              transitionDuration: isActive ? `1200ms, ${intervalMs}ms` : '1200ms, 1200ms',
              transitionTimingFunction: 'ease-out, linear',
              opacity: isActive ? 1 : 0,
              transform: isActive && !reduced ? 'scale(1.06)' : 'scale(1)',
            }}
          />
        );
      })}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/75 via-ink-950/60 to-ink-950/80" />

      <div className="container-x relative py-24 text-center sm:py-32">
        <div key={active} className="animate-fade-up motion-reduce:animate-none">
          {current.kind === 'intro' ? (
            <>
              <p className="eyebrow-light mx-auto mb-4">{current.eyebrow}</p>
              <h1 className="heading-1 mx-auto mb-6 max-w-4xl font-display text-white">{current.title}</h1>
              <p className="mx-auto max-w-2xl text-lg text-white/85">{current.description}</p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{introActions}</div>
            </>
          ) : (
            <>
              <p className="eyebrow-light mx-auto mb-4">{current.eyebrow}</p>
              <h1 className="heading-1 mx-auto mb-4 max-w-4xl font-display text-white">{current.title}</h1>
              <p className="mx-auto max-w-2xl text-lg text-white/85">{current.description}</p>
              <p className="mt-6 text-lg font-semibold text-gold-light">
                {current.price}
                <span className="text-sm font-normal text-white/70"> / night</span>
              </p>
              <p className="mt-1 text-sm text-white/70">{current.meta}</p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-gold text-white shadow-lg shadow-ink-950/30 hover:bg-gold-dark">
                  <Link to={current.href ?? '/rooms'}>View this room <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white">
                  <Link to="/book">Reserve your stay</Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {slides.length > 1 ? (
          <div className="mt-12 flex items-center justify-center gap-2.5" aria-label="Hero slides">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-current={i === active ? 'true' : undefined}
                aria-label={`Show slide ${i + 1} of ${slides.length}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  i === active ? 'w-8 bg-gold-light' : 'w-1.5 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
