import { PageHero } from '@/components/branding';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { usePublicRoomTypes } from '@/hooks/queries';
import { formatMoney } from '@/lib/format';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BedDouble, Users } from 'lucide-react';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: types, isLoading, error, refetch } = usePublicRoomTypes();
  const type = types?.find((t) => t.id === id);

  return (
    <>
      <PageHero
        eyebrow={type?.name ?? 'Room'}
        title={<>Space to <em className="font-serif italic">unwind.</em></>}
        description={type?.description ?? 'Loading room details...'}
      />
      <section className="section-pad container-x">
        {isLoading ? <PageSkeleton /> : null}
        {error ? <ErrorBanner message="Unable to load room details" retry={refetch} /> : null}
        {type ? (
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink-100">
              {type.imageUrls[0] ? (
                <img src={type.imageUrls[0]} alt={type.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="heading-2">{type.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-ink-600">
                    <span className="inline-flex items-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      {type.bedType}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Up to {type.maximumOccupancy} guests
                    </span>
                  </div>
                </div>
                <p className="text-xl font-semibold text-forest-700">{formatMoney(type.basePrice)} / night</p>
              </div>
              <p className="max-w-2xl text-ink-700">{type.description}</p>
              {type.features.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-semibold text-ink-900">Included</p>
                  <ul className="grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
                    {type.features.map((f) => (
                      <li key={f} className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Button asChild size="lg" className="group">
                <Link to="/book">
                  Check availability
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <ErrorBanner message="Room not found" retry={refetch} />
        )}
      </section>
    </>
  );
}
