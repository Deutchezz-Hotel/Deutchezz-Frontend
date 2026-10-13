import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useAdminRooms, useAdminRoomMutations, usePublicRoomTypes } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/date-picker';
import { DataPager } from '@/components/data-pager';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { roomStatusLabel } from '@/lib/format';
import { roomStatusTone } from '@/lib/status';
import { focusFirstInvalid } from '@/lib/focus';
import { toast } from 'sonner';
import { BedDouble, Pencil, Plus } from 'lucide-react';
import type { Room, RoomStatus, SaveRoomRequest } from '@/types';

const STATUS_FILTERS = ['All', 'Available', 'Occupied', 'Maintenance', 'Inactive'] as const;
const ROOM_STATUSES: RoomStatus[] = ['Available', 'Occupied', 'Maintenance', 'Inactive'];
const PAGE_SIZE = 12;

const emptyForm: SaveRoomRequest = { roomNumber: '', floor: 1, roomTypeId: '', status: 'Available' };
const FORM_ID = 'room-form';

export default function AdminRoomsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<SaveRoomRequest>(emptyForm);
  const roomNumberRef = useRef<HTMLInputElement>(null);
  const roomTypeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [date, status, debouncedSearch]);

  const roomsQuery = useAdminRooms({
    page,
    pageSize: PAGE_SIZE,
    date: format(date, 'yyyy-MM-dd'),
    ...(status === 'All' ? {} : { status }),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const roomTypesQuery = usePublicRoomTypes();
  const mutations = useAdminRoomMutations();

  const { items: rooms = [], totalPages = 1 } = roomsQuery.data ?? {};
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
    const roomNumberValid = form.roomNumber.trim().length > 0;
    const roomTypeValid = form.roomTypeId.length > 0;
    if (!roomNumberValid || !roomTypeValid) {
      focusFirstInvalid([
        { valid: roomNumberValid, el: roomNumberRef.current },
        { valid: roomTypeValid, el: roomTypeRef.current },
      ]);
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
          <p className="text-sm text-muted-foreground">Inventory and occupancy per date.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={openCreate} disabled={roomTypes.length === 0}><Plus className="mr-2 h-4 w-4" /> Add room</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DatePicker value={date} onChange={(d) => d && setDate(d)} className="w-44" />
        <Input
          className="w-full sm:w-64"
          placeholder="Search room number or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          <EmptyState icon={BedDouble} title="No rooms match" body="Change the date, status or search, or add a room." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Board status</TableHead>
                    <TableHead>Physical status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => {
                    const board = room.effectiveStatus ?? room.status;
                    return (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium text-foreground">{room.roomNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{room.floor}</TableCell>
                        <TableCell className="text-muted-foreground">{room.roomTypeName}</TableCell>
                        <TableCell>
                          <Badge variant={roomStatusTone(board)}>{roomStatusLabel(board)}</Badge>
                        </TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
              <DataPager page={page} totalPages={totalPages} onPageChange={setPage} className="p-4" />
            </CardContent>
          </Card>
        )
      ) : null}

      <FormDialog open={open} onOpenChange={setOpen}>
        <FormDialogContent className="sm:max-w-md">
          <FormDialogHeader>
            <FormDialogTitle>{editing ? `Edit room ${editing.roomNumber}` : 'Add a room'}</FormDialogTitle>
          </FormDialogHeader>
          <FormDialogBody>
            <form id={FORM_ID} className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room number</Label>
                  <Input ref={roomNumberRef} value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" />
                </div>
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input type="number" min={0} value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Room type</Label>
                <Select value={form.roomTypeId} onValueChange={(v) => setForm({ ...form, roomTypeId: v })}>
                  <SelectTrigger ref={roomTypeRef}><SelectValue placeholder="Choose a room type" /></SelectTrigger>
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
            </form>
          </FormDialogBody>
          <FormDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form={FORM_ID} disabled={mutations.createRoom.isPending || mutations.updateRoom.isPending}>Save</Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialog>
    </div>
  );
}