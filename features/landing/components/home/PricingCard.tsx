'use client';

import { cn } from '@/lib/utils';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import {
  bundleOriginalPrice,
  marketCountDescription,
  marketCountLabel,
  pilotSeatsLabel,
  priceGroupHeading,
  separatePilotPackages,
} from '@/shared/payments/market-catalogue';
import { BUSINESS_TERMS, PILOT_GUARANTEE_TEXT, callBookingLink } from '@/shared/marketing/business-terms';
import type { BillingBundle } from '@/shared/types/billing';
import { HOME_CTA_LABEL, HOME_PRICING as C } from '../../content/home';
import { useStrategyCta } from '../../hooks/useStrategyCta';
import { Reveal } from './Reveal';
import { HomeSection, MONO_LABEL, MarkedList, PrimaryLink, SecondaryLink } from './primitives';

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6';
const CARD = 'flex h-full flex-col gap-6 rounded-md border p-8';

/**
 * Pricing: the one-fee card, then the live packages for where the visitor is
 * (the same catalogue checkout uses), the pilot while it runs, a quote for
 * several markets, and what one market means.
 */
export function PricingCard() {
  const booking = callBookingLink();
  const checkoutHref = useStrategyCta('checkout');

  return (
    <HomeSection id="pricing">
      <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] rounded-md border border-white/10 bg-(--home-surface)">
        <div className="flex flex-col justify-between gap-10 p-[clamp(32px,4.5vw,56px)]">
          <div className="flex flex-col gap-[18px]">
            <span className={MONO_LABEL}>{C.eyebrow}</span>
            <h2 className="text-[clamp(34px,3.8vw,52px)] leading-[1.05] font-medium tracking-[-.025em]">{C.heading}</h2>
            <p className="max-w-[40ch] text-[17px] leading-[1.55] text-(--home-text-3)">{C.body}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <PrimaryLink href={checkoutHref}>{HOME_CTA_LABEL}</PrimaryLink>
            <SecondaryLink href={booking.href} external={booking.external}>
              {C.callLabel}
            </SecondaryLink>
          </div>
        </div>
        <div className="border-l border-white/8 p-[clamp(32px,4.5vw,56px)]">
          <span className={cn(MONO_LABEL, 'mb-3 block')}>{C.includesHeading}</span>
          <MarkedList items={C.includes} />
        </div>
      </Reveal>

      <LivePackages checkoutHref={checkoutHref} />

      <Reveal className="mt-20">
        <h3 className="mb-6 text-[22px] tracking-[-.01em]">{C.marketRulesHeading}</h3>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-10">
          {C.marketRules.map((rule) => (
            <li key={rule.title} className="flex flex-col gap-2.5 border-t border-white/10 pt-5">
              <span className="text-lg">{rule.title}</span>
              <span className="text-base leading-[1.6] text-(--home-text-3)">{rule.body}</span>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal>
        <p className="mt-14 text-base text-(--home-text-3)">
          {C.partnership.lead}{' '}
          <a
            href={BUSINESS_TERMS.contact.quoteBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline decoration-white/30 underline-offset-4"
          >
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
  const { isPilot } = catalogue;
  const pilotOffer = catalogue.data?.pilotOffer ?? null;
  const packages = catalogue.data?.items ?? [];
  const { pilot, regular } = separatePilotPackages(packages, pilotOffer);
  const unavailable = catalogue.isError || (catalogue.isSuccess && packages.length === 0);

  return (
    <div className="mt-20 flex flex-col gap-10">
      <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h3 className="text-[clamp(28px,3vw,40px)] leading-[1.1] font-medium tracking-[-.02em]">{C.packagesHeading}</h3>
        {pilotOffer && !pilotOffer.soldOut && (
          <span className="rounded-md border border-white/18 px-3 py-1.5 font-geist-mono text-xs text-white">
            {pilotOffer.label} — {pilotSeatsLabel(pilotOffer)}
          </span>
        )}
      </Reveal>

      {/* The guarantee is the pilot's: it leads the prices while the pilot runs. */}
      {isPilot && (
        <Reveal className="border-l-2 border-white pl-5">
          <p className="mb-1 text-base text-white">Pilot guarantee</p>
          <p className="max-w-[70ch] text-base leading-[1.6] text-(--home-text-3)">{PILOT_GUARANTEE_TEXT}</p>
        </Reveal>
      )}

      {catalogue.isPending && (
        <div className={GRID} aria-label="Loading prices">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 rounded-md border border-white/8 bg-(--home-surface) motion-safe:animate-pulse" />
          ))}
        </div>
      )}

      {unavailable && (
        <div className="rounded-md border border-white/10 p-6">
          <p className="text-base text-(--home-text-3)">Live pricing is temporarily unavailable.</p>
          <button
            type="button"
            onClick={() => void catalogue.refetch()}
            className="mt-3 cursor-pointer text-base text-white underline decoration-white/30 underline-offset-4"
          >
            Retry loading prices
          </button>
        </div>
      )}

      {catalogue.isSuccess && packages.length > 0 && (
        <>
          {pilotOffer && pilot.length > 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-lg">{priceGroupHeading(pilotOffer.label)}</p>
                <p className="text-sm text-(--home-text-3)">
                  {pilotOffer.soldOut
                    ? 'The pilot is full. Regular prices apply.'
                    : `${pilotOffer.note ?? 'Pilot pricing'} — for a limited number of clients. Everyone after them pays the regular price.`}
                </p>
              </div>
              <div className={GRID}>
                {pilot.map((bundle) => (
                  <PackageCard
                    key={bundle.sku}
                    bundle={bundle}
                    pilotLabel={pilotOffer.label}
                    soldOut={pilotOffer.soldOut}
                    href={checkoutHref}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {regular.length > 0 && pilot.length > 0 && <p className="text-lg">Regular price</p>}
            <div className={GRID}>
              {regular.map((bundle) => (
                <PackageCard key={bundle.sku} bundle={bundle} href={checkoutHref} />
              ))}
              <CustomQuoteCard />
            </div>
          </div>

          <p className="font-geist-mono text-xs text-(--home-text-4)">
            Prices from catalogue {catalogue.data?.catalogueVersion}
          </p>
        </>
      )}
    </div>
  );
}

/** One priced package; the pilot's card is set apart and shows its saving. */
function PackageCard({
  bundle,
  pilotLabel,
  soldOut = false,
  href,
}: {
  bundle: BillingBundle;
  /** Set for a pilot package. */
  pilotLabel?: string;
  soldOut?: boolean;
  href: string;
}) {
  const isPilot = pilotLabel !== undefined;
  const original = bundleOriginalPrice(bundle);
  return (
    <div className={cn(CARD, 'bg-(--home-surface)', isPilot ? 'border-white/40' : 'border-white/10')}>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[22px] tracking-[-.01em]">{marketCountLabel(bundle.credits)}</h4>
          <span className={cn(MONO_LABEL, 'rounded border border-white/14 px-1.5 py-0.5 text-[10px]')}>
            {isPilot ? pilotLabel : 'One-time'}
          </span>
        </div>
        <p className="text-sm text-(--home-text-3)">{marketCountDescription(bundle.credits)}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[40px] leading-none tracking-[-.03em]">{formatMinorAmount(bundle)}</p>
        {original && (
          <p className="text-sm text-(--home-text-3)">
            <span className="line-through">{formatMinorAmount(original)}</span>
            {bundle.discountPercent ? <span className="ml-2 text-white">Save {bundle.discountPercent}%</span> : null}
          </p>
        )}
        <p className="font-geist-mono text-xs text-(--home-text-4)">
          {isPilot ? 'pilot price, one-time purchase' : 'one-time purchase'}
        </p>
      </div>
      <div className="mt-auto">
        {soldOut ? (
          <p className="rounded-md border border-white/10 px-5 py-3.5 text-center text-base text-(--home-text-3)">
            All pilot seats are taken
          </p>
        ) : isPilot ? (
          <PrimaryLink href={href} className="w-full">
            Claim a pilot seat
          </PrimaryLink>
        ) : (
          <SecondaryLink href={href} className="w-full">
            {bundle.credits === 1 ? 'Start one market' : 'Choose this package'}
          </SecondaryLink>
        )}
      </div>
    </div>
  );
}

/** The multi-market quote, in a package card's shape, with "Let's talk" for a price. */
function CustomQuoteCard() {
  const q = C.customQuote;
  return (
    <div className={cn(CARD, 'border-white/10')}>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[22px] tracking-[-.01em]">{q.title}</h4>
          <span className={cn(MONO_LABEL, 'rounded border border-white/14 px-1.5 py-0.5 text-[10px]')}>Custom</span>
        </div>
        <p className="text-sm leading-[1.55] text-(--home-text-3)">{q.body}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[40px] leading-none tracking-[-.03em]">{q.price}</p>
        <p className="font-geist-mono text-xs text-(--home-text-4)">{q.priceNote}</p>
      </div>
      <div className="mt-auto">
        <SecondaryLink href={BUSINESS_TERMS.contact.quoteBookingUrl} external className="w-full">
          {q.cta}
        </SecondaryLink>
      </div>
    </div>
  );
}
