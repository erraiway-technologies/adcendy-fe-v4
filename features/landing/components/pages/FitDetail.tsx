import { FIT_DETAIL as C } from '../../content/pages';
import { Reveal } from '../home/Reveal';
import { HomeSection, MarkedList, SectionHeader } from '../home/primitives';

/** Who it is for and not for yet, in full; the homepage shows the short lists. */
export function FitDetail({ tone }: { tone?: 'plain' | 'deep' }) {
  return (
    <HomeSection id="fit" tone={tone}>
      <SectionHeader title={C.heading} intro={C.intro} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
        <Reveal className="rounded-xl border border-white/10 bg-(--home-surface) p-[clamp(28px,3.5vw,44px)]">
          <h3 className="mb-5 text-[24px] tracking-[-.015em]">{C.fitHeading}</h3>
          <MarkedList items={C.fit} />
        </Reveal>
        <Reveal delay={120} className="rounded-xl border border-white/8 p-[clamp(28px,3.5vw,44px)]">
          <h3 className="mb-5 text-[24px] tracking-[-.015em] text-(--home-text-2)">{C.notYetHeading}</h3>
          <MarkedList items={C.notYet} mark="–" />
        </Reveal>
      </div>
    </HomeSection>
  );
}
