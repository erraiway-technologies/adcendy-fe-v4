import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BUSINESS_TERMS as TERMS, callBookingLink } from '@/shared/marketing/business-terms';
import { pageMetadata } from '@/shared/seo/site';

export const metadata = pageMetadata('/contact', {
  title: 'Contact',
  description: `Email ${TERMS.contact.hello} before you buy or ${TERMS.contact.support} as a client, or book a ${TERMS.calls.fitCallMinutes}-minute call about scope and fit.`,
});

// Terms of Service, section 27. Plain text and links only, so the page is
// complete as the server sends it.
const CHANNELS = [
  {
    label: 'Before you buy — questions, quotes, partnerships',
    email: TERMS.contact.hello,
  },
  {
    label: 'Clients — anything about your strategy, account or billing',
    email: TERMS.contact.support,
    note: 'or write to us from your dashboard',
  },
  {
    label: 'Personal data — access, correction, deletion',
    email: TERMS.contact.privacy,
  },
];

export default function ContactPage() {
  const booking = callBookingLink();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-24">
      <div className="max-w-3xl w-full space-y-10">
        <div className="text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Contact</p>
          <h1 className="font-space-grotesk text-4xl sm:text-5xl font-bold">Talk to us</h1>
          <p className="text-muted-foreground text-lg">
            We work in writing: email is our channel of record, and we reply within{' '}
            {TERMS.contact.replyWithin} (Monday to Friday, excluding public holidays in India).
          </p>
        </div>

        <ul className="space-y-4">
          {CHANNELS.map((channel) => (
            <li key={channel.email} className="rounded-lg border border-border p-5">
              <p className="text-sm text-muted-foreground">{channel.label}</p>
              <p className="mt-1 text-lg">
                <a href={`mailto:${channel.email}`} className="text-primary hover:underline">
                  {channel.email}
                </a>
                {channel.note && <span className="text-sm text-muted-foreground"> — {channel.note}</span>}
              </p>
            </li>
          ))}
          <li className="rounded-lg border border-border p-5">
            <p className="text-sm text-muted-foreground">Prefer to talk first?</p>
            <p className="mt-1 text-lg">
              <a
                href={booking.href}
                className="text-primary hover:underline"
                {...(booking.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                Book a {TERMS.calls.fitCallMinutes}-minute video call
              </a>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              About scope, process, fit and price — not marketing advice. {TERMS.calls.hours};{' '}
              {TERMS.contact.bookingUrl
                ? 'the booking page shows the times in your own time zone.'
                : `email ${TERMS.contact.hello} with a few times that suit you.`}
            </p>
          </li>
        </ul>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We don&apos;t offer support by phone, WhatsApp or social media.
          </p>
          <Link href="/" className="inline-flex">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
