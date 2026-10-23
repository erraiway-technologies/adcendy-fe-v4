'use client';

import { useSceneFades } from '../../hooks/useHomeMotion';

/** The dusk sky, held still: cool light from the top left, warmth low on the right. */
const BACKDROP = [
  'radial-gradient(1100px 760px at 8% -8%, rgba(138,154,184,.13), transparent 62%)',
  'radial-gradient(1200px 820px at 92% 108%, rgba(232,172,132,.11), transparent 62%)',
  'linear-gradient(180deg, #1C1E23 0%, #212226 45%, #1F1E1E 100%)',
].join(',');

/**
 * The public site's fixed backdrop: the page's sections scroll over it, each
 * fading in from below and out at the top (useSceneFades), so the content
 * moves while the background stays. Needs `isolation: isolate` on .home-page
 * to sit above its background and below everything else.
 */
export function PageBackdrop() {
  useSceneFades();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" style={{ background: BACKDROP }}>
      <div className="absolute inset-0 bg-[url('/textures/grain.png')] opacity-40 mix-blend-overlay" />
    </div>
  );
}
