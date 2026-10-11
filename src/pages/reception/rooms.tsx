import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useReceptionRooms } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/date-picker';
import { DataPager } from '@/components/data-pager';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { roomStatusLabel } from '@/lib/format';
import { Link } from 'react-router-dom';
import { BedDouble } from 'lucide-react';
import type { RoomStatus } from '@/types';

const STATUS_FILTERS = ['All', 'Available', 'Occupied', 'Maintenance', 'Inactive'] as const;
const PAGE_SIZE = 12;

const badgeTone = (status: RoomStatus) =>
  status === 'Available' ? 'success'
  : status === 'Occupied' ? 'default'
  : status === 'Maintenance' ? 'warning'
  : 'secondary';

export default function ReceptionRoomsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [date, status, debouncedSearch]);

  const roomsQuery = useReceptionRooms({
    page,
    pageSize: PAGE_SIZE,
    date: format(date, 'yyyy-MM-dd'),
    ...(status === 'All' ? {} : { status }),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { items: rooms = [], totalPages = 1 } = roomsQuery.data ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Room status</h1>
          <p className="text-sm text-ink-600">Who is in which room, for the selected date.</p>
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
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="w-full flex-wrap md:w-auto">
          {STATUS_FILTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {roomsQuery.isLoading ? <PageSkeleton rows={4} /> : null}
      {roomsQuery.isError ? <ErrorBanner message="We couldn't load the rooms" retry={() => roomsQuery.refetch()} /> : null}

      {!roomsQuery.isLoading && !roomsQuery.isError ? (
        rooms.length === 0 ? (
          <EmptyState icon={BedDouble} title="No rooms match" body="Try a different date, search or filter." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => {
                const board = room.effectiveStatus ?? room.status;
                return (
                  <Card key={room.id}>
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-semibold text-ink-900">Room {room.roomNumber}</p>
                          <p className="text-sm text-ink-600">{room.roomTypeName} · Floor {room.floor}</p>
                        </div>
                        <Badge variant={badgeTone(board)}>{roomStatusLabel(board)}</Badge>
                      </div>
                      {room.effectiveStatus && room.effectiveStatus !== room.status ? (
                        <p className="text-xs text-ink-600">Physical status: {roomStatusLabel(room.status)}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <DataPager page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )
      ) : null}

      <p className="text-xs text-ink-600">
        Need to fix a room for a guest? Go to{' '}
        <Link to="/reception/bookings" className="font-medium text-forest-700">Bookings</Link>.
      </p>
    </div>
  );
}