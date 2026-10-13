import { useEffect, useMemo, useState } from 'react';
import { useReceptionAction, useReceptionRooms } from '@/hooks/queries';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatStayRange } from '@/lib/dates';
import { toApiError } from '@/api';
import { toast } from 'sonner';
import type { AssignedRoom, BookingResponse, BookingRoomLine } from '@/types';

interface Props {
  booking: BookingResponse | null;
  line: BookingRoomLine | null;
  assignment: AssignedRoom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Swaps one assigned room for another free room of the same type. The candidate
 * list is the range-filtered room board for the whole stay, so only rooms free
 * for every night are offered. Works before check-in (a swap) and while checked
 * in (the old room frees up and the new one becomes occupied).
 */
export function ReassignRoomDialog({ booking, line, assignment, open, onOpenChange }: Props) {
  const { reassignRoom } = useReceptionAction();
  const [newRoomId, setNewRoomId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNewRoomId('');
      setReason('');
      setError('');
    }
  }, [open]);

  const roomsQuery = useReceptionRooms(
    {
      pageSize: 200,
      roomTypeId: line?.roomTypeId,
      availableFrom: booking?.checkInDate,
      availableTo: booking?.checkOutDate,
    },
    open && !!booking && !!line,
  );

  const candidates = useMemo(() => {
    const items = roomsQuery.data?.items ?? [];
    return items.filter((r) => r.id !== assignment?.roomId);
  }, [roomsQuery.data, assignment]);

  const submit = () => {
    if (!booking || !assignment) return;
    if (!newRoomId) {
      setError('Choose a replacement room.');
      return;
    }
    setError('');
    reassignRoom.mutate(
      { id: booking.id, request: { roomAssignmentId: assignment.id, newRoomId, reason: reason.trim() || null } },
      {
        onSuccess: () => {
          toast.success('Room reassigned');
          onOpenChange(false);
        },
        onError: (err) => {
          const api = toApiError(err);
          if (api.problem.code === 'booking.room_unavailable') {
            setError('That room is no longer free for the whole stay.');
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
          <FormDialogTitle>Change room</FormDialogTitle>
          <p className="text-sm text-muted-foreground">
            {assignment && line
              ? `Move room ${assignment.roomNumber} to another free ${line.roomTypeName} for the stay.`
              : ''}
          </p>
        </FormDialogHeader>
        <FormDialogBody>
          <div className="space-y-5">
            {booking ? (
              <p className="rounded-lg bg-accent p-3 text-xs text-muted-foreground">Stay: {formatStayRange(booking.checkInDate, booking.checkOutDate)}</p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="reassign-room">Replacement room</Label>
              <Select value={newRoomId} onValueChange={(v) => { setNewRoomId(v); if (error) setError(''); }}>
                <SelectTrigger id="reassign-room" data-dialog-autofocus>
                  <SelectValue placeholder={roomsQuery.isLoading ? 'Loading…' : 'Choose a room'} />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((r) => (
                    <SelectItem key={r.id} value={r.id}>Room {r.roomNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!roomsQuery.isLoading && candidates.length === 0 ? (
                <p className="text-xs text-warning">No free {line?.roomTypeName ?? ''} rooms for this stay.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reassign-reason">Reason (optional)</Label>
              <Input
                id="reassign-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. maintenance issue in the room"
              />
            </div>

            {error ? <p className="text-sm text-destructive-text">{error}</p> : null}
          </div>
        </FormDialogBody>
        <FormDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={reassignRoom.isPending || candidates.length === 0}>
            {reassignRoom.isPending ? 'Changing…' : 'Change room'}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
