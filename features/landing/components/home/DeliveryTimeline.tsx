'use client';

import { useRef } from 'react';
import { HOME_TIMELINE } from '../../content/home';
import { usePrefersReducedMotion, useScrollFrame } from '../../hooks/useHomeMotion';
import { Reveal } from './Reveal';

const NODE_OFF = { background: '#232323', borderColor: 'rgba(255,255,255,.4)' };
const NODE_ON = { background: '#FFFFFF', borderColor: '#FFFFFF' };

/**
 * "Four days, in writing": a line fills across the steps as the section
 * scrolls through, lighting each day's node as it passes. With reduced motion
 * the line is simply full.
 */
export function DeliveryTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reducedMotion = usePrefersReducedMotion();

  useScrollFrame(() => {
    const section = sectionRef.current;
    const fill = fillRef.current;
    if (!section || !fill) return;
    const vh = window.innerHeight || 800;
    const rect = section.getBoundingClientRect();
    const progress = reducedMotion
      ? 1
      : Math.min(1, Math.max(0, (vh * 0.7 - rect.top) / (rect.height * 0.75)));
    fill.style.transform = `scaleX(${progress})`;
    const nodes = nodeRefs.current;
    nodes.forEach((node, i) => {
      if (!node) return;
      const on = progress > 0 && progress >= i / Math.max(1, nodes.length - 1) - 0.001;
      Object.assign(node.style, on ? NODE_ON : NODE_OFF);
    });
  });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="mx-auto max-w-[1280px] scroll-mt-[90px] px-10 pt-[200px] max-sm:px-6"
    >
      <div className="mb-16 flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
        <Reveal>
          <h2 className="text-[clamp(36px,4vw,56px)] leading-[1.05] font-medium tracking-[-.025em]">
            {HOME_TIMELINE.heading}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="max-w-[38ch] text-[17px] leading-[1.55] text-(--home-text-3)">{HOME_TIMELINE.intro}</p>
        </Reveal>
      </div>
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-x-0 top-[5px] h-px bg-white/12" />
        <div
          ref={fillRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-[5px] h-px origin-left bg-white"
          // Set as transform, not Tailwind's scale-x-0 (the `scale` property),
          // which would multiply with the scaleX written on scroll.
          style={{ transform: 'scaleX(0)' }}
        />
        <ol className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-6 gap-y-10">
          {HOME_TIMELINE.steps.map((step, i) => (
            <li key={step.day} className="flex flex-col gap-3.5">
              <span
                ref={(node) => {
                  nodeRefs.current[i] = node;
                }}
                aria-hidden="true"
                className="size-[11px] rounded-full border motion-safe:[transition:background-color_.4s,border-color_.4s]"
                style={NODE_OFF}
              />
              <span className="mt-3.5 font-geist-mono text-[13px] text-(--home-text-3)">{step.day}</span>
              <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{step.title}</span>
              <span className="text-base leading-[1.55] text-(--home-text-3)">{step.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
