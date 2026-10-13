import { useRef, useState } from 'react';
import { useAdminStaff, useAdminStaffMutations } from '@/hooks/queries';
import { useAuth } from '@/app/auth';
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
import { ChangeRoleDialog, type ChangeRoleTarget } from '@/components/change-role-dialog';
import { staffRoleLabel } from '@/lib/format';
import { focusFirstInvalid } from '@/lib/focus';
import { toast } from 'sonner';
import { Plus, ShieldCheck, UserCog } from 'lucide-react';
import type { SaveStaffRequest, StaffRole } from '@/types';

const ROLES: StaffRole[] = ['Receptionist', 'Administrator'];
const ROLE_OPTIONS: ChangeRoleTarget['role'][] = ['Receptionist', 'Administrator', 'Customer'];
const emptyForm: SaveStaffRequest = { firstName: '', lastName: '', email: '', phoneNumber: '', role: 'Receptionist' };
const FORM_ID = 'staff-form';

export default function AdminStaffPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<ChangeRoleTarget | null>(null);
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

  const openCreate = () => { setForm(emptyForm); setOpen(true); };
  const save = () => {
    const firstNameValid = form.firstName.trim().length > 0;
    const lastNameValid = form.lastName.trim().length > 0;
    const emailValid = form.email.trim().length > 0;
    const passwordValid = !!form.password && form.password.length >= 8;
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
    mutations.createStaff.mutate(req, {
      onSuccess: () => { toast.success('Staff added'); setOpen(false); },
      onError: () => toast.error('Could not save the staff member'),
    });
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
                  {staff.map((s) => {
                    const isSelf = user?.id === s.id;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary text-xs text-primary-foreground">{s.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-ink-900">
                                {s.firstName} {s.lastName}
                                {isSelf ? <Badge variant="secondary" className="ml-2 align-middle">You</Badge> : null}
                              </p>
                              <p className="text-xs text-ink-600">{s.phoneNumber ? `${s.email} · ${s.phoneNumber}` : s.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{staffRoleLabel(s.role)}</Badge></TableCell>
                        <TableCell>
                          <Switch
                            checked={s.isActive}
                            disabled={s.id === user?.id}
                            onCheckedChange={(checked) => mutations.updateStaffStatus.mutate(
                              { id: s.id, isActive: checked },
                              { onError: () => toast.error('Could not change the status') },
                            )}
                            aria-label={`${s.isActive ? 'Deactivate' : 'Activate'} ${s.firstName}${s.id === user?.id ? ' (you)' : ''}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={s.id === user?.id}
                              onClick={() => setRoleTarget({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim(), role: s.role })}
                              title={s.id === user?.id ? "You can't change your own role" : undefined}
                            >
                              <UserCog className="mr-2 h-4 w-4" /> Change role
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <FormDialog open={open} onOpenChange={setOpen}>
        <FormDialogContent className="sm:max-w-sm">
          <FormDialogHeader>
            <FormDialogTitle>Add staff</FormDialogTitle>
          </FormDialogHeader>
          <FormDialogBody>
            <form id={FORM_ID} className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-first-name">First name</Label>
                  <Input id="staff-first-name" ref={firstNameRef} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-last-name">Last name</Label>
                  <Input id="staff-last-name" ref={lastNameRef} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input id="staff-email" ref={emailRef} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-password">Password</Label>
                <Input id="staff-password" ref={passwordRef} type="password" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone number (optional)</Label>
                <Input id="staff-phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
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
            <Button type="submit" form={FORM_ID} disabled={mutations.createStaff.isPending}>Save</Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialog>

      <ChangeRoleDialog
        target={roleTarget}
        roles={ROLE_OPTIONS}
        title="Change staff role"
        description={roleTarget ? `Set a new role for ${roleTarget.name}, or move them to Customer to remove front-desk access.` : undefined}
        onOpenChange={(next) => { if (!next) setRoleTarget(null); }}
      />
    </div>
  );
}
