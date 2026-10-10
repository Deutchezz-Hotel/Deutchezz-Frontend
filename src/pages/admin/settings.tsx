import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <p className="text-sm text-ink-600">Hotel details shown across the site and in confirmations.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Hotel details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hotel name</Label>
              <Input value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address line 1</Label>
            <Input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Address line 2</Label>
            <Input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Check-in time</Label>
              <Input value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Check-out time</Label>
              <Input value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max rooms per booking</Label>
              <Input type="number" min={1} value={form.maxRoomsPerBooking} onChange={(e) => setForm({ ...form, maxRoomsPerBooking: Number(e.target.value) })} />
            </div>
          </div>
          <Button onClick={save} disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save settings'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}