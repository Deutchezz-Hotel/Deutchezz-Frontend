import { useMeProfile, useUpdateMeProfile } from '@/hooks/queries';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { toast } from 'sonner';
import { useEffect } from 'react';

const schema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName: z.string().min(2, 'Enter your last name'),
  phoneNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function MyProfilePage() {
  const profileQuery = useMeProfile();
  const updateProfile = useUpdateMeProfile();
  const profile = profileQuery.data;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', phoneNumber: '' },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber ?? '',
      });
    }
  }, [profile, form]);

  if (profileQuery.isLoading) return <PageSkeleton rows={3} />;
  if (profileQuery.isError) return <ErrorBanner message="We couldn't load your profile" retry={() => profileQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2">My profile</h1>
        <p className="text-sm text-ink-600">Your details, used for bookings and check-ins.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((v) => {
                updateProfile.mutate(
                  { firstName: v.firstName.trim(), lastName: v.lastName.trim(), phoneNumber: v.phoneNumber?.trim() || undefined },
                  {
                    onSuccess: () => toast.success('Profile updated'),
                    onError: () => toast.error('Could not update your profile'),
                  },
                );
              })}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input type="email" value={profile?.email ?? ''} disabled readOnly />
                <p className="text-xs text-muted-foreground">Email changes aren't supported yet.</p>
              </div>
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
