import { useEffect, useMemo, useState } from 'react';
import { useReceptionRooms } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BoardMomentPicker } from '@/components/stay-date-picker';
import { DataPager } from '@/components/data-pager';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatInstant, lagosNow } from '@/lib/dates';
import { roomStatusLabel } from '@/lib/format';
import { roomStatusTone } from '@/lib/status';
import { Link } from 'react-router-dom';
import { BedDouble, Clock, UserRound } from 'lucide-react';
import type { Room } from '@/types';

const STATUS_FILTERS = ['All', 'Available', 'Occupied', 'Maintenance', 'Inactive', 'FreesUpToday'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const PAGE_SIZE = 12;

function freesUpToday(room: Room, date: string): boolean {
  const freeAt = room.availableAgainAt ?? room.occupiedUntil;
  return !!freeAt && freeAt.slice(0, 10) === date;
}

function boardLine(room: Room): string {
  const board = room.effectiveStatus ?? room.status;
  if (board === 'Occupied') {
    const until = room.occupiedUntil ? ` · until ${formatInstant(room.occupiedUntil, { date: false, time: true })}` : '';
    return `${room.currentGuestName ?? 'In house'}${until}`;
  }
  if (room.availableAgainAt) {
    return `Frees ${formatInstant(room.availableAgainAt)}`;
  }
  if (room.nextArrivalAt) {
    return `Next arrival ${formatInstant(room.nextArrivalAt)}`;
  }
  return roomStatusLabel(board);
}

export default function ReceptionRoomsPage() {
  const [at, setAt] = useState(() => lagosNow());
  const [nowMode, setNowMode] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Room | null>(null);

  useEffect(() => {
    if (!nowMode) return;
    const t = setInterval(() => setAt(lagosNow()), 60_000);
    return () => clearInterval(t);
  }, [nowMode]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [at, status, debouncedSearch]);

  const roomsQuery = useReceptionRooms({
    page,
    pageSize: PAGE_SIZE,
    at: `${at.date}T${at.time}`,
    ...(status === 'All' || status === 'FreesUpToday' ? {} : { status }),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { items: fetched = [], totalPages = 1 } = roomsQuery.data ?? {};
  const rooms = useMemo(
    () => (status === 'FreesUpToday' ? fetched.filter((r) => freesUpToday(r, at.date)) : fetched),
    [fetched, status, at.date],
  );

  const setMoment = (next: { date: string; time: string }) => {
    setNowMode(false);
    setAt(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Room status</h1>
          <p className="text-sm text-muted-foreground">
            {nowMode ? `Live board · ${at.date} ${at.time}` : `Board at ${at.date} ${at.time}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BoardMomentPicker value={at} onChange={setMoment} onNow={() => { setAt(lagosNow()); setNowMode(true); }} />
          <Input
            className="w-full sm:w-56"
            placeholder="Search room number or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
        <TabsList className="w-full flex-wrap md:w-auto">
          {STATUS_FILTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s === 'FreesUpToday' ? 'Frees up today' : s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {roomsQuery.isLoading ? <PageSkeleton rows={4} /> : null}
      {roomsQuery.isError ? <ErrorBanner message="We couldn't load the rooms" retry={() => roomsQuery.refetch()} /> : null}

      {!roomsQuery.isLoading && !roomsQuery.isError ? (
        rooms.length === 0 ? (
          <EmptyState icon={BedDouble} title="No rooms match" body="Try a different moment, search or filter." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => {
                return (
                  <Card
                    key={room.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(room)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(room); }}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-semibold text-foreground">Room {room.roomNumber}</p>
                          <p className="text-xs text-muted-foreground">Floor {room.floor} · {room.roomTypeName}</p>
                        </div>
                        <Badge variant={roomStatusTone(room.effectiveStatus ?? room.status)}>{roomStatusLabel(room.effectiveStatus ?? room.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{boardLine(room)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {status === 'FreesUpToday' ? (
              <p className="text-xs text-muted-foreground">Showing rooms that free up later today on this page.</p>
            ) : null}
            <DataPager page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )
      ) : null}

      <Sheet open={selected !== null} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Room {selected.roomNumber}</SheetTitle>
                <SheetDescription>{selected.roomTypeName} · Floor {selected.floor}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant={roomStatusTone(selected.effectiveStatus ?? selected.status)}>
                    {roomStatusLabel(selected.effectiveStatus ?? selected.status)}
                  </Badge>
                  {selected.status !== (selected.effectiveStatus ?? selected.status) ? (
                    <span className="text-xs text-muted-foreground">Physical: {roomStatusLabel(selected.status)}</span>
                  ) : null}
                </div>

                <dl className="space-y-3 text-sm">
                  {selected.currentGuestName ? (
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <dt className="text-muted-foreground">In house</dt>
                        <dd className="font-medium text-foreground">{selected.currentGuestName}</dd>
                        {selected.currentBookingReference ? <dd className="text-xs text-muted-foreground">{selected.currentBookingReference}</dd> : null}
                      </div>
                    </div>
                  ) : null}
                  {selected.occupiedUntil ? (
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <dt className="text-muted-foreground">Occupied until</dt>
                        <dd className="font-medium text-foreground">{formatInstant(selected.occupiedUntil)}</dd>
                      </div>
                    </div>
                  ) : null}
                  {selected.availableAgainAt ? (
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <dt className="text-muted-foreground">Available again</dt>
                        <dd className="font-medium text-foreground">{formatInstant(selected.availableAgainAt)}</dd>
                      </div>
                    </div>
                  ) : null}
                  {selected.nextArrivalAt ? (
                    <div>
                      <dt className="text-muted-foreground">Next arrival</dt>
                      <dd className="font-medium text-foreground">
                        {formatInstant(selected.nextArrivalAt)}
                        {selected.nextArrivalGuestName ? ` · ${selected.nextArrivalGuestName}` : ''}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {selected.currentBookingId ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/reception/bookings/${selected.currentBookingId}`}>Open current booking</Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BedDouble className="h-4 w-4" />
        <p>Assign rooms and check guests in from a booking. The board follows Africa/Lagos time.</p>
      </div>
    </div>
  );
}
