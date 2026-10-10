'use client';

import { useEffect, useState } from 'react';
import brandMark from '@/shared/brand/adcendy-mark.svg';

/** Reveal the page even if something is slow; nobody waits longer than this. */
const MAX_WAIT_MS = 4000;
/** Matches the .brand-splash opacity transition in globals.css. */
const FADE_MS = 350;

type SplashPhase = 'showing' | 'leaving' | 'gone';

/** Fired on window when the splash starts to fade out. */
const SPLASH_LEAVING_EVENT = 'brand-splash:leaving';

/**
 * Runs `callback` once the page can be seen: now if there is no splash (a
 * client-side navigation) or it is already fading, otherwise when it starts to
 * fade. For entrance animations that would otherwise play unseen beneath it.
 * Returns a function that cancels the wait.
 */
export function whenBrandSplashLeaves(callback: () => void): () => void {
  const splash = document.getElementById('brand-splash');
  if (!splash || splash.classList.contains('brand-splash--leaving')) {
    callback();
    return () => {};
  }
  window.addEventListener(SPLASH_LEAVING_EVENT, callback, { once: true });
  return () => window.removeEventListener(SPLASH_LEAVING_EVENT, callback);
}

/**
 * The first thing on screen on a fresh load: the AdCendy mark, breathing on
 * the page background, over the server-rendered page. It is in the server's
 * HTML and animates in CSS, so it shows before any JavaScript arrives. Once the
 * page is ready - React running, fonts loaded, every stylesheet and image in,
 * layout settled - it fades out once and the finished page is simply there, so
 * visitors never watch text arrive, restyle or move. The page's content stays
 * in the HTML underneath for search engines and link previews.
 *
 * Only the first load: client-side navigation keeps the layout mounted.
 */
export function BrandSplash() {
  const [phase, setPhase] = useState<SplashPhase>('showing');

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setPhase((current) => (current === 'showing' ? 'leaving' : current));
    };

    // This effect runs after hydration, so every server-rendered section's
    // code is already loaded. Wait for what can still move the layout.
    const loaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const settled = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const timer = window.setTimeout(reveal, MAX_WAIT_MS);
    void Promise.all([loaded, fonts]).then(settled).then(reveal);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'leaving') return;
    window.dispatchEvent(new Event(SPLASH_LEAVING_EVENT));
    const timer = window.setTimeout(() => setPhase('gone'), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      id="brand-splash"
      className={phase === 'leaving' ? 'brand-splash brand-splash--leaving' : 'brand-splash'}
      role="status"
      aria-label="Loading AdCendy"
    >
      {/* A plain <img>: it must load from the HTML alone, before any script. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-splash__logo" src={brandMark.src} alt="" width={96} height={96} />
    </div>
  );
}
