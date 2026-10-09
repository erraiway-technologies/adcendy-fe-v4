'use client';

import { useRef, type HTMLAttributes } from 'react';
import { useScrollReveal } from '../../hooks/useHomeMotion';

type RevealProps = HTMLAttributes<HTMLElement> & {
  /** Stagger after the element enters the viewport, in ms. */
  delay?: number;
  /** `li` for an item of a list. */
  as?: 'div' | 'li';
};

/** A block that fades up into place the first time it is scrolled to. */
export function Reveal({ delay = 0, as: Tag = 'div', ...props }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref, delay);
  // The ref is typed for both tags; React attaches it to whichever renders.
  return <Tag ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>} {...props} />;
}
