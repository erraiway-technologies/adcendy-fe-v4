'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';

type SectionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  sectionId: string;
};

/**
 * Where `target` sits in the page's own flow, less its scroll margin. The
 * homepage's sections are sticky scenes, so one already passed is held at
 * the top and its on-screen position says nothing about where it lives: a
 * scene's place is where its parent starts plus the scenes before it, and a
 * target inside one is offset from that by its offsetTop chain.
 */
function flowTop(target: HTMLElement): number {
  const scrollMargin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const scene = target.closest<HTMLElement>('[data-scene]');
  const parent = scene?.parentElement;
  if (!scene || !parent || getComputedStyle(scene).position !== 'sticky') {
    return target.getBoundingClientRect().top + window.scrollY - scrollMargin;
  }
  let sceneTop = parent.getBoundingClientRect().top + window.scrollY;
  for (const sibling of parent.children) {
    if (sibling === scene) break;
    sceneTop += (sibling as HTMLElement).offsetHeight;
  }
  let inside = 0;
  for (let node: Element | null = target; node && node !== scene; node = (node as HTMLElement).offsetParent) {
    inside += (node as HTMLElement).offsetTop;
  }
  return sceneTop + inside - scrollMargin;
}

/**
 * A link to a landing-page section that works every time it is clicked.
 *
 * A plain `/#pricing` link does nothing once `#pricing` is already in the URL,
 * so a second click — or two links sharing a section — left the reader where
 * they were. On the landing page this scrolls to the section itself and
 * announces the hash, so anything listening (the FAQ opening a deep-linked
 * answer) hears it even when the hash has not changed. Anywhere else it is an
 * ordinary navigation to '/', which lands on the section by itself.
 */
export function SectionLink({ sectionId, onClick, ...props }: SectionLinkProps) {
  const pathname = usePathname();
  const href = `/#${sectionId}`;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || pathname !== '/') return;
    // Leave new-tab and new-window clicks to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = document.getElementById(sectionId);
    if (!target) return;

    event.preventDefault();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: flowTop(target), behavior: reducedMotion ? 'auto' : 'smooth' });
    if (window.location.hash !== `#${sectionId}`) {
      window.history.pushState(null, '', href);
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
