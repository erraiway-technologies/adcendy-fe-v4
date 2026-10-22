import { HOME_VALUE as C } from '../../content/home';
import { Reveal } from './Reveal';
import { H2, HomeSection, MONO_LABEL, MoreLink } from './primitives';

/** The three value props, one short paragraph each: the page's whole argument. */
export function ValueProps() {
  return (
    <HomeSection id="why-adcendy" className="pt-40">
      <Reveal>
        <h2 className={`${H2} max-w-[20ch]`}>{C.heading}</h2>
      </Reveal>
      <ol className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-10">
        {C.props.map((prop, i) => (
          <Reveal as="li" key={prop.title} delay={i * 100} className="flex flex-col gap-3 border-t border-white pt-5">
            <span className={MONO_LABEL}>{prop.label}</span>
            <span className="text-[24px] leading-[1.25] tracking-[-.015em]">{prop.title}</span>
            <span className="text-base leading-[1.6] text-(--home-text-3)">{prop.body}</span>
          </Reveal>
        ))}
      </ol>
      <Reveal>
        <MoreLink href={C.more.href} label={C.more.label} className="mt-10" />
      </Reveal>
    </HomeSection>
  );
}
