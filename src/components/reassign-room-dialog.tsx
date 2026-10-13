import { useEffect, useMemo, useState } from 'react';
import { useReceptionAction, useReceptionRooms } from '@/hooks/queries';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatInstant, formatStayRange, formatTime12h } from '@/lib/dates';
import { toApiError, type ApiError } from '@/api';
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
 * list is the stay-window-filtered room board (`freeFrom`/`freeTo`), so only
 * rooms free for every night are offered. Works before check-in (a swap) and
 * while checked in (the old room frees up and the new one becomes occupied).
 */
export function ReassignRoomDialog({ booking, line, assignment, open, onOpenChange }: Props) {
  const { reassignRoom } = useReceptionAction();
  const [newRoomId, setNewRoomId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [lateTarget, setLateTarget] = useState<{ roomId: string; roomNumber: string; availableFrom?: string } | null>(null);
  const [conflictError, setConflictError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (open) {
      setNewRoomId('');
      setReason('');
      setError('');
      setLateTarget(null);
      setConflictError(null);
    }
  }, [open]);

  const freeFrom = booking?.checkInTime ? `${booking.checkInDate}T${booking.checkInTime}` : undefined;
  const freeTo = booking?.checkOutTime ? `${booking.checkOutDate}T${booking.checkOutTime}` : undefined;

  const roomsQuery = useReceptionRooms(
    {
      pageSize: 200,
      roomTypeId: line?.roomTypeId,
      freeFrom,
      freeTo,
    },
    open && !!booking && !!line && !!freeFrom && !!freeTo,
  );

  const candidates = useMemo(() => {
    const items = roomsQuery.data?.items ?? [];
    return items.filter((r) => r.id !== assignment?.roomId);
  }, [roomsQuery.data, assignment]);

  const runReassign = (roomId: string, acknowledgeLateAvailability = false) => {
    if (!booking || !assignment) return;
    setError('');
    reassignRoom.mutate(
      {
        id: booking.id,
        request: { roomAssignmentId: assignment.id, newRoomId: roomId, reason: reason.trim() || null, acknowledgeLateAvailability },
      },
      {
        onSuccess: () => {
          toast.success('Room reassigned');
          setLateTarget(null);
          onOpenChange(false);
        },
        onError: (err) => {
          const api = toApiError(err);
          setLateTarget(null);
          if (api.problem.code === 'room.available_later') {
            const room = candidates.find((r) => r.id === roomId);
            setLateTarget({ roomId, roomNumber: api.problem.roomNumber ?? room?.roomNumber ?? '', availableFrom: api.problem.availableFrom });
          } else if (api.problem.code === 'room.occupied_until') {
            setConflictError(api);
          } else if (api.problem.code === 'booking.room_unavailable') {
            setError('That room is no longer free for the whole stay.');
          } else {
            toast.error(api.userMessage);
          }
        },
      },
    );
  };

  const submit = () => {
    if (!newRoomId) {
      setError('Choose a replacement room.');
      return;
    }
    runReassign(newRoomId);
  };

  return (
    <>
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
                <p className="rounded-lg bg-accent p-3 text-xs text-muted-foreground">
                  Stay: {formatStayRange(booking.checkInDate, booking.checkOutDate)} · {formatTime12h(booking.checkInTime)}–{formatTime12h(booking.checkOutTime)}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="reassign-room">Replacement room</Label>
                <Select value={newRoomId} onValueChange={(v) => { setNewRoomId(v); if (error) setError(''); }}>
                  <SelectTrigger id="reassign-room" data-dialog-autofocus>
                    <SelectValue placeholder={roomsQuery.isLoading ? 'Loading…' : 'Choose a room'} />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{`Room ${r.roomNumber} · Floor ${r.floor}`}</SelectItem>
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

      <AlertDialog open={lateTarget !== null} onOpenChange={(o) => { if (!o) setLateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Room {lateTarget?.roomNumber} isn&apos;t free right now</AlertDialogTitle>
            <AlertDialogDescription>
              {lateTarget?.availableFrom
                ? `Room ${lateTarget.roomNumber} frees up at ${formatInstant(lateTarget.availableFrom)}. You can still move the guest into it now.`
                : 'It will free up before this stay begins. You can still move the guest into it now.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Choose another room</AlertDialogCancel>
            <Button
              disabled={reassignRoom.isPending}
              onClick={() => lateTarget && runReassign(lateTarget.roomId, true)}
            >
              {reassignRoom.isPending ? 'Changing…' : 'Change anyway'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={conflictError !== null} onOpenChange={(o) => { if (!o) setConflictError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>That room is occupied for this stay</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-left">
                <p>These rooms clash with the requested stay. Choose another room.</p>
                <ul className="space-y-1 text-sm">
                  {(conflictError?.roomConflicts ?? []).map((c) => (
                    <li key={c.roomId} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                      <span className="font-medium">Room {c.roomNumber}</span>
                      {c.occupiedUntil ? <span className="text-muted-foreground">until {formatInstant(c.occupiedUntil)}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConflictError(null)}>Choose another room</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ReassignRoomDialog;
