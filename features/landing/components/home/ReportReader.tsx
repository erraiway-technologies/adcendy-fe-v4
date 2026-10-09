'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HOME_INSIDE } from '../../content/home';
import { chapterNumber, type SampleReport } from '../../content/sample-report';
import { usePrefersReducedMotion } from '../../hooks/useHomeMotion';
import { Reveal } from './Reveal';
import { ReportPage } from './ReportPage';

/** How long each chapter shows before the reader turns the page. */
const CHAPTER_MS = 6000;

/**
 * "Inside a strategy": a chapter list beside one sample page at a time. It
 * turns the page every six seconds, with each chapter's bar filling to show
 * when, until the reader picks a chapter. With reduced motion it never turns
 * by itself and pages swap without a transition.
 */
export function ReportReader({ report }: { report: SampleReport }) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const playing = autoplay && !reducedMotion;
  const chapters = report.chapters;

  const pick = (index: number) => {
    setActive(index);
    setAutoplay(false);
  };

  return (
    <section
      id="inside"
      className="mx-auto max-w-[1280px] scroll-mt-[90px] px-10 pt-[180px] max-sm:px-6"
    >
      <div className="mb-14 flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
        <Reveal>
          <h2 className="text-[clamp(36px,4vw,56px)] leading-[1.05] font-medium tracking-[-.025em]">
            {HOME_INSIDE.heading}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="max-w-[40ch] text-[17px] leading-[1.55] text-(--home-text-3)">{HOME_INSIDE.intro}</p>
        </Reveal>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-10">
        <Reveal className="flex max-w-[380px] flex-col">
          {chapters.map((chapter, index) => {
            const isActive = index === active;
            return (
              <button
                key={chapter.title}
                type="button"
                onClick={() => pick(index)}
                aria-controls={`sample-page-${index}`}
                aria-current={isActive ? 'true' : undefined}
                className="flex cursor-pointer flex-col gap-2.5 border-t border-white/8 pt-[18px] pb-4 text-left"
              >
                <span
                  className={cn(
                    'flex items-baseline gap-3.5 motion-safe:transition-colors motion-safe:duration-400',
                    isActive ? 'text-white' : 'text-(--home-text-5)',
                  )}
                >
                  <span className="font-geist-mono text-xs">{chapterNumber(index)}</span>
                  <span className="flex flex-col gap-1">
                    <span className="text-[20px] tracking-[-.01em]">{chapter.title}</span>
                    <span className="text-sm text-(--home-text-5)">{chapter.summary}</span>
                  </span>
                </span>
                <span aria-hidden="true" className="block h-px overflow-hidden bg-white/8">
                  {isActive && (
                    <span
                      // A fresh bar for each page, so its fill restarts.
                      key={`${index}-${playing}`}
                      className="block h-full origin-left bg-white"
                      style={
                        playing
                          ? { animation: `home-chapter-progress ${CHAPTER_MS}ms linear forwards` }
                          : undefined
                      }
                      onAnimationEnd={() => setActive((current) => (current + 1) % chapters.length)}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </Reveal>

        <Reveal delay={120} className="col-span-2 grid min-h-[560px] max-[720px]:col-span-1">
          {chapters.map((chapter, index) => {
            const isActive = index === active;
            return (
              <div
                key={chapter.title}
                id={`sample-page-${index}`}
                aria-hidden={!isActive}
                inert={!isActive}
                className={cn(
                  '[grid-area:1/1]',
                  'motion-safe:[transition:opacity_.5s_ease,transform_.7s_var(--home-ease)]',
                  isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
                  !isActive && (index < active ? '-translate-y-3' : 'translate-y-3'),
                )}
              >
                <ReportPage
                  chapter={chapter}
                  number={chapterNumber(index)}
                  company={report.company}
                  market={report.market}
                />
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
