import { HeroShowcase } from '@/components/hero-showcase';
import { Reveal } from '@/components/reveal';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { AddressBlock, SectionHeader } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePublicRoomTypes } from '@/hooks/queries';
import { formatMoney } from '@/lib/format';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Car,
  Clock4,
  Coffee,
  ConciergeBell,
  MapPin,
  Quote,
  Wifi,
} from 'lucide-react';

const PERKS = [
  { icon: Coffee, title: 'Breakfast included', text: 'A generous morning spread with every stay.' },
  { icon: Wifi, title: 'Complimentary Wi-Fi', text: 'Fast, reliable connection throughout the hotel.' },
  { icon: ConciergeBell, title: 'Concierge service', text: 'A team who knows when to be there — and when to let you be.' },
];

const STANDARDS = [
  { icon: CalendarDays, title: 'Effortless booking', text: 'Clear rates, instant confirmation, no surprises.' },
  { icon: Car, title: 'Secure parking', text: 'Guarded parking on premise for every guest.' },
  { icon: Clock4, title: '24-hour front desk', text: 'Arrive at any hour and feel genuinely looked after.' },
  { icon: BedDouble, title: 'Curated rooms', text: 'Quiet, comfortable rooms designed for rest.' },
];

export default function HomePage() {
  const { data: types, isLoading, error, refetch } = usePublicRoomTypes();

  return (
    <>
      <HeroShowcase
        eyebrow="A considered stay in the heart of Jos"
        title={<>Arrive as you are. <em className="font-serif italic">Stay beautifully.</em></>}
        description="A quietly confident hotel shaped by local warmth, thoughtful design, and the unhurried pleasure of being well looked after."
        rooms={types}
        fallbackImage="/images/hotel_view.jpg"
        introActions={
          <>
            <Button asChild size="lg" className="bg-gold text-white shadow-lg shadow-ink-950/30 hover:bg-gold-dark">
              <Link to="/book">Reserve your stay <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white">
              <Link to="/rooms">Explore rooms</Link>
            </Button>
          </>
        }
      />

      <Reveal className="relative z-10 mx-auto -mt-10 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="glass flex flex-col items-center justify-between gap-6 rounded-2xl p-6 shadow-lg sm:flex-row sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">Plan your stay</p>
              <p className="text-sm text-ink-600">Best available rates, guaranteed</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="bg-forest-700 text-white shadow hover:bg-forest-800">
              <Link to="/book">Check availability <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </Reveal>

      <section className="section-pad container-x">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <p className="eyebrow">Welcome to Deutchezz</p>
            <h2 className="heading-2">A more thoughtful<br /><em className="italic text-forest-700">kind of hotel.</em></h2>
            <p className="max-w-xl text-lg text-ink-600">
              From the first welcome to the last goodbye, every moment of your stay is designed to feel effortless.
              Discover a quiet room, a generous breakfast, and a team who understands when to be there — and when to let you be.
            </p>
            <Link to="/about" className="link-underline inline-flex items-center gap-2 font-medium text-forest-700">
              More about the hotel <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="grid gap-4">
            {PERKS.map((perk, i) => (
              <Reveal key={perk.title} delay={i * 90} className="flex items-start gap-4 rounded-xl border border-forest-100 bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-milk text-gold">
                  <perk.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{perk.title}</p>
                  <p className="text-sm text-ink-600">{perk.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-milk">
        <div className="container-x">
          <Reveal>
            <SectionHeader
              eyebrow="Stay your way"
              title="Rooms with room to breathe."
              action={
                <Button asChild variant="outline" className="whitespace-nowrap border-forest-700/25 text-forest-800 hover:border-gold hover:bg-gold/10">
                  <Link to="/rooms">View all rooms <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              }
            />
          </Reveal>
          {isLoading ? <div className="pt-8"><PageSkeleton rows={3} /></div> : null}
          {error ? <div className="pt-8"><ErrorBanner message="Unable to load room types" retry={refetch} /></div> : null}
          {types ? (
            <Reveal delay={80}>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {types.slice(0, 3).map((t) => (
                  <Card key={t.id} className="group h-full overflow-hidden transition-shadow hover:shadow-xl">
                    <Link to={`/rooms/${t.id}`} className="block aspect-[16/9] w-full overflow-hidden bg-ink-100">
                      {t.imageUrls[0] ? (
                        <img src={t.imageUrls[0]} alt={t.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : null}
                    </Link>
                    <CardContent className="space-y-3 p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="heading-3">{t.name}</h3>
                          <p className="text-sm text-ink-600">{t.bedType} · Up to {t.maximumOccupancy} guests</p>
                        </div>
                        <p className="text-lg font-semibold text-forest-700">{formatMoney(t.basePrice)}<span className="text-xs font-normal text-ink-500"> / night</span></p>
                      </div>
                      <Link to={`/rooms/${t.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-forest-700 hover:text-gold">
                        View details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-ink-950 via-forest-900 to-ink-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="section-pad container-x">
          <Reveal className="text-center">
            <p className="eyebrow-light">The Deutchezz standard</p>
            <h2 className="heading-2 mt-3 text-white">Considered in every <em className="italic text-gold-light">detail.</em></h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STANDARDS.map((item, i) => (
              <Reveal key={item.title} delay={i * 80} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-gold/40 hover:bg-white/10">
                <item.icon className="mb-4 h-7 w-7 text-gold-light" />
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-milk">
        <Reveal className="container-x mx-auto max-w-4xl text-center">
          <Quote className="mx-auto mb-6 h-10 w-10 text-gold" />
          <p className="text-2xl italic leading-relaxed text-ink-900 sm:text-3xl">
            There is a particular ease to a hotel that understands you came to rest.
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-gold">— Deutchezz Hotel Ispahan</p>
        </Reveal>
      </section>

      <section className="section-pad container-x">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <p className="eyebrow">Find us</p>
            <h2 className="heading-2">In the heart of <em className="italic text-forest-700">Jos.</em></h2>
            <p className="max-w-xl text-lg text-ink-600">
              Comfortably placed at the pulse of the city, with calm, considered interiors to return to.
            </p>
            <div className="flex items-start gap-3 rounded-xl border border-forest-100 bg-white p-5 text-sm text-ink-700 shadow-sm">
              <MapPin className="mt-0.5 h-5 w-5 flex-none text-gold" />
              <AddressBlock />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-forest-700 text-white shadow hover:bg-forest-800">
                <Link to="/contact">Get in touch <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-forest-700/25 text-forest-800 hover:border-gold hover:bg-gold/10">
                <Link to="/my-booking">Find your booking</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal direction="left" delay={120} className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-forest-100">
            <img src="/images/hotel_view.jpg" alt="Deutchezz Hotel Ispahan" className="aspect-[4/3] w-full object-cover" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
