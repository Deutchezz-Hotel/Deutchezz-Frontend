import { PageHero } from '@/components/branding';
import { AddressBlock } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={<>Come find <em className="font-serif italic">your way in.</em></>}
        description="Questions about a stay? Our team would be delighted to assist."
      />
      <section className="section-pad container-x">
        <Card className="p-10">
          <CardContent className="space-y-6 p-0">
            <p className="text-lg text-ink-700">Deutchezz Hotel Ispahan</p>
            <AddressBlock />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
