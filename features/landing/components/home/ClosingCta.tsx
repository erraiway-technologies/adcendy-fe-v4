'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { callBookingLink } from '@/shared/marketing/business-terms';
import { HOME_CLOSING, HOME_CTA_LABEL } from '../../content/home';
import { prefersReducedMotion } from '../../hooks/useHomeMotion';
import { useStrategyCta } from '../../hooks/useStrategyCta';
import { Reveal } from './Reveal';

/**
 * The closing call to action, under a line that runs flat from "Today" and
 * then climbs to a glowing point. The line draws itself in the first time it
 * is scrolled to; with reduced motion it is simply there.
 */
export function ClosingCta() {
  const pathRef = useRef<SVGPathElement>(null);
  const ctaHref = useStrategyCta();
  const booking = callBookingLink();

  useEffect(() => {
    const path = pathRef.current;
    if (!path || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        animation = path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: 2400,
          delay: 200,
          easing: 'cubic-bezier(.6,0,.2,1)',
          fill: 'backwards',
        });
      },
      // Once its top is within 90% of the viewport's height.
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(path);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, []);

  return (
    <section className="mx-auto max-w-[1280px] px-10 pt-[220px] max-sm:px-6">
      <Reveal>
        <h2 className="max-w-[14ch] text-[clamp(40px,5.2vw,76px)] leading-[1.04] font-medium tracking-[-.03em]">
          {HOME_CLOSING.heading}
        </h2>
        <p className="mt-6 max-w-[44ch] text-[17px] leading-[1.55] text-(--home-text-3)">{HOME_CLOSING.subline}</p>
      </Reveal>
      <Reveal delay={120} className="relative mt-14" aria-hidden="true">
        <svg viewBox="0 0 1200 180" preserveAspectRatio="none" className="block h-[180px] w-full overflow-visible">
          <path
            ref={pathRef}
            pathLength={1}
            d="M0 160 L540 160 C660 160 720 152 800 124 S 1000 34 1192 14"
            fill="none"
            stroke="rgba(255,255,255,.7)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: 1, strokeDashoffset: 0 }}
          />
        </svg>
        <span className="absolute top-1 right-0 size-3 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.6)]" />
        <span className="absolute top-[118px] left-0 font-geist-mono text-xs text-(--home-text-4)">
          {HOME_CLOSING.lineLabel}
        </span>
      </Reveal>
      <Reveal delay={200} className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Link
          href={ctaHref}
          className="home-button-primary rounded-md bg-white px-[22px] py-[15px] text-[17px] whitespace-nowrap text-(--home-button-text) hover:bg-(--home-button-hover) motion-safe:transition-colors motion-safe:duration-300"
        >
          {HOME_CTA_LABEL}
        </Link>
        <a
          href={booking.href}
          {...(booking.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-base text-(--home-text-3) underline decoration-white/25 underline-offset-4"
        >
          {HOME_CLOSING.callLabel}
        </a>
      </Reveal>
      <Reveal delay={260}>
        <p className="mt-6 font-geist-mono text-xs text-(--home-text-4)">{HOME_CLOSING.note}</p>
      </Reveal>
    </section>
  );
}
