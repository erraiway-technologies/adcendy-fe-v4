'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

/**
 * The homepage's shared pieces: one column width, one heading scale, one pair
 * of buttons and one accordion, so every section reads as the same page.
 */

export const H2 = 'text-[clamp(36px,4vw,56px)] leading-[1.05] font-medium tracking-[-.025em] text-balance';
export const MONO_LABEL = 'font-geist-mono text-xs tracking-[.06em] text-(--home-text-4) uppercase';

/** A section of the page: 1280px column, 40px sides, generous space above. */
export function HomeSection({
  id,
  className,
  children,
  ...props
}: ComponentProps<'section'>) {
  return (
    <section
      id={id}
      className={cn('mx-auto max-w-[1280px] scroll-mt-[90px] px-10 pt-[200px] max-sm:px-6', className)}
      {...props}
    >
      {children}
    </section>
  );
}

/** The heading row most sections open with: title left, a line of context right. */
export function SectionHeader({
  title,
  intro,
  className,
}: {
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-14 flex flex-wrap items-end justify-between gap-x-12 gap-y-5', className)}>
      <Reveal>
        <h2 className={cn(H2, 'max-w-[22ch]')}>{title}</h2>
      </Reveal>
      {intro && (
        <Reveal delay={100}>
          <p className="max-w-[40ch] text-[17px] leading-[1.55] text-(--home-text-3)">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

const PRIMARY =
  'home-button-primary inline-flex items-center justify-center rounded-md bg-white px-5 py-3.5 text-base whitespace-nowrap text-(--home-button-text) hover:bg-(--home-button-hover) motion-safe:transition-colors motion-safe:duration-300';
const SECONDARY =
  'inline-flex items-center justify-center rounded-md border border-white/18 px-5 py-3.5 text-base whitespace-nowrap hover:bg-white/5 motion-safe:transition-colors motion-safe:duration-300';

export function PrimaryLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn(PRIMARY, className)} {...props} />;
}

/** An outline link. `external` opens it in a new tab. */
export function SecondaryLink({
  className,
  external = false,
  ...props
}: ComponentProps<typeof Link> & { external?: boolean }) {
  return (
    <Link
      className={cn(SECONDARY, className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    />
  );
}

/** A ✓ / – list on hairlines, as in the pricing card. */
export function MarkedList({
  items,
  mark = '✓',
  className,
}: {
  items: readonly string[];
  mark?: '✓' | '–';
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-col', className)}>
      {items.map((item) => (
        <li
          key={item}
          className="grid grid-cols-[28px_1fr] gap-2 border-t border-white/8 py-4 text-base leading-normal text-(--home-nav-link)"
        >
          <span aria-hidden="true" className="text-(--home-text-4)">
            {mark}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export type AccordionItem = {
  question: string;
  answer: ReactNode;
  /** A mono line under the answer. */
  reference?: string;
  /** Lets a link land on, and open, this entry. */
  id?: string;
};

/**
 * Numbered questions on hairlines; one open at a time, all closed at first.
 * `open` / `onOpenChange` let the parent open one (a deep link).
 */
export function QuestionList({
  items,
  idPrefix,
  open: controlledOpen,
  onOpenChange,
}: {
  items: readonly AccordionItem[];
  idPrefix: string;
  open?: number;
  onOpenChange?: (index: number) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(-1);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <div className="flex flex-col border-b border-white/10">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${idPrefix}-${index}`;
        return (
          <Reveal key={item.question} id={item.id} className="scroll-mt-[90px] border-t border-white/10">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
                className={cn(
                  'grid w-full cursor-pointer grid-cols-[48px_1fr_32px] items-center gap-4 py-[30px] text-left hover:text-white motion-safe:transition-colors motion-safe:duration-300 max-sm:grid-cols-[32px_1fr_24px] max-sm:gap-3',
                  isOpen ? 'text-white' : 'text-(--home-text-2)',
                )}
              >
                <span className="font-geist-mono text-[13px] text-(--home-text-4)">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[clamp(22px,2.6vw,34px)] leading-[1.2] tracking-[-.015em]">{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'justify-self-end text-2xl font-light motion-safe:[transition:transform_.45s_var(--home-ease)]',
                    isOpen && 'rotate-45',
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-label={item.question}
              inert={!isOpen}
              className={cn(
                'grid motion-safe:[transition:grid-template-rows_.55s_var(--home-ease)]',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-[48px_1fr] gap-4 pr-12 pb-8 max-sm:grid-cols-[32px_1fr] max-sm:gap-3 max-sm:pr-0">
                  <span />
                  <div className="flex max-w-[62ch] flex-col gap-3.5">
                    <p className="text-lg leading-[1.6] text-(--home-text-2)">{item.answer}</p>
                    {item.reference && (
                      <p className="font-geist-mono text-xs text-(--home-text-4)">{item.reference}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
