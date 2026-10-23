import { WHY_NOT_YOUR_TEAM as C } from '../../content/pages';
import { Reveal } from '../home/Reveal';
import { HomeSection } from '../home/primitives';

/** Why the hard part is not your team's to staff: the /approach page opens with it. */
export function WhyNotYourTeam() {
  return (
    <HomeSection id="why-not-your-team">
      <Reveal>
        <p className="max-w-[30ch] text-[clamp(28px,3.4vw,46px)] leading-[1.25] tracking-[-.015em] text-pretty text-white">
          {C.lead} <span className="text-(--home-text-4)">{C.aside}</span>
        </p>
      </Reveal>
      <Reveal
        delay={120}
        className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-10 gap-y-6"
      >
        {C.detail.map((paragraph, i) => (
          <p
            key={paragraph}
            className={i === 0 ? 'text-lg leading-[1.6] text-(--home-text-2)' : 'text-lg leading-[1.6] text-white'}
          >
            {paragraph}
          </p>
        ))}
      </Reveal>
    </HomeSection>
  );
}
