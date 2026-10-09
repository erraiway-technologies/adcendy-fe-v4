import { HOME_WHAT_YOU_GET as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, MONO_LABEL, MarkedList, SectionHeader } from './primitives';

/** The six deliverables, then what AdCendy provides and what it does not do. */
export function WhatYouGet() {
  return (
    <HomeSection id="what-you-get">
      <SectionHeader title={C.heading} intro={C.intro} />
      <Reveal>
        <p className={`${MONO_LABEL} mb-8 normal-case tracking-[.02em]`}>{C.meta}</p>
      </Reveal>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-10">
        {C.deliverables.map((item, i) => (
          <Reveal
            as="li"
            key={item.title}
            delay={(i % 3) * 100}
            className="flex h-full flex-col gap-2.5 border-t border-white/10 pt-6 pb-10"
          >
            <span className="font-geist-mono text-xs text-(--home-text-4)">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{item.title}</span>
            <span className="text-base leading-[1.55] text-(--home-text-3)">{item.body}</span>
          </Reveal>
        ))}
      </ol>

      <div className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-10">
        <Reveal>
          <h3 className="mb-4 text-[22px] tracking-[-.01em]">{C.providesHeading}</h3>
          <MarkedList items={C.provides} />
        </Reveal>
        <Reveal delay={120}>
          <h3 className="mb-4 text-[22px] tracking-[-.01em] text-(--home-text-2)">{C.doesNotHeading}</h3>
          <MarkedList items={C.doesNot} mark="–" />
        </Reveal>
      </div>
    </HomeSection>
  );
}
