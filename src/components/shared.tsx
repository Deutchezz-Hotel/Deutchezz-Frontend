import { appConfig } from '@/config/appConfig';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

/**
 * Accessible whole-row link for tables and lists. Place inside a `relative`
 * row/cell: the link stretches across the row while remaining keyboard-focusable.
 */
export function RowLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} aria-label={label} className="absolute inset-0 z-10 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" />
  );
}

export function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="flex items-start justify-between p-6">
      <div className="space-y-2">
        <p className="text-sm text-ink-600">{label}</p>
        <p className="text-3xl font-semibold text-ink-900">{value}</p>
      </div>
      <div className="rounded-full bg-forest-50 p-3 text-forest-700">
        <Icon className="h-6 w-6" />
      </div>
    </Card>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="heading-2">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function AddressBlock() {
  return (
    <div className="space-y-2 text-sm text-ink-700">
      {appConfig.addressLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <p>{appConfig.phoneNumber}</p>
      <p>{appConfig.email}</p>
    </div>
  );
}
