import { useState } from 'react';
import { useAdminRooms, useAdminRoomMutations, usePublicRoomTypes } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { roomStatusLabel } from '@/lib/format';
import { toast } from 'sonner';
import { BedDouble, Pencil, Plus } from 'lucide-react';
import type { Room, RoomStatus, SaveRoomRequest } from '@/types';

const STATUS_FILTERS = ['All', 'Available', 'Occupied', 'Maintenance', 'Inactive'] as const;
const ROOM_STATUSES: RoomStatus[] = ['Available', 'Occupied', 'Maintenance', 'Inactive'];

const emptyForm: SaveRoomRequest = { roomNumber: '', floor: 1, roomTypeId: '', status: 'Available' };

export default function AdminRoomsPage() {
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<SaveRoomRequest>(emptyForm);
  const roomsQuery = useAdminRooms({ pageSize: 200, search: search || undefined, ...(status === 'All' ? {} : { status }) });
  const roomTypesQuery = usePublicRoomTypes();
  const mutations = useAdminRoomMutations();

  const rooms = roomsQuery.data?.items ?? [];
  const roomTypes = roomTypesQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, roomTypeId: roomTypes[0]?.id ?? '' });
    setOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditing(room);
    setForm({ roomNumber: room.roomNumber, floor: room.floor, roomTypeId: room.roomTypeId, status: room.status });
    setOpen(true);
  };
  const save = () => {
    if (!form.roomNumber.trim() || !form.roomTypeId) {
      toast.error('Enter a room number and choose a room type');
      return;
    }
    const req = { ...form, roomNumber: form.roomNumber.trim() };
    const opts = { onSuccess: () => { toast.success(editing ? 'Room updated' : 'Room added'); setOpen(false); }, onError: () => toast.error('Could not save the room') };
    if (editing) mutations.updateRoom.mutate({ id: editing.id, request: req }, opts);
    else mutations.createRoom.mutate(req, opts);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Rooms</h1>
          <p className="text-sm text-ink-600">Inventory and status of every room.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="w-full sm:w-64" placeholder="Search room number or type..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={openCreate} disabled={roomTypes.length === 0}><Plus className="mr-2 h-4 w-4" /> Add room</Button>
        </div>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="w-full flex-wrap md:w-auto">
          {STATUS_FILTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {roomsQuery.isLoading ? <PageSkeleton rows={6} /> : null}
      {roomsQuery.isError ? <ErrorBanner message="We couldn't load rooms" retry={() => roomsQuery.refetch()} /> : null}

      {!roomsQuery.isLoading && !roomsQuery.isError ? (
        rooms.length === 0 ? (
          <EmptyState icon={BedDouble} title="No rooms match" body="Add a room or change your filters." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium text-ink-900">{room.roomNumber}</TableCell>
                      <TableCell className="text-ink-700">{room.floor}</TableCell>
                      <TableCell className="text-ink-700">{room.roomTypeName}</TableCell>
                      <TableCell>
                        <Select
                          value={room.status}
                          onValueChange={(v: RoomStatus) =>
                            mutations.updateRoomStatus.mutate(
                              { id: room.id, status: v },
                              { onError: () => toast.error('Could not update status') },
                            )
                          }
                        >
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROOM_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{roomStatusLabel(s)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(room)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit room ${editing.roomNumber}` : 'Add a room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room number</Label>
                <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input type="number" min={0} value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Room type</Label>
              <Select value={form.roomTypeId} onValueChange={(v) => setForm({ ...form, roomTypeId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a room type" /></SelectTrigger>
                <SelectContent>
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: RoomStatus) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROOM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{roomStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={mutations.createRoom.isPending || mutations.updateRoom.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}