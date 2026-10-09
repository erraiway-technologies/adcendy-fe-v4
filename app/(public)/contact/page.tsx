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

const ROW = 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-x-10 gap-y-2 border-t border-white/10 py-7';
const LABEL = 'text-base text-(--home-text-3)';
const LINK = 'text-[clamp(20px,2.2vw,26px)] tracking-[-.01em] text-white underline decoration-white/25 underline-offset-[6px] hover:decoration-white';

export default function ContactPage() {
  const booking = callBookingLink();

  return (
    <main className="mx-auto max-w-[1280px] px-10 pt-[160px] max-sm:px-6">
      <span className="font-geist-mono text-xs tracking-[.06em] text-(--home-text-4) uppercase">Contact</span>
      <h1 className="mt-4 text-[clamp(44px,5.6vw,86px)] leading-[1.08] font-normal tracking-[-.02em]">Talk to us</h1>
      <p className="mt-6 max-w-[52ch] text-lg leading-[1.6] text-(--home-text-2)">
        We work in writing: email is our channel of record, and we reply within {TERMS.contact.replyWithin} (Monday
        to Friday, excluding public holidays in India).
      </p>

      <ul className="mt-16 border-b border-white/10">
        {CHANNELS.map((channel) => (
          <li key={channel.email} className={ROW}>
            <p className={LABEL}>{channel.label}</p>
            <p>
              <a href={`mailto:${channel.email}`} className={LINK}>
                {channel.email}
              </a>
              {channel.note && <span className="mt-1 block text-sm text-(--home-text-4)">{channel.note}</span>}
            </p>
          </li>
        ))}
        <li className={ROW}>
          <p className={LABEL}>Prefer to talk first?</p>
          <div>
            <a
              href={booking.href}
              className={LINK}
              {...(booking.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              Book a {TERMS.calls.fitCallMinutes}-minute video call
            </a>
            <p className="mt-2 text-sm leading-[1.55] text-(--home-text-4)">
              About scope, process, fit and price — not marketing advice. {TERMS.calls.hours};{' '}
              {TERMS.contact.bookingUrl
                ? 'the booking page shows the times in your own time zone.'
                : `email ${TERMS.contact.hello} with a few times that suit you.`}
            </p>
          </div>
        </li>
        <li className={ROW}>
          <p className={LABEL}>Several markets, or an agency partnership?</p>
          <div>
            <a href={TERMS.contact.quoteBookingUrl} className={LINK} target="_blank" rel="noopener noreferrer">
              Book a {TERMS.calls.quoteCallMinutes}-minute call for a quote
            </a>
            <p className="mt-2 text-sm leading-[1.55] text-(--home-text-4)">
              We scope the countries or the partnership with you and price the package. Same hours; or email{' '}
              {TERMS.contact.hello}.
            </p>
          </div>
        </li>
      </ul>

      <p className="mt-8 font-geist-mono text-xs text-(--home-text-4)">
        We don&apos;t offer support by phone, WhatsApp or social media.
      </p>
    </main>
  );
}
