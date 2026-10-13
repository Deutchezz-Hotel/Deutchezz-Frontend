import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { HotelSettings } from '@/types';

export default function AdminSettingsPage() {
  const query = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [form, setForm] = useState<HotelSettings | null>(null);

  useEffect(() => {
    if (query.data) setForm({ ...query.data });
  }, [query.data]);

  if (query.isLoading) return <PageSkeleton rows={4} />;
  if (query.isError) return <ErrorBanner message="We couldn't load the settings" retry={() => query.refetch()} />;
  if (!form) return null;

  const save = () => {
    update.mutate(form, {
      onSuccess: () => toast.success('Settings saved'),
      onError: () => toast.error('Could not save the settings'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2">Settings</h1>
        <p className="text-sm text-muted-foreground">Hotel details shown across the site and in confirmations.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Hotel details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Hotel name, address and contact details are configured in the app shell. Only the
            fields below are stored by the API.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hotel name</Label>
              <Input value={form.hotelName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} disabled />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Check-in time</Label>
              <Input value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} placeholder="14:00" />
            </div>
            <div className="space-y-2">
              <Label>Check-out time</Label>
              <Input value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} placeholder="12:00" />
            </div>
            <div className="space-y-2">
              <Label>Max rooms per booking</Label>
              <Input type="number" min={1} value={form.maxRoomsPerBooking} onChange={(e) => setForm({ ...form, maxRoomsPerBooking: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Cancellation window (hours)</Label>
              <Input
                type="number"
                min={0}
                value={form.cancellationWindowHours ?? 0}
                onChange={(e) => setForm({ ...form, cancellationWindowHours: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Payment rules</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label>Require full payment at check-in</Label>
                  <p className="text-xs text-muted-foreground">Refuse check-in while the balance is outstanding.</p>
                </div>
                <Switch
                  checked={form.requireFullPaymentAtCheckIn ?? false}
                  onCheckedChange={(checked) => setForm({ ...form, requireFullPaymentAtCheckIn: checked })}
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label>Require payment before check-out</Label>
                  <p className="text-xs text-muted-foreground">Refuse check-out while the balance is outstanding.</p>
                </div>
                <Switch
                  checked={form.requirePaymentBeforeCheckOut ?? false}
                  onCheckedChange={(checked) => setForm({ ...form, requirePaymentBeforeCheckOut: checked })}
                />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Check-out rules</h3>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label>Early check-out requires an administrator</Label>
                <p className="text-xs text-muted-foreground">A receptionist cannot check a guest out before the scheduled check-out time; an administrator can.</p>
              </div>
              <Switch
                checked={form.earlyCheckOutRequiresAdmin ?? false}
                onCheckedChange={(checked) => setForm({ ...form, earlyCheckOutRequiresAdmin: checked })}
              />
            </div>
          </div>
          <Button onClick={save} disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save settings'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}