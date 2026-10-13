import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { ErrorBanner } from '@/components/feedback';
import { useAvailability, usePublicRoomTypes } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatMoney } from '@/lib/format';
import { addDaysISO, formatStayRange, nightsBetween, todayISO } from '@/lib/dates';
import { newIdempotencyKey } from '@/lib/id';
import { appConfig } from '@/config/appConfig';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DateRange } from 'react-day-picker';
import type { BookingDraft, BookingFlowState } from '@/features/booking/types';
import { toast } from 'sonner';

const schema = z.object({
  checkInDate: z.string().min(10, 'Select a check-in date'),
  checkOutDate: z.string().min(10, 'Select a check-out date'),
  adults: z.string(),
  children: z.string(),
  rooms: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function BookPage() {
  const nav = useNavigate();
  const { isLoading: typesLoading, error: typesError, refetch } = usePublicRoomTypes();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [idempotencyKey] = useState(() => newIdempotencyKey());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkInDate: todayISO(),
      checkOutDate: addDaysISO(todayISO(), 1),
      adults: '2',
      children: '0',
      rooms: '1',
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
      rooms: Number(values.rooms),
    },
    !!values.checkInDate && !!values.checkOutDate,
  );

  const availability = availabilityQuery.data;
  const nights = values.checkInDate && values.checkOutDate ? Math.max(1, nightsBetween(values.checkInDate, values.checkOutDate)) : 1;

  // Clamp any chosen quantities to the latest availability.
  useEffect(() => {
    if (!availability) return;
    setQty((prev) => {
      const next: Record<string, number> = {};
      for (const [id, count] of Object.entries(prev)) {
        const room = availability.roomTypes.find((r) => r.roomTypeId === id);
        next[id] = Math.min(count, room?.availableRooms ?? 0);
      }
      return next;
    });
  }, [availability]);

  const totalSelected = Object.values(qty).reduce((a, b) => a + b, 0);

  const changeQty = (roomTypeId: string, availableRooms: number, delta: number) => {
    setQty((prev) => {
      const current = prev[roomTypeId] ?? 0;
      const remaining = Math.max(0, appConfig.maxRoomsPerBooking - (totalSelected - current));
      const upper = Math.min(availableRooms, current + remaining);
      const nextValue = Math.min(upper, Math.max(0, current + delta));
      return { ...prev, [roomTypeId]: nextValue };
    });
  };

  const selectedLines = (availability?.roomTypes ?? [])
    .filter((r) => (qty[r.roomTypeId] ?? 0) > 0)
    .map((r) => ({
      roomTypeId: r.roomTypeId,
      name: r.name,
      pricePerNight: r.pricePerNight,
      quantity: qty[r.roomTypeId],
    }));

  const estimatedTotal = selectedLines.reduce((sum, l) => sum + l.pricePerNight * l.quantity * nights, 0);

  const handleContinue = form.handleSubmit((v) => {
    if (selectedLines.length === 0) {
      toast.error('Select at least one room to continue');
      return;
    }
    const draft: BookingDraft = {
      request: {
        checkInDate: v.checkInDate,
        checkOutDate: v.checkOutDate,
        adults: Number(v.adults),
        children: Number(v.children),
        guest: { firstName: '', lastName: '', email: '', phoneNumber: '' },
        rooms: selectedLines.map((l) => ({ roomTypeId: l.roomTypeId, quantity: l.quantity })),
        specialRequests: null,
      },
      lines: selectedLines,
      nights,
    };
    const state: BookingFlowState = { draft, idempotencyKey };
    nav('/booking/guest-details', { state });
  });

  return (
    <>
      <PageHero
        eyebrow="Reserve your stay"
        title={<>Make space for <em className="italic">something good.</em></>}
        description="Choose your dates, then pick room types. Your reservation can include multiple room types."
      />
      <section className="section-pad container-x grid gap-10 lg:grid-cols-12">
        <Reveal className="space-y-8 lg:col-span-8">
          <Card>
            <CardContent className="space-y-6 p-8">
              <h3 className="heading-3">Stay details</h3>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-sm font-medium text-foreground">Dates</label>
                  <DateRangePicker
                    value={range}
                    min={new Date(todayISO())}
                    onChange={(r) => {
                      form.setValue('checkInDate', r?.from ? todayISOFromDate(r.from) : '', { shouldValidate: true });
                      form.setValue('checkOutDate', r?.to ? todayISOFromDate(r.to) : '', { shouldValidate: true });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Adults</label>
                  <Select value={values.adults} onValueChange={(v) => form.setValue('adults', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Children</label>
                  <Select value={values.children} onValueChange={(v) => form.setValue('children', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="heading-3">Room types</h3>
                {availabilityQuery.isFetching ? <p className="text-sm text-muted-foreground">Checking availability…</p> : null}
              </div>

              {availabilityQuery.isError ? (
                <ErrorBanner message="We couldn't check availability for those dates. Please adjust your search." retry={() => availabilityQuery.refetch()} />
              ) : null}
              {typesError ? <ErrorBanner message="Unable to load room types" retry={() => refetch()} /> : null}

              {typesLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}
                </div>
              ) : null}

              <div className="space-y-4">
                {(availability?.roomTypes ?? []).map((room) => (
                  <div key={room.roomTypeId} className="flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      {room.imageUrls[0] ? (
                        <img src={room.imageUrls[0]} alt="" className="hidden h-20 w-28 rounded-lg object-cover sm:block" />
                      ) : null}
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{room.name}</p>
                        <p className="text-sm text-muted-foreground">{room.bedType} · Up to {room.maximumOccupancy} guests</p>
                        <p className="text-sm font-medium text-primary">{formatMoney(room.pricePerNight)} / night</p>
                        <p className="text-xs text-muted-foreground">{room.availableRooms} available for your dates</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="sm" aria-label={`Remove one ${room.name}`} onClick={() => changeQty(room.roomTypeId, room.availableRooms, -1)}>
                        −
                      </Button>
                      <span className="w-8 text-center tabular-nums">{qty[room.roomTypeId] ?? 0}</span>
                      <Button type="button" variant="outline" size="sm" aria-label={`Add one ${room.name}`} onClick={() => changeQty(room.roomTypeId, room.availableRooms, 1)}>
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {availability && availability.roomTypes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No rooms are available for those dates. Try different dates or fewer rooms.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-4">
          <Card className="lg:sticky lg:top-24">
            <CardContent className="space-y-6 p-8">
              <h3 className="heading-3">Reservation summary</h3>
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
                <p className="font-semibold text-foreground">Estimated total</p>
                <p className="text-xl font-semibold text-primary">{formatMoney(estimatedTotal)}</p>
              </div>
              <p className="text-xs text-muted-foreground">This is an estimate. The hotel confirms the final total when your booking is placed.</p>
              <Button className="w-full" disabled={selectedLines.length === 0} onClick={handleContinue}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </>
  );
}

/** Convert a Date to a local "yyyy-MM-dd" string (no UTC shift). */
function todayISOFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
