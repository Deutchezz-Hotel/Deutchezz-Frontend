import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { computeDefaultCheckOut, defaultCheckIn, formatTime12h, isCheckInSlotSelectable, lagosNow, nightsBetween, normaliseTime, timeSlots, timeToMinutes, type StayWindowInput } from '@/lib/dates';
import { useStayPolicy } from '@/hooks/queries';
import { DEFAULT_STAY_POLICY } from '@/config/stayPolicy';
import { gracePeriodNote } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type { StayWindowInput };

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function dateToIso(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function DateField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: Date;
  onChange: (iso: string) => void;
}) {
  const date = isoToDate(value);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
          >
            {date ? format(date, 'dd MMM yyyy') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => d && onChange(dateToIso(d))}
            disabled={min ? { before: min } : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TimeField({
  label,
  value,
  options,
  onChange,
  isDisabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (time: string) => void;
  isDisabled?: (time: string) => boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((slot) => (
            <SelectItem key={slot} value={slot} disabled={isDisabled?.(slot) ?? false}>
              {formatTime12h(slot)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Single Lagos-local date + time control ("board moment") with a "Now" shortcut,
 * constrained to the public stay policy's slot grid. Used by the room board.
 */
export function BoardMomentPicker({
  value,
  onChange,
  onNow,
  className,
}: {
  value: { date: string; time: string };
  onChange: (next: { date: string; time: string }) => void;
  onNow: () => void;
  className?: string;
}) {
  const { data } = useStayPolicy();
  const policy = data ?? DEFAULT_STAY_POLICY;

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      <DateField label="Date" value={value.date} onChange={(iso) => onChange({ ...value, date: iso })} />
      <TimeField label="Time" value={value.time} options={timeSlots('00:00', '23:59', policy.timeSlotMinutes)} onChange={(t) => onChange({ ...value, time: t })} />
      <Button type="button" variant="outline" onClick={onNow}>Now</Button>
    </div>
  );
}

/**
 * Shared check-in / check-out date + time control (SoT v1.12). Times are Lagos
 * `"HH:mm"` strings constrained to the public stay policy's slot grid.
 */
export function StayDatePicker({
  value,
  onChange,
  className,
}: {
  value: StayWindowInput;
  onChange: (next: StayWindowInput) => void;
  className?: string;
}) {
  const { data } = useStayPolicy();
  const policy = data ?? DEFAULT_STAY_POLICY;
  const checkInSlots = timeSlots(policy.earliestCheckInTime, policy.latestCheckInTime, policy.timeSlotMinutes);
  const checkOutSlots = timeSlots(policy.earliestCheckOutTime, policy.latestCheckOutTime, policy.timeSlotMinutes);
  const min = new Date();
  const nights = Math.max(1, nightsBetween(value.checkInDate, value.checkOutDate) || 1);
  const checkInMinutes = timeToMinutes(value.checkInTime);
  const isManualCheckOut = normaliseTime(value.checkOutTime) !== normaliseTime(value.checkInTime);

  // Rule 6: track Lagos now so disabled slots refresh and a stale selection is moved forward.
  const [now, setNow] = useState(() => lagosNow());
  const [autoNotice, setAutoNotice] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(lagosNow()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const selectable = isCheckInSlotSelectable(
      value.checkInTime, value.checkInDate === now.date, now.time,
      policy.earliestCheckInTime, policy.latestCheckInTime,
    );
    if (selectable) return;
    const def = defaultCheckIn(now, policy);
    if (def.date === value.checkInDate && def.time === value.checkInTime) return;
    const next = computeDefaultCheckOut(def.date, def.time, nights);
    onChangeRef.current({
      ...value, checkInDate: def.date, checkInTime: def.time,
      checkOutDate: next.checkOutDate, checkOutTime: next.checkOutTime,
    });
    setAutoNotice('Your selected check-in time passed, so we moved it to the next available time.');
  }, [now, value, policy, nights]);

  const checkInMin = isoToDate(now.date) ?? min;
  const checkInIsToday = value.checkInDate === now.date;

  // Rule 2/5: moving check-in recomputes check-out (date + time) from the current nights,
  // resetting any manual check-out time so the new default is visible.
  function setCheckInDate(iso: string) {
    setAutoNotice(null);
    const next = computeDefaultCheckOut(iso, value.checkInTime, nights);
    onChange({ ...value, checkInDate: iso, checkOutDate: next.checkOutDate, checkOutTime: next.checkOutTime });
  }

  function setCheckInTime(time: string) {
    setAutoNotice(null);
    const next = computeDefaultCheckOut(value.checkInDate, time, nights);
    onChange({ ...value, checkInTime: time, checkOutDate: next.checkOutDate, checkOutTime: next.checkOutTime });
  }

  // Rule 3: moving check-out keeps the check-in time unless the guest picked a later one.
  function setCheckOutDate(iso: string) {
    setAutoNotice(null);
    onChange({ ...value, checkOutDate: iso, checkOutTime: isManualCheckOut ? value.checkOutTime : value.checkInTime });
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField label="Check-in date" value={value.checkInDate} min={checkInMin} onChange={setCheckInDate} />
        <TimeField
          label="Check-in time"
          value={value.checkInTime}
          options={checkInSlots}
          isDisabled={(slot) => !isCheckInSlotSelectable(
            slot, checkInIsToday, now.time, policy.earliestCheckInTime, policy.latestCheckInTime)}
          onChange={setCheckInTime}
        />
        <DateField
          label="Check-out date"
          value={value.checkOutDate}
          min={isoToDate(value.checkInDate) ?? min}
          onChange={setCheckOutDate}
        />
        <TimeField
          label="Check-out time"
          value={value.checkOutTime}
          options={checkOutSlots}
          isDisabled={(slot) => checkInMinutes != null && (timeToMinutes(slot) ?? 0) < checkInMinutes}
          onChange={(t) => onChange({ ...value, checkOutTime: t })}
        />
      </div>
      <p className="text-xs text-muted-foreground">{gracePeriodNote(policy.graceHours)}</p>
      {autoNotice ? <p className="text-xs font-medium text-foreground">{autoNotice}</p> : null}
    </div>
  );
}
