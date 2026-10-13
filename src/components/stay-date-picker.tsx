import { format, parseISO } from 'date-fns';
import { formatTime12h, timeSlots, type StayWindowInput } from '@/lib/dates';
import { useStayPolicy } from '@/hooks/queries';
import { DEFAULT_STAY_POLICY } from '@/config/stayPolicy';
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
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (time: string) => void;
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
            <SelectItem key={slot} value={slot}>
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
  isStaffWalkIn = false,
  className,
}: {
  value: StayWindowInput;
  onChange: (next: StayWindowInput) => void;
  /** Walk-ins may book a check-in today; the backend floors it to the slot grid. */
  isStaffWalkIn?: boolean;
  className?: string;
}) {
  const { data } = useStayPolicy();
  const policy = data ?? DEFAULT_STAY_POLICY;
  const checkInSlots = timeSlots(policy.earliestCheckInTime, policy.latestCheckInTime, policy.timeSlotMinutes);
  const checkOutSlots = timeSlots(policy.earliestCheckOutTime, policy.latestCheckOutTime, policy.timeSlotMinutes);
  const min = new Date();

  function setCheckInDate(iso: string) {
    const next: StayWindowInput = { ...value, checkInDate: iso };
    if (!next.checkOutDate || next.checkOutDate <= iso) {
      const d = isoToDate(iso)!;
      next.checkOutDate = dateToIso(new Date(d.getTime() + 86_400_000));
    }
    onChange(next);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField label="Check-in date" value={value.checkInDate} min={isStaffWalkIn ? undefined : min} onChange={setCheckInDate} />
        <TimeField label="Check-in time" value={value.checkInTime} options={checkInSlots} onChange={(t) => onChange({ ...value, checkInTime: t })} />
        <DateField
          label="Check-out date"
          value={value.checkOutDate}
          min={isoToDate(value.checkInDate) ?? min}
          onChange={(iso) => onChange({ ...value, checkOutDate: iso })}
        />
        <TimeField label="Check-out time" value={value.checkOutTime} options={checkOutSlots} onChange={(t) => onChange({ ...value, checkOutTime: t })} />
      </div>
      <p className="text-xs text-muted-foreground">
        {`Check-in from ${formatTime12h(policy.defaultCheckInTime)} · check-out by ${formatTime12h(policy.defaultCheckOutTime)}`}
      </p>
    </div>
  );
}
