import { useEffect, useMemo, useState } from 'react';
import { usePublicRoomTypes, useReceptionAction } from '@/hooks/queries';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney } from '@/lib/format';
import { toApiError } from '@/api';
import { toast } from 'sonner';
import type { BookingResponse, BookingRoomLine } from '@/types';

interface Props {
  booking: BookingResponse | null;
  line: BookingRoomLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Moves some or all of a room line to a different room type before arrival.
 * Availability is verified and re-priced by the backend; any rooms already
 * assigned to the moved line are released (reported in the response).
 */
export function ChangeRoomTypeDialog({ booking, line, open, onOpenChange }: Props) {
  const { changeRoomType } = useReceptionAction();
  const roomTypesQuery = usePublicRoomTypes();
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && line) {
      setNewRoomTypeId('');
      setQuantity(String(line.quantity));
      setError('');
    }
  }, [open, line]);

  const options = useMemo(() => {
    const all = roomTypesQuery.data ?? [];
    if (!line) return all;
    return all.filter((rt) => rt.id !== line.roomTypeId);
  }, [roomTypesQuery.data, line]);

  const submit = () => {
    if (!booking || !line) return;
    const qty = Number(quantity);
    if (!newRoomTypeId) {
      setError('Choose a room type.');
      return;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > line.quantity) {
      setError(`Enter a quantity between 1 and ${line.quantity}.`);
      return;
    }
    setError('');
    changeRoomType.mutate(
      { id: booking.id, request: { bookingRoomTypeId: line.bookingRoomTypeId, newRoomTypeId, quantity: qty } },
      {
        onSuccess: (result) => {
          const released = result.assignmentsCleared;
          toast.success(
            released.length
              ? `Room type changed. Released ${released.join(', ')} — reassign before check-in.`
              : 'Room type changed',
          );
          onOpenChange(false);
        },
        onError: (err) => {
          const api = toApiError(err);
          if (api.problem.code === 'booking.unavailable') {
            setError('That room type is not available for the whole stay.');
          } else if (api.problem.code === 'booking.paid_exceeds_new_total') {
            toast.error('The amount already paid exceeds the new total. Refund or adjust before changing.');
          } else {
            toast.error(api.userMessage);
          }
        },
      },
    );
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>Change room type</FormDialogTitle>
          <p className="text-sm text-muted-foreground">
            {line ? `Move ${line.quantity} × ${line.roomTypeName} to another room type.` : ''}
          </p>
        </FormDialogHeader>
        <FormDialogBody>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="crt-type">New room type</Label>
              <Select value={newRoomTypeId} onValueChange={(v) => { setNewRoomTypeId(v); if (error) setError(''); }}>
                <SelectTrigger id="crt-type" data-dialog-autofocus>
                  <SelectValue placeholder={roomTypesQuery.isLoading ? 'Loading…' : 'Choose a room type'} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name} · {formatMoney(rt.basePrice)} / night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!roomTypesQuery.isLoading && options.length === 0 ? (
                <p className="text-xs text-muted-foreground">No other room types are available to move to.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crt-qty">Rooms to move</Label>
              <Input
                id="crt-qty"
                type="number"
                inputMode="numeric"
                min={1}
                max={line?.quantity ?? 1}
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); if (error) setError(''); }}
              />
              {line ? <p className="text-xs text-muted-foreground">Between 1 and {line.quantity}.</p> : null}
            </div>

            {error ? <p className="text-sm text-destructive-text">{error}</p> : null}
          </div>
        </FormDialogBody>
        <FormDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={changeRoomType.isPending || options.length === 0}>
            {changeRoomType.isPending ? 'Changing…' : 'Change room type'}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
