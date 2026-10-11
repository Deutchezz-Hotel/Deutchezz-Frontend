import { BedDouble, Clock, MapPin } from 'lucide-react';
import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { AddressBlock } from '@/components/shared';

const values = [
  {
    icon: BedDouble,
    title: 'Comfortable rooms',
    text: 'Well-appointed rooms designed for deep rest, considered work, and unhurried mornings.',
  },
  {
    icon: Clock,
    title: 'Warm, easy service',
    text: 'A front desk that remembers your name and a team that anticipates the little things.',
  },
  {
    icon: MapPin,
    title: 'A central address',
    text: 'Minutes from the heart of Jos, with the calm of our own quiet grounds to return to.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The hotel"
        title={<>A sense of place, <em className="italic">beautifully held.</em></>}
        description="Deutchezz Hotel Ispahan is a warm, modern retreat for experiencing Jos differently — with room to slow down, focus, and feel genuinely at home."
      />
      <section className="section-pad container-x">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal className="space-y-6">
            <p className="max-w-2xl text-lg text-ink-700">
              From the first welcome to the last goodbye, every moment of your stay is designed to feel
              effortless. Our address places you at the pulse of the city, while our interiors offer a calm
              sanctuary to return to.
            </p>
            <p className="max-w-2xl text-ink-700">
              Each room balances the warmth of local craft with the considered calm of a modern hotel —
              crisp linens, thoughtful lighting, and the quiet hush of a space made for slowing down.
            </p>
            <AddressBlock />
          </Reveal>
          <Reveal direction="right" delay={120} className="relative">
            <img
              src="/images/hotel_view.jpg"
              alt="The facade and grounds of Deutchezz Hotel Ispahan"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
            <div className="glass absolute -bottom-6 left-6 right-6 rounded-xl p-4 sm:-left-6 sm:right-auto sm:max-w-sm">
              <p className="text-lg font-semibold text-ink-900">Deutchezz Hotel Ispahan</p>
              <p className="mt-1 text-sm text-ink-600">Where every stay begins with a considered welcome.</p>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="bg-milk">
        <div className="section-pad container-x">
          <Reveal>
            <p className="eyebrow">What we value</p>
            <h2 className="heading-2 mt-3">Small details, held well</h2>
          </Reveal>
          <Reveal delay={80} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
