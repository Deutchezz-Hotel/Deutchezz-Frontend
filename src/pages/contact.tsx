import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PageHero } from '@/components/branding';
import { HotelMap } from '@/components/hotel-map';
import { Reveal } from '@/components/reveal';
import { AddressBlock } from '@/components/shared';
import { appConfig } from '@/config/appConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSendContactMessage } from '@/hooks/queries';
import { toApiError } from '@/api/problem';

const contactSchema = z.object({
  name: z.string().min(2, 'Please share your name.'),
  email: z.string().email('Please enter a valid email address.'),
  message: z.string().min(10, 'Give us a little more detail — at least 10 characters.'),
});

type ContactValues = z.infer<typeof contactSchema>;

const contactDetails = [
  {
    icon: MapPin,
    label: 'Find us',
    value: `${appConfig.hotelName}, ${appConfig.address.city}, ${appConfig.address.state}`,
  },
  {
    icon: Phone,
    label: 'Call us',
    value: appConfig.phoneNumber,
  },
  {
    icon: Mail,
    label: 'Email us',
    value: appConfig.email,
  },
  {
    icon: Clock,
    label: 'Front desk',
    value: 'Open 24 hours, every day of the year',
  },
];

export default function ContactPage() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  const { mutateAsync, isPending } = useSendContactMessage();

  const onSubmit = async (values: ContactValues) => {
    const firstName = values.name.trim().split(' ')[0];
    try {
      await mutateAsync({ name: values.name.trim(), email: values.email.trim(), message: values.message.trim() });
      toast.success(`Thank you, ${firstName} — we'll be in touch soon.`);
      form.reset();
    } catch (err) {
      toast.error(toApiError(err).userMessage);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={<>Come find <em className="italic">your way in.</em></>}
        description="Questions about a stay? Our team would be delighted to assist."
      />
      <section className="section-pad container-x">
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-start">
          <div className="space-y-6">
            {contactDetails.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary ring-1 ring-border">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg text-foreground">{value}</p>
                </div>
              </div>
            ))}
            <AddressBlock />
          </div>

          <Card className="p-8 sm:p-10">
            <CardContent className="space-y-6 p-0">
              <div>
                <p className="eyebrow">Send a message</p>
                <h2 className="heading-3 mt-3">We'd love to hear from you</h2>
                <p className="mt-2 text-muted-foreground">
                  Whether it's a room inquiry, a special request, or feedback on a recent stay — fill in the
                  form below and we'll get back to you.
                </p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Tell us about your stay, dates, or anything else..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="gap-2" disabled={isPending}>
                    <Send className="h-4 w-4" />
                    {isPending ? 'Sending...' : 'Send message'}
                  </Button>
                  <p className="text-sm text-muted-foreground">We usually reply within one business day.</p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Reveal>
      </section>
      <section className="container-x pb-16 sm:pb-24">
        <Reveal>
          <HotelMap />
        </Reveal>
      </section>
    </>
  );
}