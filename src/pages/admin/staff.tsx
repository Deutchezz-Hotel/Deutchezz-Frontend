import { useRef, useState } from 'react';
import { useAdminStaff, useAdminStaffMutations } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { staffRoleLabel } from '@/lib/format';
import { focusFirstInvalid } from '@/lib/focus';
import { toast } from 'sonner';
import { Pencil, Plus, ShieldCheck } from 'lucide-react';
import type { SaveStaffRequest, Staff, StaffRole } from '@/types';

const ROLES: StaffRole[] = ['Receptionist', 'Administrator'];
const emptyForm: SaveStaffRequest = { firstName: '', lastName: '', email: '', phoneNumber: '', role: 'Receptionist' };
const FORM_ID = 'staff-form';

export default function AdminStaffPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<SaveStaffRequest>(emptyForm);
  const [search, setSearch] = useState('');
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const query = useAdminStaff({ pageSize: 100 });
  const mutations = useAdminStaffMutations();

  const allStaff = query.data?.items ?? [];
  const q = search.trim().toLowerCase();
  const staff = q
    ? allStaff.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    : allStaff;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, phoneNumber: s.phoneNumber ?? '', role: s.role });
    setOpen(true);
  };
  const save = () => {
    const firstNameValid = form.firstName.trim().length > 0;
    const lastNameValid = form.lastName.trim().length > 0;
    const emailValid = form.email.trim().length > 0;
    const passwordValid = editing || (!!form.password && form.password.length >= 8);
    if (!firstNameValid || !lastNameValid || !emailValid) {
      focusFirstInvalid([
        { valid: firstNameValid, el: firstNameRef.current },
        { valid: lastNameValid, el: lastNameRef.current },
        { valid: emailValid, el: emailRef.current },
      ]);
      toast.error('Enter the staff member name and email');
      return;
    }
    if (!passwordValid) {
      focusFirstInvalid([{ valid: false, el: passwordRef.current }]);
      toast.error('Set a password of at least 8 characters');
      return;
    }
    const req = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() };
    const opts = { onSuccess: () => { toast.success(editing ? 'Staff updated' : 'Staff added'); setOpen(false); }, onError: () => toast.error('Could not save the staff member') };
    if (editing) mutations.updateStaff.mutate({ id: editing.id, request: req }, opts);
    else mutations.createStaff.mutate(req, opts);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Staff</h1>
          <p className="text-sm text-ink-600">The people who run the front desk.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="w-full sm:w-56" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add staff</Button>
        </div>
      </div>

      {query.isLoading ? <PageSkeleton rows={5} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load staff" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        staff.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No staff members" body="Add your first staff member to manage the front desk." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{s.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-ink-900">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-ink-600">{s.email} · {s.phoneNumber ?? ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{staffRoleLabel(s.role)}</Badge></TableCell>
                      <TableCell>
                        <Switch
                          checked={s.isActive}
                          onCheckedChange={(checked) => mutations.updateStaffStatus.mutate(
                            { id: s.id, isActive: checked },
                            { onError: () => toast.error('Could not update status') },
                          )}
                          aria-label={`${s.isActive ? 'Deactivate' : 'Activate'} ${s.firstName}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <FormDialog open={open} onOpenChange={setOpen}>
        <FormDialogContent className="sm:max-w-md">
          <FormDialogHeader>
            <FormDialogTitle>{editing ? `Edit ${editing.firstName} ${editing.lastName}` : 'Add staff'}</FormDialogTitle>
          </FormDialogHeader>
          <FormDialogBody>
            <form id={FORM_ID} className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input ref={firstNameRef} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input ref={lastNameRef} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input ref={emailRef} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!editing ? (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input ref={passwordRef} type="password" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Phone number (optional)</Label>
                <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v: StaffRole) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{staffRoleLabel(r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </FormDialogBody>
          <FormDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form={FORM_ID} disabled={mutations.createStaff.isPending || mutations.updateStaff.isPending}>Save</Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialog>
    </div>
  );
}