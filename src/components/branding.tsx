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

export function PageHero({
  eyebrow,
  title,
  description,
  className,
  imageUrl,
  imageAlt = '',
  action,
  titleClassName,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
  imageUrl?: string;
  imageAlt?: string;
  action?: React.ReactNode;
  titleClassName?: string;
}) {
  if (imageUrl) {
    return (
      <section className={cn('relative isolate flex min-h-[70vh] items-center overflow-hidden', className)}>
        <img
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/70 via-ink-950/55 to-ink-950/75" />
        <div className="container-x relative py-24 text-center sm:py-32">
          <p className="eyebrow-light mx-auto mb-4">{eyebrow}</p>
          <h1 className={cn('heading-1 mx-auto mb-6 max-w-4xl text-white', titleClassName)}>{title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-white/85">{description}</p>
          {action ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{action}</div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('border-b border-forest-100 bg-milk', className)}>
      <div className="section-pad container-x text-center">
        <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
        <p className="eyebrow mx-auto mb-4">{eyebrow}</p>
        <h1 className={cn('heading-1 mx-auto mb-6 max-w-4xl', titleClassName)}>{title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-ink-600">{description}</p>
        {action ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{action}</div>
        ) : null}
      </div>
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