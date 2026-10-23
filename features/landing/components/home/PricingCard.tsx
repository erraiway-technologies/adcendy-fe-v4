'use client';

import { SectionLink } from '@/components/nav/section-link';
import { cn } from '@/lib/utils';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import {
  bundleOriginalPrice,
  marketCountDescription,
  marketCountLabel,
  separatePilotPackages,
} from '@/shared/payments/market-catalogue';
import { BUSINESS_TERMS, REFUND_GUARANTEE_TEXT, callBookingLink } from '@/shared/marketing/business-terms';
import type { BillingBundle, BillingPilotOffer } from '@/shared/types/billing';
import { HOME_PRICING as C } from '../../content/home';
import { useStrategyCta } from '../../hooks/useStrategyCta';
import { LANDING_SUB_TARGETS } from '../../landing-sections';
import { Reveal } from './Reveal';
import { HomeSection, MONO_LABEL, PrimaryLink, SecondaryLink, SectionHeader } from './primitives';

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4';
const CARD = 'flex h-full flex-col gap-8 rounded-xl border p-7';
const LINK = 'text-white underline decoration-white/30 underline-offset-4 hover:decoration-white';

/**
 * Pricing, top to bottom: what one market means, the pilot while it runs, the
 * live packages for where the visitor is (the catalogue checkout uses) with a
 * quote for more markets, then what every market includes beside the refund
 * guarantee, and a call for anyone not sure yet.
 */
