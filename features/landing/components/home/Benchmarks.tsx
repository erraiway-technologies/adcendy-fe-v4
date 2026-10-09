import { HOME_BENCHMARKS as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, SectionHeader } from './primitives';

/** "You'll know if it's working": targets, your own numbers, and help reading them. */
export function Benchmarks() {
  return (
    <HomeSection id="benchmarks">
      <SectionHeader title={C.heading} intro={C.intro} />
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-10">
        {C.points.map((point, i) => (
          <Reveal as="li" key={point.title} delay={i * 100} className="flex flex-col gap-3 border-t border-white pt-5">
            <span className="font-geist-mono text-xs text-(--home-text-4)">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{point.title}</span>
            <span className="text-base leading-[1.6] text-(--home-text-3)">{point.body}</span>
          </Reveal>
        ))}
      </ol>
      <Reveal>
        <p className="mt-12 font-geist-mono text-[13px] text-(--home-text-4)">{C.footnote}</p>
      </Reveal>
    </HomeSection>
  );
}
