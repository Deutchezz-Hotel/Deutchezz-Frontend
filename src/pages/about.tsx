import { PageHero } from '@/components/branding';
import { AddressBlock } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The hotel"
        title={<>A sense of place, <em className="font-serif italic">beautifully held.</em></>}
        description="Deutchezz Hotel Ispahan is a warm, modern retreat for experiencing Jos differently — with room to slow down, focus, and feel genuinely at home."
      />
      <section className="section-pad container-x">
        <Card className="p-10">
          <CardContent className="space-y-6 p-0">
            <p className="max-w-2xl text-lg text-ink-700">
              From the first welcome to the last goodbye, every moment of your stay is designed to feel effortless. Our address places you at the pulse of the city, while our interiors offer a calm sanctuary to return to.
            </p>
            <AddressBlock />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