export function PricingCard() {
  const booking = callBookingLink();
  const checkoutHref = useStrategyCta('checkout');

  return (
    <HomeSection id="pricing">
      <SectionHeader
        eyebrow={C.eyebrow}
        title={C.heading}
        intro={
          <>
            {C.body}{' '}
            <SectionLink sectionId={LANDING_SUB_TARGETS.oneMarket.id} className={LINK}>
              {C.marketRuleLink}
            </SectionLink>
          </>
        }
      />

      <LivePackages checkoutHref={checkoutHref} />

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <Reveal className="rounded-xl border border-white/10 bg-(--home-surface) p-[clamp(28px,3.5vw,40px)]">
          <span className={MONO_LABEL}>{C.includesHeading}</span>
          <ul className="mt-6 flex flex-col gap-4">
            {C.includes.map((item) => (
              <li key={item} className="grid grid-cols-[24px_1fr] gap-2 text-base leading-[1.5] text-(--home-nav-link)">
                <span aria-hidden="true" className="text-white">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal
          delay={100}
          className="flex flex-col gap-4 rounded-xl border border-white/10 p-[clamp(28px,3.5vw,40px)]"
        >
          <span className={MONO_LABEL}>{C.guaranteeHeading}</span>
          <p className="text-base leading-[1.65] text-(--home-text-2)">{REFUND_GUARANTEE_TEXT}</p>
        </Reveal>
      </div>

      <Reveal className="mt-12 flex flex-col gap-2 text-base text-(--home-text-3)">
        <p>
          {C.callLead}{' '}
          <a
            href={booking.href}
            {...(booking.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={LINK}
          >
            {C.callLabel}
          </a>
          .
        </p>
        <p>
          {C.partnership.lead}{' '}
          <a href={BUSINESS_TERMS.contact.quoteBookingUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
            {C.partnership.link}
          </a>{' '}
          {C.partnership.tail}
        </p>
      </Reveal>
    </HomeSection>
  );
}

function LivePackages({ checkoutHref }: { checkoutHref: string }) {
  const catalogue = usePublicCatalogue();
  const pilotOffer = catalogue.data?.pilotOffer ?? null;
  const packages = catalogue.data?.items ?? [];
  const { pilot, regular } = separatePilotPackages(packages, pilotOffer);
  const unavailable = catalogue.isError || (catalogue.isSuccess && packages.length === 0);

  if (catalogue.isPending) {
    return (
      <div className={GRID} aria-label="Loading prices">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 rounded-xl border border-white/8 bg-(--home-surface) motion-safe:animate-pulse" />
        ))}
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-xl border border-white/10 p-6">
        <p className="text-base text-(--home-text-3)">Live pricing is temporarily unavailable.</p>
        <button type="button" onClick={() => void catalogue.refetch()} className={cn('mt-3 cursor-pointer text-base', LINK)}>
          Retry loading prices
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pilotOffer && pilot.length > 0 && <PilotStrip offer={pilotOffer} bundles={pilot} href={checkoutHref} />}
      <div className={GRID}>
        {regular.map((bundle, i) => (
          <PackageCard key={bundle.sku} bundle={bundle} href={checkoutHref} primary={i === 0} delay={i * 80} />
        ))}
        <CustomQuoteCard delay={regular.length * 80} />
      </div>
    </div>
  );
}

/** The pilot, while it runs: its price for each package, set apart above the regular prices. */
function PilotStrip({ offer, bundles, href }: { offer: BillingPilotOffer; bundles: BillingBundle[]; href: string }) {
  return (
    <Reveal className="flex flex-col gap-5 rounded-xl border border-white/40 bg-(--home-surface) p-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="rounded-full bg-white px-3 py-1 font-geist-mono text-xs text-(--home-button-text) uppercase">
          {offer.label}
        </span>
        <span className="text-sm text-(--home-text-3)">
          {offer.soldOut
            ? 'The pilot is full. Regular prices apply.'
            : `${offer.note ?? 'Pilot pricing'} — for a limited number of clients. Everyone after them pays the regular price.`}
        </span>
      </div>
      {bundles.map((bundle) => {
        const original = bundleOriginalPrice(bundle);
        return (
          <div key={bundle.sku} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[22px] tracking-[-.01em]">{marketCountLabel(bundle.credits)}</span>
              <span className="text-[34px] leading-none tracking-[-.03em]">{formatMinorAmount(bundle)}</span>
              {original && (
                <span className="text-sm text-(--home-text-3)">
                  <span className="line-through">{formatMinorAmount(original)}</span>
                  {bundle.discountPercent ? <span className="ml-2 text-white">Save {bundle.discountPercent}%</span> : null}
                </span>
              )}
            </div>
            {offer.soldOut ? (
              <span className="text-base text-(--home-text-3)">All pilot seats are taken</span>
            ) : (
              <PrimaryLink href={href}>{C.pilotCta}</PrimaryLink>
            )}
          </div>
        );
      })}
    </Reveal>
  );
}

/** One priced package; the first is the way in, so its button leads. */
function PackageCard({
  bundle,
  href,
  primary,
  delay,
}: {
  bundle: BillingBundle;
  href: string;
  primary: boolean;
  delay: number;
}) {
  const original = bundleOriginalPrice(bundle);
  const Button = primary ? PrimaryLink : SecondaryLink;
  return (
    <Reveal delay={delay} className={cn(CARD, 'border-white/10 bg-(--home-surface)')}>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[22px] tracking-[-.01em]">{marketCountLabel(bundle.credits)}</h3>
        <p className="text-sm leading-[1.5] text-(--home-text-3)">{marketCountDescription(bundle.credits)}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[44px] leading-none tracking-[-.03em]">{formatMinorAmount(bundle)}</p>
        <p className="font-geist-mono text-xs text-(--home-text-4)">
          {original ? (
            <>
              <span className="line-through">{formatMinorAmount(original)}</span>
              {bundle.discountPercent ? <span className="ml-2 text-white">Save {bundle.discountPercent}%</span> : null}
              {' · '}
            </>
          ) : null}
          one-time
        </p>
      </div>
      <Button href={href} className="mt-auto w-full">
        {bundle.credits === 1 ? 'Start one market' : 'Choose this package'}
      </Button>
    </Reveal>
  );
}

/** The multi-market quote, in a package card's shape, with "Let's talk" for a price. */
function CustomQuoteCard({ delay }: { delay: number }) {
  const q = C.customQuote;
  return (
    <Reveal delay={delay} className={cn(CARD, 'border-dashed border-white/18')}>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[22px] tracking-[-.01em]">{q.title}</h3>
        <p className="text-sm leading-[1.5] text-(--home-text-3)">{q.body}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[44px] leading-none tracking-[-.03em]">{q.price}</p>
        <p className="font-geist-mono text-xs text-(--home-text-4)">{q.priceNote}</p>
      </div>
      <SecondaryLink href={BUSINESS_TERMS.contact.quoteBookingUrl} external className="mt-auto w-full">
        {q.cta}
      </SecondaryLink>
    </Reveal>
  );
}
