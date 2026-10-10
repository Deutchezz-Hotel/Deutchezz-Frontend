import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select dates',
  className,
  min,
}: {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  min?: Date;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value?.from && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>{format(value.from, 'dd MMM yyyy')} — {format(value.to, 'dd MMM yyyy')}</>
            ) : (
              format(value.from, 'dd MMM yyyy')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          disabled={min ? { before: min } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  min,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  min?: Date;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd MMM yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} disabled={min ? { before: min } : undefined} />
      </PopoverContent>
    </Popover>
  );
}
