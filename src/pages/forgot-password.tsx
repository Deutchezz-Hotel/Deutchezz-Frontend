import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForgotPassword } from '@/hooks/queries';
import { friendlyAuthError } from '@/api/problem';
import { Link, useNavigate } from 'react-router-dom';
import type { ResetPasswordState } from '@/features/auth/flow';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address') });

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const nav = useNavigate();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const error = friendlyAuthError(forgot.error);

  const submit = form.handleSubmit((v) => {
    forgot.mutate(v, {
      onSuccess: (data) => {
        const state: ResetPasswordState = { email: v.email, resendAvailableInSeconds: data.resendAvailableInSeconds };
        nav('/reset-password', { state });
      },
    });
  });

  return (
    <>
      <PageHero
        eyebrow="Account help"
        title={<>Forgot your <em className="italic">password?</em></>}
        description="Enter your email address and we'll send you a code to reset it."
      />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-lg">
            <CardContent className="space-y-6 p-8">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Form {...form}>
                <form className="space-y-4" onSubmit={submit}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={forgot.isPending}>
                    {forgot.isPending ? 'Sending code…' : 'Send reset code'}
                  </Button>
                </form>
              </Form>
              <p className="text-center text-sm text-ink-600">
                Remembered it?{' '}
                <Link to="/login" className="text-forest-700 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
