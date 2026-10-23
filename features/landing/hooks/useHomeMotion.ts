'use client';

import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToMotionPreference(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Whether the visitor asked for reduced motion. The server cannot know, so it
 * renders as if motion is allowed; the browser corrects that straight after
 * hydration, and follows the setting if it changes while the page is open.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/** Read once, where a hook cannot be used (animation callbacks). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** The homepage's one easing curve, for animations started from script. */
export const HOME_EASE = 'cubic-bezier(.2,.7,.2,1)';

/**
 * Calls `onFrame` after every render, and at most once per animation frame
 * while the page scrolls or resizes. For effects that follow the scroll
 * position by writing styles directly, so scrolling never re-renders React;
 * running after each render picks up a changed motion preference at once.
 */
export function useScrollFrame(onFrame: () => void): void {
  const latest = useRef(onFrame);
  useEffect(() => {
    latest.current = onFrame;
    onFrame();
  });

  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        latest.current();
      });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
}

/**
 * Fades an element up from 22px below once its top crosses 94% of the
 * viewport. The element is visible in the server's HTML and without
 * JavaScript; the animation only holds it hidden for its own delay. With
 * reduced motion it simply stays where it is.
 */
export function useScrollReveal(ref: RefObject<HTMLElement | null>, delayMs = 0): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        animation = element.animate(
          [
            { opacity: 0, transform: 'translateY(22px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 1200, delay: delayMs, easing: HOME_EASE, fill: 'backwards' },
        );
      },
      // Trigger when the top passes 94% of the viewport's height.
      { rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, [ref, delayMs]);
}

/** How far back a covered section sinks: its opacity, scale and lift once the next one fully covers it. */
const SCENE_COVERED = { opacity: 0.12, scale: 0.94, liftPx: 48 };
/** An arriving section's content starts this faint and is fully there once its top is 45% up the viewport. */
const SCENE_ARRIVING = { opacity: 0.35, distance: 0.55 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Turns the page into a stack of scenes. Every `[data-scene]` section is
 * sticky (from CSS): this sets where it holds, at the top or, when it is
 * taller than the viewport, once its end is in view, and stacks each above
 * the one before. As the next section slides up over it, the held one's
 * content fades, shrinks and lifts away; an arriving section's content
 * brightens as it comes in. Styles are written directly, so scrolling never
 * re-renders React. With reduced motion nothing is held or faded (the CSS
 * drops `sticky` too), and the server's HTML is the plain page.
 */
export function useSceneStack(): void {
  const reducedMotion = usePrefersReducedMotion();
  const update = () => {
    const viewport = window.innerHeight || 800;
    const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
    scenes.forEach((scene, index) => {
      const content = scene.firstElementChild as HTMLElement | null;
      if (reducedMotion) {
        scene.style.top = '';
        scene.style.zIndex = '';
        if (content) {
          content.style.opacity = '';
          content.style.transform = '';
        }
        return;
      }
      const height = scene.offsetHeight;
      scene.style.top = `${Math.min(0, viewport - height)}px`;
      scene.style.zIndex = String(index + 1);
      if (!content) return;

      // Covered from the moment the next section rises into this one: at its
      // foot for a short section, at the viewport's foot for a tall one.
      const next = scenes[index + 1];
      const reach = Math.min(viewport, height);
      const covered = next ? clamp01(1 - next.getBoundingClientRect().top / reach) : 0;
      const arriving = clamp01((viewport - scene.getBoundingClientRect().top) / (viewport * SCENE_ARRIVING.distance));
      const opacity = Math.min(
        SCENE_ARRIVING.opacity + (1 - SCENE_ARRIVING.opacity) * arriving,
        1 - (1 - SCENE_COVERED.opacity) * covered,
      );
      content.style.opacity = opacity >= 0.999 ? '' : opacity.toFixed(3);
      content.style.transformOrigin = 'center top';
      content.style.transform = covered
        ? `translateY(${(-covered * SCENE_COVERED.liftPx).toFixed(1)}px) scale(${(1 - covered * (1 - SCENE_COVERED.scale)).toFixed(4)})`
        : '';
    });
  };
  useScrollFrame(update);

  // A section that changes height without a scroll (an FAQ answer opening)
  // needs its hold point again.
  const latest = useRef(update);
  useEffect(() => {
    latest.current = update;
  });
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => latest.current());
    document.querySelectorAll('[data-scene]').forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);
}
