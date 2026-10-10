import { appConfig } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { roleLabel } from '@/lib/format';
import { useAuth } from '@/app/auth';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
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
  children?: React.ReactNode;
}

function SidebarNav({ groups, onNavigate }: { groups: ConsoleNavGroup[]; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-ink-700 hover:bg-milk hover:text-ink-900',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarHeader({ sectionLabel }: { sectionLabel: string }) {
  return (
    <div className="flex items-center gap-3 border-b px-5 py-4">
      <img src={appConfig.logoUrl} alt="" className="h-9 w-9" />
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-wide text-ink-900">Deutchezz</p>
        <p className="text-xs text-muted-foreground">{sectionLabel}</p>
      </div>
    </div>
  );
}

export function ConsoleLayout({ sectionLabel, groups, onSearch, searchPlaceholder = 'Search...', children }: ConsoleLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white lg:flex">
        <SidebarHeader sectionLabel={sectionLabel} />
        <SidebarNav groups={groups} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarHeader sectionLabel={sectionLabel} />
              <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden text-ink-600 sm:inline-flex">
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
                    <span className="block text-sm font-medium text-ink-900">
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
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children ?? <Outlet />}</main>
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
  return <ConsoleLayout sectionLabel="Front desk" groups={receptionGroups} searchPlaceholder="Search bookings, guests, rooms..." />;
}

export function AdminLayout() {
  return <ConsoleLayout sectionLabel="Administration" groups={adminGroups} searchPlaceholder="Search rooms, bookings, staff..." />;
}
