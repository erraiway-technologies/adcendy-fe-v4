'use client';

import { callBookingLink } from '@/shared/marketing/business-terms';
import { HOME_CLOSING, HOME_CTA_LABEL } from '../../content/home';
import { useStrategyCta } from '../../hooks/useStrategyCta';
import { Reveal } from './Reveal';
import { PrimaryLink } from './primitives';

/** The closing call to action: one line, the button, and a call for anyone not ready. */
export function ClosingCta() {
  const ctaHref = useStrategyCta();
  const booking = callBookingLink();

  return (
    <section className="border-t border-white/8">
      <Reveal className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 px-10 py-[clamp(96px,11vw,152px)] text-center max-sm:px-6">
        <h2 className="text-[clamp(40px,5.2vw,72px)] leading-[1.04] font-medium tracking-[-.03em]">
          {HOME_CLOSING.heading}
        </h2>
        <p className="text-lg text-(--home-text-3)">{HOME_CLOSING.note}</p>
        <div className="mt-2 flex flex-col items-center gap-4">
          <PrimaryLink href={ctaHref} className="px-6 py-4 text-[17px]">
            {HOME_CTA_LABEL}
          </PrimaryLink>
          <a
            href={booking.href}
            {...(booking.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-base text-(--home-text-3) underline decoration-white/25 underline-offset-4 hover:decoration-white"
          >
            {HOME_CLOSING.callLabel}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
