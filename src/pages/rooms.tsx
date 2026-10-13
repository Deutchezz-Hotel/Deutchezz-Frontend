import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { usePublicRoomTypes } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';

export default function RoomsPage() {
  const { data: types, isLoading, error, refetch } = usePublicRoomTypes();

  return (
    <>
      <PageHero
        eyebrow="The collection"
        title={<>Rooms that make <em className="italic">staying in</em> feel good.</>}
        description="Four distinctive ways to settle into the city, each with the same promise of ease, warmth and thoughtful attention to detail."
      />
      <section className="section-pad container-x">
        {isLoading ? <PageSkeleton /> : null}
        {error ? <ErrorBanner message="Unable to load rooms" retry={refetch} /> : null}
        {types ? (
          <Reveal delay={80} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {types.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                <div className="aspect-[16/9] w-full bg-muted">
                  {t.imageUrls[0] ? (
                    <img src={t.imageUrls[0]} alt={t.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="heading-3">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">{t.bedType} · Up to {t.maximumOccupancy} guests</p>
                    </div>
                    <p className="font-semibold text-primary">{formatMoney(t.basePrice)} / night</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <Link to={`/rooms/${t.id}`} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                    View details <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </Reveal>
        ) : null}
      </section>
    </>
  );
}
