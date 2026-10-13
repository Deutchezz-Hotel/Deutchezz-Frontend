import { appConfig } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { roleLabel } from '@/lib/format';
import { useAuth } from '@/app/auth';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Activity,
  BedDouble,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';

export interface ConsoleNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface ConsoleNavGroup {
  label: string;
  items: ConsoleNavItem[];
}

interface ConsoleLayoutProps {
  /** Section label shown under the brand in the sidebar. */
  sectionLabel: string;
  /** Nav groups rendered in the sidebar. */
  groups: ConsoleNavGroup[];
  /** Optional per-page search handler for the top bar. */
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  profilePath?: string;
  children?: React.ReactNode;
}

function SidebarNav({ groups, onNavigate, collapsed = false }: { groups: ConsoleNavGroup[]; onNavigate?: () => void; collapsed?: boolean }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((group, index) => (
        <div key={group.label} className="space-y-1">
          {collapsed ? (
            index > 0 ? <div className="mx-2 mb-2 border-t border-border/60" /> : null
          ) : (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {collapsed ? null : <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarLogo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        D
      </span>
    );
  }
  return <img src={appConfig.logoUrl} alt="Deutchezz Hotel Ispahan" className="h-9 w-9" onError={() => setFailed(true)} />;
}

function SidebarHeader({ sectionLabel, collapsed = false }: { sectionLabel: string; collapsed?: boolean }) {
  return (
    <div className={cn('flex min-h-[65px] items-center gap-3 border-b py-4', collapsed ? 'justify-center px-2' : 'px-5')}>
      <SidebarLogo />
      {collapsed ? null : (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-wide text-foreground">Deutchezz</p>
          <p className="text-xs text-muted-foreground">{sectionLabel}</p>
        </div>
      )}
    </div>
  );
}

const SIDEBAR_STORAGE_KEY = 'deutchezz.sidebar';

export function ConsoleLayout({ sectionLabel, groups, onSearch, searchPlaceholder = 'Search...', profilePath, children }: ConsoleLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
  });
  const { pathname } = useLocation();
  const isDashboard = pathname === '/admin' || pathname === '/reception' || pathname === '/dashboard';

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-border/50 bg-card transition-[width] duration-200 md:flex',
          collapsed ? 'w-16' : 'w-60 xl:w-64',
        )}
      >
        <SidebarHeader sectionLabel={sectionLabel} collapsed={collapsed} />
        <SidebarNav groups={groups} collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/50 bg-card px-4 sm:gap-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarHeader sectionLabel={sectionLabel} />
              <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
              <Link to="/">View site</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                      {user?.initials ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-medium text-foreground">
                      {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                    </span>
                    <span className="block text-xs text-muted-foreground">{user ? roleLabel(user.role) : ''}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.email ?? 'Not signed in'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profilePath ? (
                  <DropdownMenuItem asChild>
                    <Link to={profilePath}>
                      <UserRound className="mr-2 h-4 w-4" />
                      My profile
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={pathname} className={isDashboard ? undefined : 'animate-fade-up motion-reduce:animate-none'}>
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* --------------------------- Role configuration --------------------------- */

const customerGroups: ConsoleNavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Reservations',
    items: [{ to: '/dashboard/bookings', label: 'My bookings', icon: CalendarCheck }],
  },
  {
    label: 'Account',
    items: [{ to: '/dashboard/profile', label: 'Profile', icon: UserRound }],
  },
];

const receptionGroups: ConsoleNavGroup[] = [
  {
    label: 'Front desk',
    items: [
      { to: '/reception', label: 'Today', icon: LayoutDashboard, end: true },
      { to: '/reception/bookings', label: 'Bookings', icon: CalendarDays },
    ],
  },
  {
    label: 'Rooms',
    items: [{ to: '/reception/rooms', label: 'Room status', icon: BedDouble }],
  },
  {
    label: 'People',
    items: [{ to: '/reception/guests', label: 'Guests', icon: Users }],
  },
  {
    label: 'Finance',
    items: [{ to: '/reception/payments', label: 'Payments', icon: CreditCard }],
  },
];

const adminGroups: ConsoleNavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
      { to: '/admin/room-types', label: 'Room types', icon: Building2 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
      { to: '/admin/guests', label: 'Guests', icon: Users },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/reports', label: 'Reports', icon: ListChecks },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: UserRound },
      { to: '/admin/staff', label: 'Staff', icon: ShieldCheck },
      { to: '/admin/activity', label: 'Activity log', icon: Activity },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function CustomerLayout() {
  return <ConsoleLayout sectionLabel="Guest portal" groups={customerGroups} searchPlaceholder="Search your bookings..." />;
}

export function ReceptionLayout() {
  return <ConsoleLayout sectionLabel="Front desk" groups={receptionGroups} searchPlaceholder="Search bookings, guests, rooms..." profilePath="/reception/profile" />;
}

export function AdminLayout() {
  return <ConsoleLayout sectionLabel="Administration" groups={adminGroups} searchPlaceholder="Search rooms, bookings, staff..." profilePath="/admin/profile" />;
}
