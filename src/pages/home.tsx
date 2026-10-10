import { PageHero } from '@/components/branding';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { Card, CardContent } from '@/components/ui/card';
import { usePublicRoomTypes } from '@/hooks/queries';
import { formatMoney } from '@/lib/format';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { data: types, isLoading, error, refetch } = usePublicRoomTypes();

  return (
    <>
      <PageHero
        eyebrow="A considered stay in the heart of Jos"
        title={<>Arrive as you are. <em className="font-serif italic">Stay beautifully.</em></>}
        description="A quietly confident hotel shaped by local warmth, thoughtful design, and the unhurried pleasure of being well looked after."
      />
      <section className="section-pad container-x">
        <h2 className="heading-2 mb-8 text-center">Featured rooms</h2>
        {isLoading ? <PageSkeleton /> : null}
        {error ? <ErrorBanner message="Unable to load room types" retry={refetch} /> : null}
        {types ? (
          <div className="grid gap-6 md:grid-cols-3">
            {types.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                <div className="aspect-[16/9] w-full bg-ink-100">
                  {t.imageUrls[0] ? (
                    <img src={t.imageUrls[0]} alt={t.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="heading-3">{t.name}</h3>
                      <p className="text-sm text-ink-600">{t.bedType} · Up to {t.maximumOccupancy} guests</p>
                    </div>
                    <p className="font-semibold text-forest-700">{formatMoney(t.basePrice)} / night</p>
                  </div>
                  <Link to={`/rooms/${t.id}`} className="inline-flex items-center text-sm font-medium text-forest-700 hover:underline">
                    View details <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
