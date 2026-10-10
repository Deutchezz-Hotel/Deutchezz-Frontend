import { useState } from 'react';
import { useReceptionRooms } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { roomStatusLabel } from '@/lib/format';
import { Link } from 'react-router-dom';
import { BedDouble } from 'lucide-react';
import type { RoomStatus } from '@/types';

const STATUS_FILTERS = ['All', 'Available', 'Occupied', 'Maintenance', 'Inactive'] as const;

const badgeTone = (status: RoomStatus) =>
  status === 'Available' ? 'success'
  : status === 'Occupied' ? 'default'
  : status === 'Maintenance' ? 'warning'
  : 'secondary';

export default function ReceptionRoomsPage() {
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const roomsQuery = useReceptionRooms({ pageSize: 200, search: search || undefined, ...(status === 'All' ? {} : { status }) });

  const rooms = roomsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Room status</h1>
          <p className="text-sm text-ink-600">Live status of every room in the house.</p>
        </div>
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

      {roomsQuery.isLoading ? <PageSkeleton rows={4} /> : null}
      {roomsQuery.isError ? <ErrorBanner message="We couldn't load the rooms" retry={() => roomsQuery.refetch()} /> : null}

      {!roomsQuery.isLoading && !roomsQuery.isError ? (
        rooms.length === 0 ? (
          <EmptyState icon={BedDouble} title="No rooms match" body="Try a different search or filter." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">Room {room.roomNumber}</p>
                      <p className="text-sm text-ink-600">{room.roomTypeName} · Floor {room.floor}</p>
                    </div>
                    <Badge variant={badgeTone(room.status)}>{roomStatusLabel(room.status)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      <p className="text-xs text-ink-600">
        Need to fix a room for a guest? Go to{' '}
        <Link to="/reception/bookings" className="font-medium text-forest-700">Bookings</Link>.
      </p>
    </div>
  );
}