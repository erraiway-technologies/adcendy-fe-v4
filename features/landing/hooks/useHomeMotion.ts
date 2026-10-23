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
    // Inside a scene the whole section arrives as one (useSceneStack); a
    // second, delayed fade per element would only make it lag behind.
    if (element.closest('[data-scene]')) return;

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

/** How far back a covered section sinks once the next one fully covers it (as in globals.css). */
const SCENE_COVERED = { opacity: 0.12, scale: 0.94, liftPx: 48 };
/** An arriving section's content starts this faint and is fully there once its top is 45% up the viewport. */
const SCENE_ARRIVING = { opacity: 0.35, distance: 0.55 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Whether the browser runs scroll-linked animations itself (globals.css), or needs them scripted. */
function hasScrollTimelines(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');
}

type Scene = { element: HTMLElement; cover: HTMLElement | null; content: HTMLElement | null };

function findScenes(): Scene[] {
  return [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((element) => ({
    element,
    cover: element.querySelector<HTMLElement>(':scope > .home-scene-cover'),
    content: element.querySelector<HTMLElement>(':scope > .home-scene-cover > .home-scene-content'),
  }));
}

/**
 * Turns the page into a stack of scenes. Every `[data-scene]` section is
 * sticky (from CSS): this sets where each holds, at the top or, when taller
 * than the viewport, once its end is in view, and stacks it above the one
 * before. As the next section slides over it, the held one sinks back
 * (fades, shrinks, lifts); an arriving one's content brightens.
 *
 * Where the browser has scroll timelines, globals.css runs those transitions
 * against the scroll itself, smoothly and off the main thread; this only names
 * the timelines and sets their ranges, again whenever the page's size
 * changes. Elsewhere it scripts them once a frame, reading every position
 * before writing any style. With reduced motion nothing is held or moved, and
 * the server's HTML is the plain page.
 */
export function useSceneStack(): void {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const scenes = findScenes();
    const parent = scenes[0]?.element.parentElement;
    const timelines = hasScrollTimelines();

    const clear = () => {
      for (const { element, cover, content } of scenes) {
        element.style.removeProperty('top');
        element.style.removeProperty('z-index');
        delete element.dataset.sceneReady;
        delete element.dataset.sceneNext;
        cover?.style.removeProperty('opacity');
        cover?.style.removeProperty('transform');
        content?.style.removeProperty('opacity');
      }
    };
    if (scenes.length === 0 || reducedMotion) {
      clear();
      return;
    }

    // Where each holds, and (with scroll timelines) the ranges the CSS runs over.
    const layout = () => {
      const viewport = window.innerHeight || 800;
      const heights = scenes.map(({ element }) => element.offsetHeight);
      scenes.forEach(({ element }, index) => {
        const height = heights[index]!;
        element.style.top = `${Math.min(0, viewport - height)}px`;
        element.style.zIndex = String(index + 1);
        if (!timelines) return;
        element.style.setProperty('view-timeline-name', `--scene-${index}`);
        element.style.setProperty('--scene-timeline', `--scene-${index}`);
        element.style.setProperty(
          '--scene-arrive-range',
          `cover 0px cover ${Math.round(viewport * SCENE_ARRIVING.distance)}px`,
        );
        element.dataset.sceneReady = '';
        if (index < scenes.length - 1) {
          // Covered from the moment the next one rises into this one: at its
          // foot when it is short, at the viewport's foot when it is tall.
          const reach = Math.min(viewport, height);
          element.style.setProperty('--scene-next-timeline', `--scene-${index + 1}`);
          element.style.setProperty('--scene-cover-range', `cover ${Math.round(viewport - reach)}px cover ${viewport}px`);
          element.dataset.sceneNext = '';
        }
      });
      // The next scene's timeline is a sibling's: in scope from the parent.
      parent?.style.setProperty('timeline-scope', scenes.map((_, index) => `--scene-${index}`).join(', '));
    };

    // Without scroll timelines: the same transitions, scripted.
    let frame = 0;
    const paint = () => {
      frame = 0;
      const viewport = window.innerHeight || 800;
      const tops = scenes.map(({ element }) => element.getBoundingClientRect().top);
      const heights = scenes.map(({ element }) => element.offsetHeight);
      scenes.forEach(({ cover, content }, index) => {
        const nextTop = tops[index + 1];
        const covered = nextTop === undefined ? 0 : clamp01(1 - nextTop / Math.min(viewport, heights[index]!));
        const arriving = clamp01((viewport - tops[index]!) / (viewport * SCENE_ARRIVING.distance));
        if (content) {
          const opacity = SCENE_ARRIVING.opacity + (1 - SCENE_ARRIVING.opacity) * arriving;
          content.style.opacity = opacity >= 0.999 ? '' : opacity.toFixed(3);
        }
        if (cover) {
          cover.style.transformOrigin = 'center top';
          cover.style.opacity = covered ? (1 - (1 - SCENE_COVERED.opacity) * covered).toFixed(3) : '';
          cover.style.transform = covered
            ? `translateY(${(-covered * SCENE_COVERED.liftPx).toFixed(1)}px) scale(${(1 - covered * (1 - SCENE_COVERED.scale)).toFixed(4)})`
            : '';
        }
      });
    };
    const schedulePaint = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const relayout = () => {
      layout();
      if (!timelines) schedulePaint();
    };

    relayout();
    window.addEventListener('resize', relayout);
    if (!timelines) window.addEventListener('scroll', schedulePaint, { passive: true });
    // A section that changes height without a scroll (an FAQ answer opening) holds elsewhere.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout);
    scenes.forEach(({ element }) => observer?.observe(element));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', relayout);
      window.removeEventListener('scroll', schedulePaint);
      observer?.disconnect();
      clear();
    };
  }, [reducedMotion]);
}
