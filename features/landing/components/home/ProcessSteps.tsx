import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HOME_PROCESS as C, type ProcessStep } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, SectionHeader } from './primitives';

/**
 * "How your strategy is made": the steps on one rail (across from lg, down
 * below it), with the review steps that repeat boxed as a loop.
 */
export function ProcessSteps() {
  const { from, to, label } = C.loop;
  const before = C.steps.slice(0, from);
  const loop = C.steps.slice(from, to + 1);
  const after = C.steps.slice(to + 1);

  return (
    <HomeSection id="how-it-works">
      <SectionHeader eyebrow={C.eyebrow} title={C.heading} intro={C.intro} />
      <div className="relative">
        {/* The rail the step numbers sit on. */}
        <div
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-4 w-px bg-white/14 lg:right-4 lg:bottom-auto lg:h-px lg:w-auto"
        />
        <ol className="relative grid gap-x-4 lg:grid-cols-7">
          {before.map((step, i) => (
            <Step key={step.title} step={step} number={i + 1} />
          ))}
          <li className="relative mt-3 mb-12 lg:col-span-2 lg:my-0">
            <div
              aria-hidden="true"
              className="absolute -inset-x-3 -top-3 -bottom-3 rounded-xl border border-dashed border-white/25 bg-white/[.02] lg:-top-4"
            />
            <ol className="relative grid gap-x-4 lg:grid-cols-2">
              {loop.map((step, i) => (
                <Step key={step.title} step={step} number={from + i + 1} />
              ))}
            </ol>
            <p className="relative flex items-center gap-2 pl-12 font-geist-mono text-xs text-white lg:mt-6 lg:pl-0">
              <RefreshCw aria-hidden="true" className="size-3.5" />
              {label}
            </p>
          </li>
          {after.map((step, i) => (
            <Step key={step.title} step={step} number={to + i + 2} last={i === after.length - 1} />
        ))}
        </ol>
      </div>
    </HomeSection>
  );
}

function Step({ step, number, last = false }: { step: ProcessStep; number: number; last?: boolean }) {
  return (
    <Reveal
      as="li"
      delay={(number - 1) * 70}
      className={cn('relative flex flex-col gap-2 pl-12 lg:pt-14 lg:pb-0 lg:pl-0', last ? 'pb-0' : 'pb-10')}
    >
      <span
        className={cn(
          'absolute top-0 left-0 flex size-8 items-center justify-center rounded-full border font-geist-mono text-xs',
          last ? 'border-white bg-white text-(--home-button-text)' : 'border-white/30 bg-(--home-bg) text-white',
        )}
      >
        {number}
      </span>
      <span className="text-lg leading-[1.25] tracking-[-.01em]">{step.title}</span>
      <span className="text-[15px] leading-[1.55] text-(--home-text-3)">{step.body}</span>
    </Reveal>
  );
}
