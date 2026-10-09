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
