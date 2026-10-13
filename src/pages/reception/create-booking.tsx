import { ErrorBanner } from '@/components/feedback';
import { useAvailability, useReceptionCreateBooking } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatMoney } from '@/lib/format';
import { addDaysISO, formatStayRange, nightsBetween, todayISO } from '@/lib/dates';
import { newIdempotencyKey } from '@/lib/id';
import { appConfig } from '@/config/appConfig';
import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

const schema = z.object({
  checkInDate: z.string().min(10, 'Select a check-in date'),
  checkOutDate: z.string().min(10, 'Select a check-out date'),
  adults: z.string(),
  children: z.string(),
  firstName: z.string().min(2, 'Enter the guest first name'),
  lastName: z.string().min(2, 'Enter the guest last name'),
  phoneNumber: z.string().min(8, 'Enter a valid phone number'),
});
type FormValues = z.infer<typeof schema>;

export default function ReceptionCreateBookingPage() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  // Rendered under both the reception and admin consoles; return to the one we
  // were launched from.
  const bookingsBase = pathname.startsWith('/admin') ? '/admin/bookings' : '/reception/bookings';
  const [idempotencyKey] = useState(() => newIdempotencyKey());
  const [qty, setQty] = useState<Record<string, number>>({});
  const createBooking = useReceptionCreateBooking(idempotencyKey);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkInDate: todayISO(),
      checkOutDate: addDaysISO(todayISO(), 1),
      adults: '2',
      children: '0',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
  });
  const values = form.watch();

  const range: DateRange | undefined = useMemo(
    () => (values.checkInDate ? { from: new Date(values.checkInDate), to: values.checkOutDate ? new Date(values.checkOutDate) : undefined } : undefined),
    [values.checkInDate, values.checkOutDate],
  );

  const availabilityQuery = useAvailability(
    {
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      adults: Number(values.adults),
      children: Number(values.children),
      rooms: 1,
    },
    !!values.checkInDate && !!values.checkOutDate,
  );
  const availability = availabilityQuery.data;
  const nights = values.checkInDate && values.checkOutDate ? Math.max(1, nightsBetween(values.checkInDate, values.checkOutDate)) : 1;

  const totalSelected = Object.values(qty).reduce((a, b) => a + b, 0);
  const changeQty = (roomTypeId: string, available: number, delta: number) => {
    setQty((prev) => {
      const current = prev[roomTypeId] ?? 0;
      const remaining = Math.max(0, appConfig.maxRoomsPerBooking - (totalSelected - current));
      const nextValue = Math.min(Math.min(available, current + remaining), Math.max(0, current + delta));
      return { ...prev, [roomTypeId]: nextValue };
    });
  };

  const selectedLines = (availability?.roomTypes ?? []).filter((r) => (qty[r.roomTypeId] ?? 0) > 0).map((r) => ({
    roomTypeId: r.roomTypeId,
    name: r.name,
    pricePerNight: r.pricePerNight,
    quantity: qty[r.roomTypeId],
  }));
  const estimatedTotal = selectedLines.reduce((sum, l) => sum + l.pricePerNight * l.quantity * nights, 0);

  const handleSubmit = form.handleSubmit((v) => {
    if (selectedLines.length === 0) {
      toast.error('Select at least one room');
      return;
    }
    createBooking.mutate(
      {
        checkInDate: v.checkInDate,
        checkOutDate: v.checkOutDate,
        adults: Number(v.adults),
        children: Number(v.children),
        guest: { firstName: v.firstName.trim(), lastName: v.lastName.trim(), phoneNumber: v.phoneNumber.trim() },
        rooms: selectedLines.map((l) => ({ roomTypeId: l.roomTypeId, quantity: l.quantity })),
      },
      {
        onSuccess: (booking) => {
          toast.success(`Booking created`);
          nav(`${bookingsBase}/${booking.id}`, { replace: true });
        },
        onError: () => toast.error('Could not create the booking'),
      },
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-2">New walk-in booking</h1>
        <p className="text-sm text-muted-foreground">Reserve rooms for guests who have arrived at the hotel.</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <Card>
            <CardContent className="space-y-6 p-8">
              <h3 className="heading-3">Stay</h3>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label>Dates</Label>
                  <DateRangePicker
                    value={range}
                    min={new Date(todayISO())}
                    onChange={(r) => {
                      form.setValue('checkInDate', todayISOFromDate(r?.from));
                      form.setValue('checkOutDate', todayISOFromDate(r?.to));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <Select value={values.adults} onValueChange={(v) => form.setValue('adults', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <Select value={values.children} onValueChange={(v) => form.setValue('children', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {availabilityQuery.isError ? <ErrorBanner message="We couldn't check availability for those dates." retry={() => availabilityQuery.refetch()} /> : null}

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Room types</p>
                {(availability?.roomTypes ?? []).map((room) => (
                  <div key={room.roomTypeId} className="flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{room.name}</p>
                      <p className="text-sm text-muted-foreground">{room.bedType} · Up to {room.maximumOccupancy} guests · {formatMoney(room.pricePerNight)} / night</p>
                      <p className="text-xs text-muted-foreground">{room.availableRooms} available for those dates</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => changeQty(room.roomTypeId, room.availableRooms, -1)}>−</Button>
                      <span className="w-8 text-center tabular-nums">{qty[room.roomTypeId] ?? 0}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => changeQty(room.roomTypeId, room.availableRooms, 1)}>+</Button>
                    </div>
                  </div>
                ))}
                {availability && availability.roomTypes.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No rooms available for those dates.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-8">
              <div className="space-y-1">
                <h3 className="heading-3">Guest</h3>
                <p className="text-sm text-muted-foreground">Walk-in guests don&apos;t receive emails. The booking summary will be sent to your email.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input {...form.register('firstName')} />
                  {form.formState.errors.firstName ? <p className="text-xs text-destructive-text">{form.formState.errors.firstName.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input {...form.register('lastName')} />
                  {form.formState.errors.lastName ? <p className="text-xs text-destructive-text">{form.formState.errors.lastName.message}</p> : null}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Phone number</Label>
                  <Input {...form.register('phoneNumber')} />
                  {form.formState.errors.phoneNumber ? <p className="text-xs text-destructive-text">{form.formState.errors.phoneNumber.message}</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="lg:sticky lg:top-24">
            <CardContent className="space-y-6 p-8">
              <h3 className="heading-3">Summary</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{values.checkInDate && values.checkOutDate ? formatStayRange(values.checkInDate, values.checkOutDate) : 'Select your dates'}</p>
                <p>{nights} {nights === 1 ? 'night' : 'nights'} · {values.adults} adults · {values.children} children</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {selectedLines.length === 0 ? (
                  <p className="text-muted-foreground">No rooms selected yet.</p>
                ) : (
                  selectedLines.map((l) => (
                    <div key={l.roomTypeId} className="flex items-center justify-between">
                      <span>{l.quantity} × {l.name}</span>
                      <span>{formatMoney(l.pricePerNight * l.quantity * nights)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <p className="font-semibold text-foreground">Total</p>
                <p className="text-xl font-semibold text-primary">{formatMoney(estimatedTotal)}</p>
              </div>
              <Button className="w-full" disabled={selectedLines.length === 0 || createBooking.isPending} onClick={handleSubmit}>
                {createBooking.isPending ? 'Creating…' : 'Create booking'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function todayISOFromDate(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}