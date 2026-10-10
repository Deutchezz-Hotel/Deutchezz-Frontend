import { appConfig } from '@/config/appConfig';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={appConfig.logoUrl} alt="Deutchezz Hotel Ispahan logo" className="h-10 w-10" />
            <div className="flex flex-col leading-none">
              <span className="font-semibold tracking-widest text-ink-900">DEUTCHEZZ</span>
              <span className="text-xs tracking-[0.3em] text-ink-600">HOTEL ISPAHAN</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <NavLink to="/rooms" className={({ isActive }) => cn('transition-colors', isActive ? 'text-forest-700' : 'text-ink-700 hover:text-forest-700')}>Rooms</NavLink>
            <NavLink to="/about" className={({ isActive }) => cn('transition-colors', isActive ? 'text-forest-700' : 'text-ink-700 hover:text-forest-700')}>The Hotel</NavLink>
            <NavLink to="/contact" className={({ isActive }) => cn('transition-colors', isActive ? 'text-forest-700' : 'text-ink-700 hover:text-forest-700')}>Contact</NavLink>
            <NavLink to="/my-booking" className={({ isActive }) => cn('transition-colors', isActive ? 'text-forest-700' : 'text-ink-700 hover:text-forest-700')}>My Booking</NavLink>
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Sign in <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileOpen ? (
          <nav className="container-x flex flex-col gap-4 py-4 text-sm md:hidden">
            <NavLink to="/rooms" onClick={() => setMobileOpen(false)}>Rooms</NavLink>
            <NavLink to="/about" onClick={() => setMobileOpen(false)}>The Hotel</NavLink>
            <NavLink to="/contact" onClick={() => setMobileOpen(false)}>Contact</NavLink>
            <NavLink to="/my-booking" onClick={() => setMobileOpen(false)}>My Booking</NavLink>
            <Button asChild size="sm" variant="outline" className="self-start">
              <Link to="/login" onClick={() => setMobileOpen(false)}>Sign in <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </nav>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="container-x grid gap-8 py-12 text-sm text-ink-700 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={appConfig.logoUrl} alt="Deutchezz Hotel Ispahan" className="h-9 w-9" />
              <div className="leading-none">
                <p className="font-semibold tracking-widest text-ink-900">DEUTCHEZZ</p>
                <p className="text-xs tracking-[0.25em] text-ink-600">HOTEL ISPAHAN</p>
              </div>
            </div>
            <p className="text-ink-600">A considered stay in the heart of Jos.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-ink-900">Explore</p>
            <Link to="/rooms" className="block hover:text-forest-700">Rooms</Link>
            <Link to="/about" className="block hover:text-forest-700">The Hotel</Link>
            <Link to="/contact" className="block hover:text-forest-700">Contact</Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-ink-900">Find us</p>
            <p className="text-ink-600">{appConfig.addressLines[0]}</p>
            <p className="text-ink-600">{appConfig.addressLines[1]}</p>
            <p className="text-ink-600">{appConfig.addressLines[2]}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-ink-900">Reservations</p>
            <p className="text-ink-600">{appConfig.phoneNumber}</p>
            <p className="text-ink-600">{appConfig.email}</p>
          </div>
        </div>
        <div className="container-x flex flex-col gap-2 border-t py-4 text-xs text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Deutchezz Hotel Ispahan</p>
          <p>Luxury · Comfort · Hospitality</p>
        </div>
      </footer>
    </div>
  );
}