import { TIMELINE_DETAIL as C } from '../../content/pages';
import { Reveal } from '../home/Reveal';
import { HomeSection, SectionHeader } from '../home/primitives';

/** The delivery timeline with each step explained in full; the homepage shows it in brief. */
export function TimelineDetail() {
  return (
    <HomeSection id="how-it-works-in-detail">
      <SectionHeader title={C.heading} />
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-10">
        {C.steps.map((step, i) => (
          <Reveal as="li" key={step.day} delay={i * 100} className="flex flex-col gap-3 border-t border-white/10 pt-5">
            <span className="font-geist-mono text-[13px] text-(--home-text-3)">{step.day}</span>
            <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{step.title}</span>
            <span className="text-base leading-[1.6] text-(--home-text-3)">{step.body}</span>
          </Reveal>
        ))}
      </ol>
    </HomeSection>
  );
}
