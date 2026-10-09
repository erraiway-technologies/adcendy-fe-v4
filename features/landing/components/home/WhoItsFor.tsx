import { HOME_WHO_ITS_FOR as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, MarkedList, SectionHeader } from './primitives';

/** Who it is for, and who it is not for yet; each half can be linked to. */
export function WhoItsFor() {
  return (
    <HomeSection id="who-its-for">
      <SectionHeader title={C.heading} intro={C.intro} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
        <Reveal
          id="who-its-for-fit"
          className="scroll-mt-[90px] rounded-md border border-white/10 bg-(--home-surface) p-[clamp(28px,3.5vw,44px)]"
        >
          <h3 className="mb-5 text-[24px] tracking-[-.015em]">{C.fitHeading}</h3>
          <MarkedList items={C.fit} />
        </Reveal>
        <Reveal
          id="who-its-for-not-yet"
          delay={120}
          className="scroll-mt-[90px] rounded-md border border-white/8 p-[clamp(28px,3.5vw,44px)]"
        >
          <h3 className="mb-5 text-[24px] tracking-[-.015em] text-(--home-text-2)">{C.notYetHeading}</h3>
          <MarkedList items={C.notYet} mark="–" />
        </Reveal>
      </div>
    </HomeSection>
  );
}
