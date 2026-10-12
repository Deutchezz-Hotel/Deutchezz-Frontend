import { useEffect, useState } from 'react';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { roleLabel } from '@/lib/format';
import { useChangeUserRole } from '@/hooks/queries';
import { toApiError } from '@/api';
import type { UserRole } from '@/types';

/** The minimal shape the dialog needs to change one account's role. */
export interface ChangeRoleTarget {
  id: string;
  name: string;
  role: UserRole;
}

const ALL_ROLES: UserRole[] = ['Customer', 'Receptionist', 'Administrator'];

interface ChangeRoleDialogProps {
  /** The account to edit; `null` keeps the dialog closed. */
  target: ChangeRoleTarget | null;
  onOpenChange: (open: boolean) => void;
  /** Roles offered, in display order. Defaults to all three. */
  roles?: UserRole[];
  title?: string;
  description?: string;
}

/**
 * Assigns exactly one role to an account. A change moves the person between the
 * user directory and the staff list, so the mutation invalidates both. The
 * backend enforces the guard rails (no self-change, keep one administrator).
 */
export function ChangeRoleDialog({ target, onOpenChange, roles = ALL_ROLES, title = 'Change role', description }: ChangeRoleDialogProps) {
  const [role, setRole] = useState<UserRole>('Customer');
  const mutation = useChangeUserRole();
  const open = target !== null;

  useEffect(() => {
    if (target) setRole(target.role);
  }, [target]);

  const changed = target !== null && role !== target.role;

  const save = () => {
    if (!target || !changed) return;
    mutation.mutate(
      { id: target.id, role },
      {
        onSuccess: () => {
          toast.success(`${target.name} is now ${roleLabel(role)}`);
          onOpenChange(false);
        },
        onError: (error) => toast.error(toApiError(error).userMessage),
      },
    );
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent className="sm:max-w-sm">
        <FormDialogHeader>
          <FormDialogTitle>{title}</FormDialogTitle>
          {target ? (
            <p className="text-sm text-muted-foreground">{description ?? `Set the role for ${target.name}.`}</p>
          ) : null}
        </FormDialogHeader>
        <FormDialogBody>
          <div className="space-y-2">
            <Label htmlFor="change-role-select">Role</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger id="change-role-select" data-dialog-autofocus>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Changing a role signs the account out of its current session.</p>
          </div>
        </FormDialogBody>
        <FormDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!changed || mutation.isPending}>
            Save
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
