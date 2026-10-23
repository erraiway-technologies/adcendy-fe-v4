import { HOME_VALUE as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, MONO_LABEL, MoreLink, SectionHeader } from './primitives';

/** The three value props, one short paragraph each: the page's whole argument. */
export function ValueProps() {
  return (
    <HomeSection id="why-adcendy">
      <SectionHeader title={C.heading} />
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-10">
        {C.props.map((prop, i) => (
          <Reveal
            as="li"
            key={prop.title}
            delay={i * 100}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-(--home-surface) p-8"
          >
            <span className={MONO_LABEL}>{prop.label}</span>
            <span className="text-[24px] leading-[1.25] tracking-[-.015em]">{prop.title}</span>
            <span className="text-base leading-[1.6] text-(--home-text-3)">{prop.body}</span>
          </Reveal>
        ))}
      </ol>
      <Reveal>
        <MoreLink href={C.more.href} label={C.more.label} className="mt-12" />
      </Reveal>
    </HomeSection>
  );
}
