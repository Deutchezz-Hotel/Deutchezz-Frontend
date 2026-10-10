import { useState } from 'react';
import { useAdminRoomTypes, useAdminRoomTypeMutations } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { Building2, Pencil, Plus } from 'lucide-react';
import type { RoomTypeResponse, SaveRoomTypeRequest } from '@/types';

const emptyForm: SaveRoomTypeRequest = { name: '', description: '', basePrice: 0, maximumOccupancy: 2, bedType: '', imageUrls: [], features: [] };

export default function AdminRoomTypesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeResponse | null>(null);
  const [form, setForm] = useState<SaveRoomTypeRequest>(emptyForm);
  const query = useAdminRoomTypes({ pageSize: 200 });
  const mutations = useAdminRoomTypeMutations();

  const items = query.data?.items ?? [];

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (rt: RoomTypeResponse) => {
    setEditing(rt);
    setForm({ name: rt.name, description: rt.description, basePrice: rt.basePrice, maximumOccupancy: rt.maximumOccupancy, bedType: rt.bedType, imageUrls: rt.imageUrls, features: rt.features });
    setOpen(true);
  };
  const save = () => {
    if (!form.name.trim() || !form.bedType.trim() || form.basePrice <= 0) {
      toast.error('Check the name, bed type and nightly rate');
      return;
    }
    const req: SaveRoomTypeRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      basePrice: form.basePrice,
      maximumOccupancy: form.maximumOccupancy,
      bedType: form.bedType.trim(),
      imageUrls: form.imageUrls.map((s) => s.trim()).filter(Boolean),
      features: form.features.map((s) => s.trim()).filter(Boolean),
    };
    const opts = { onSuccess: () => { toast.success(editing ? 'Room type updated' : 'Room type created'); setOpen(false); }, onError: () => toast.error('Could not save the room type') };
    if (editing) mutations.updateRoomType.mutate({ id: editing.id, request: req }, opts);
    else mutations.createRoomType.mutate(req, opts);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Room types</h1>
          <p className="text-sm text-ink-600">The categories you sell, from Standard to Suite.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add room type</Button>
      </div>

      {query.isLoading ? <PageSkeleton rows={4} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load room types" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        items.length === 0 ? (
          <EmptyState icon={Building2} title="No room types yet" body="Add your first room type to start taking bookings." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((rt) => (
              <Card key={rt.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{rt.name}</p>
                      <p className="text-sm text-ink-600">{rt.bedType} · sleeps {rt.maximumOccupancy}</p>
                    </div>
                    <Badge variant={rt.isActive ? 'success' : 'secondary'}>{rt.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-ink-600">{rt.description}</p>
                  <p className="mt-3 text-sm font-semibold text-forest-700">{formatMoney(rt.basePrice)} / night</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => openEdit(rt)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                    <Switch
                      checked={rt.isActive}
                      onCheckedChange={(checked) => mutations.updateRoomTypeStatus.mutate(
                        { id: rt.id, isActive: checked },
                        { onError: () => toast.error('Could not update status') },
                      )}
                      aria-label={`${rt.isActive ? 'Deactivate' : 'Activate'} ${rt.name}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add a room type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Deluxe King" />
              </div>
              <div className="space-y-2">
                <Label>Bed type</Label>
                <Input value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })} placeholder="e.g. King" />
              </div>
              <div className="space-y-2">
                <Label>Nightly rate (₦)</Label>
                <Input type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Maximum occupancy</Label>
                <Input type="number" min={1} value={form.maximumOccupancy} onChange={(e) => setForm({ ...form, maximumOccupancy: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short description of the room." />
            </div>
            <div className="space-y-2">
              <Label>Features (comma separated)</Label>
              <Input value={form.features.join(', ')} onChange={(e) => setForm({ ...form, features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="AC, En-suite, Balcony" />
            </div>
            <div className="space-y-2">
              <Label>Image URLs (comma separated)</Label>
              <Input value={form.imageUrls.join(', ')} onChange={(e) => setForm({ ...form, imageUrls: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={mutations.createRoomType.isPending || mutations.updateRoomType.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}