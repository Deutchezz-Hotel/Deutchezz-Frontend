import { useRef, useState } from 'react';
import { useAdminRoomTypes, useAdminRoomTypeMutations } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { ImageUpload } from '@/components/image-upload';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatMoney } from '@/lib/format';
import { focusFirstInvalid } from '@/lib/focus';
import { toast } from 'sonner';
import { toApiError } from '@/api/problem';
import { Building2, Pencil, Plus } from 'lucide-react';
import type { RoomTypeResponse, SaveRoomTypeRequest } from '@/types';

const emptyForm: SaveRoomTypeRequest = { name: '', description: '', basePrice: 0, maximumOccupancy: 2, bedType: '', imageUrls: [], features: [] };
const FORM_ID = 'room-type-form';

export default function AdminRoomTypesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeResponse | null>(null);
  const [form, setForm] = useState<SaveRoomTypeRequest>(emptyForm);
  const nameRef = useRef<HTMLInputElement>(null);
  const bedTypeRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
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
    const nameValid = form.name.trim().length > 0;
    const bedTypeValid = form.bedType.trim().length > 0;
    const priceValid = form.basePrice > 0;
    if (!nameValid || !bedTypeValid || !priceValid) {
      focusFirstInvalid([
        { valid: nameValid, el: nameRef.current },
        { valid: bedTypeValid, el: bedTypeRef.current },
        { valid: priceValid, el: priceRef.current },
      ]);
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
          <p className="text-sm text-muted-foreground">The categories you sell, from Standard to Executive.</p>
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
                      <p className="font-semibold text-foreground">{rt.name}</p>
                      <p className="text-sm text-muted-foreground">{rt.bedType} · sleeps {rt.maximumOccupancy}</p>
                    </div>
                    <Badge variant={rt.isActive ? 'success' : 'secondary'}>{rt.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{rt.description}</p>
                  <p className="mt-3 text-sm font-semibold text-primary">{formatMoney(rt.basePrice)} / night</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => openEdit(rt)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                    <Switch
                      checked={rt.isActive}
                      onCheckedChange={(checked) => mutations.updateRoomTypeStatus.mutate(
                        { id: rt.id, isActive: checked },
                        { onError: (error) => toast.error(toApiError(error).userMessage) },
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

      <FormDialog open={open} onOpenChange={setOpen}>
        <FormDialogContent className="sm:max-w-lg">
          <FormDialogHeader>
            <FormDialogTitle>{editing ? `Edit ${editing.name}` : 'Add a room type'}</FormDialogTitle>
          </FormDialogHeader>
          <FormDialogBody>
            <form id={FORM_ID} className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input ref={nameRef} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Deluxe King" />
                </div>
                <div className="space-y-2">
                  <Label>Bed type</Label>
                  <Input ref={bedTypeRef} value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })} placeholder="e.g. King" />
                </div>
                <div className="space-y-2">
                  <Label>Nightly rate (₦)</Label>
                  <Input ref={priceRef} type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
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
                <Label>Images</Label>
                <ImageUpload value={form.imageUrls} onChange={(imageUrls) => setForm({ ...form, imageUrls })} />
              </div>
            </form>
          </FormDialogBody>
          <FormDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form={FORM_ID} disabled={mutations.createRoomType.isPending || mutations.updateRoomType.isPending}>Save</Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialog>
    </div>
  );
}