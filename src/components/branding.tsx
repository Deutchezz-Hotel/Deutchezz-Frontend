import { appConfig } from '@/config/appConfig';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BrandLink() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src={appConfig.logoUrl} alt="Deutchezz Hotel Ispahan" className="h-10 w-10" />
      <div className="flex flex-col leading-none">
        <span className="font-semibold tracking-widest text-ink-900">DEUTCHEZZ</span>
        <span className="text-xs tracking-[0.3em] text-ink-600">HOTEL ISPAHAN</span>
      </div>
    </Link>
  );
}

export function PageHero({ eyebrow, title, description, className }: { eyebrow: string; title: React.ReactNode; description: React.ReactNode; className?: string }) {
  return (
    <section className={cn('section-pad container-x text-center', className)}>
      <p className="eyebrow mx-auto mb-4">{eyebrow}</p>
      <h1 className="heading-1 mx-auto mb-6 max-w-4xl">{title}</h1>
      <p className="mx-auto max-w-2xl text-lg text-ink-600">{description}</p>
    </section>
  );
}

export function CtaButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Button asChild size="lg" className="group">
      <Link to={to}>
        {children}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}