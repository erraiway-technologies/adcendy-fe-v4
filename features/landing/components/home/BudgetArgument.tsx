import { HOME_BUDGET as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, SectionHeader } from './primitives';

/** "The strategy is the cheap part": what a wrong strategy really costs. */
export function BudgetArgument() {
  return (
    <HomeSection id="budget">
      <SectionHeader title={C.heading} intro={C.intro} />
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-10">
        {C.costs.map((cost, i) => (
          <Reveal as="li" key={cost.title} delay={i * 100} className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <span className="font-geist-mono text-xs text-(--home-text-4)">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{cost.title}</span>
            <span className="text-base leading-[1.6] text-(--home-text-3)">{cost.body}</span>
          </Reveal>
        ))}
      </ol>
      <Reveal>
        <p className="mt-20 max-w-[34ch] text-[clamp(24px,2.6vw,34px)] leading-[1.3] tracking-[-.015em] text-pretty text-white">
          {C.conclusion}
        </p>
      </Reveal>
    </HomeSection>
  );
}
