import { RefreshCw } from 'lucide-react';
import { TIMELINE_DETAIL as C } from '../../content/pages';
import { Reveal } from '../home/Reveal';
import { HomeSection, SectionHeader } from '../home/primitives';

type Step = (typeof C.steps)[number];

/** How a strategy is made, each step in full, with the review steps that repeat boxed as a loop. */
export function TimelineDetail({ tone }: { tone?: 'plain' | 'deep' }) {
  const { from, to, label } = C.loop;
  return (
    <HomeSection id="how-it-works-in-detail" tone={tone}>
      <SectionHeader title={C.heading} intro={C.intro} />
      <ol className="flex flex-col">
        {C.steps.slice(0, from).map((step, i) => (
          <Row key={step.title} step={step} number={i + 1} />
        ))}
        <li className="my-2 -mx-5 rounded-xl border border-dashed border-white/25 bg-white/[.02] px-5">
          <ol className="flex flex-col">
            {C.steps.slice(from, to + 1).map((step, i) => (
              <Row key={step.title} step={step} number={from + i + 1} />
            ))}
          </ol>
          <p className="flex items-center gap-2 border-t border-white/10 py-4 font-geist-mono text-xs text-white">
            <RefreshCw aria-hidden="true" className="size-3.5" />
            {label}
          </p>
        </li>
        {C.steps.slice(to + 1).map((step, i) => (
          <Row key={step.title} step={step} number={to + i + 2} />
        ))}
      </ol>
    </HomeSection>
  );
}

function Row({ step, number }: { step: Step; number: number }) {
  return (
    <Reveal
      as="li"
      className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-white/10 py-7 first:border-t-0 md:grid-cols-[48px_minmax(0,1fr)_minmax(0,1.6fr)]"
    >
      <span className="pt-1 font-geist-mono text-[13px] text-(--home-text-4)">{String(number).padStart(2, '0')}</span>
      <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{step.title}</span>
      <span className="col-start-2 text-base leading-[1.6] text-(--home-text-3) md:col-start-3">{step.body}</span>
    </Reveal>
  );
}
