'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { whenBrandSplashLeaves } from '@/shared/components/BrandSplash';
import { HOME_CTA_LABEL, HOME_HERO } from '../../content/home';
import { HOME_EASE, usePrefersReducedMotion, useScrollFrame } from '../../hooks/useHomeMotion';
import { DuskRidgesCanvas } from './DuskRidgesCanvas';

const HERO_BACKGROUND =
  'linear-gradient(180deg,#1A1D23 0%,#262B34 34%,#3F4250 54%,#5B5157 62%,#2C2828 72%,#232323 100%)';

export function HomeHero({ showButton = true }: { showButton?: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Headline, subline, then button rise out of a blur, once the page is on screen.
  useEffect(() => {
    if (reducedMotion) return;
    const items = textRef.current ? [...textRef.current.querySelectorAll<HTMLElement>('[data-intro]')] : [];
    let animations: Animation[] = [];
    const stopWaiting = whenBrandSplashLeaves(() => {
      animations = items.map((item, i) =>
        item.animate(
          [
            { opacity: 0, transform: 'translateY(16px)', filter: 'blur(8px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0)' },
          ],
          { duration: 1400, delay: 200 + i * 220, easing: HOME_EASE, fill: 'backwards' },
        ),
      );
    });
    return () => {
      stopWaiting();
      animations.forEach((animation) => animation.cancel());
    };
  }, [reducedMotion]);

  // The headline drifts up at 0.28x the scroll and fades out over 60% of the viewport.
  useScrollFrame(() => {
    const hero = heroRef.current;
    const text = textRef.current;
    if (!hero || !text) return;
    if (reducedMotion) {
      text.style.transform = '';
      text.style.opacity = '';
      return;
    }
    const top = hero.getBoundingClientRect().top;
    const vh = window.innerHeight || 800;
    text.style.transform = `translateY(${-top * 0.28}px)`;
    text.style.opacity = String(Math.min(1, Math.max(0, 1 + top / (vh * 0.6))));
  });

  return (
    <section
      ref={heroRef}
      className="relative h-screen min-h-[640px] overflow-hidden"
      // Its foot dissolves into the page's backdrop.
      style={{ background: HERO_BACKGROUND, maskImage: 'linear-gradient(180deg, #000 76%, transparent)' }}
    >
      {/* Warmth at the horizon. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[62%] left-1/2 -mt-[260px] -ml-[800px] h-[520px] w-[1600px] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(232,172,132,.32), transparent)' }}
      />
      <DuskRidgesCanvas className="absolute inset-0 block size-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/textures/grain.png')] opacity-55 mix-blend-overlay"
      />

      <div
        ref={textRef}
        className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-8 pb-[16vh] text-center max-sm:px-6"
      >
        <h1
          data-intro
          className="m-0 max-w-[15ch] text-[clamp(44px,5.6vw,86px)] leading-[1.08] font-normal tracking-[-.02em] text-balance text-white"
        >
          {HOME_HERO.headline}
        </h1>
        <p
          data-intro
          className="m-0 max-w-[46ch] text-[clamp(17px,1.5vw,20px)] leading-[1.5] text-pretty text-white/75"
        >
          {HOME_HERO.subline}
        </p>
        {showButton && (
          <div data-intro className="mt-2 flex flex-col items-center gap-4">
            <Link
              href="/auth/signup"
              className="home-button-primary rounded-md bg-white px-5 py-[13px] text-base whitespace-nowrap text-(--home-button-text) hover:bg-(--home-button-hover) motion-safe:transition-colors motion-safe:duration-300"
            >
              {HOME_CTA_LABEL}
            </Link>
            <p className="m-0 font-geist-mono text-xs text-white/55">{HOME_HERO.meta}</p>
          </div>
        )}
      </div>

      {/* Scroll cue. */}
      <div
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 -ml-[.5px] h-[72px] w-px overflow-hidden bg-white/14"
      >
        <div className="home-cue h-7 w-px bg-linear-to-b from-transparent to-white" />
      </div>
    </section>
  );
}
