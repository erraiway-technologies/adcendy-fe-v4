'use client';

import { useSceneStack } from '../../hooks/useHomeMotion';

/**
 * The public site's fixed backdrop (--home-backdrop), and the scene stack
 * that runs over it: each section slides up over the one before, which holds
 * still and fades back (useSceneStack). Needs `isolation: isolate` on
 * .home-page to sit above its background and below everything else.
 */
export function PageBackdrop() {
  useSceneStack();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-(image:--home-backdrop)">
      <div className="absolute inset-0 bg-[url('/textures/grain.png')] opacity-40 mix-blend-overlay" />
    </div>
  );
}
