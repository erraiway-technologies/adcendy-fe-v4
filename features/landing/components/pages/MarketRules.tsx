import { MARKET_RULES as C } from '../../content/pages';
import { Reveal } from '../home/Reveal';
import { HomeSection, SectionHeader } from '../home/primitives';

/** One market is one country, national only, and where your city still counts. */
export function MarketRules() {
  return (
    <HomeSection id="one-market">
      <SectionHeader title={C.heading} />
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-10">
        {C.rules.map((rule, i) => (
          <Reveal as="li" key={rule.title} delay={i * 100} className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{rule.title}</span>
            <span className="text-base leading-[1.6] text-(--home-text-3)">{rule.body}</span>
          </Reveal>
        ))}
      </ol>
    </HomeSection>
  );
}
