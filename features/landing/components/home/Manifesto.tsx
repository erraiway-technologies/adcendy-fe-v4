'use client';

import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import { HOME_MANIFESTO as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, SectionHeader } from './primitives';

/** How we think about marketing strategy, and who is behind AdCendy. */
export function Manifesto() {
  const { isPilot } = usePublicCatalogue();
  return (
    <HomeSection id="manifesto">
      <SectionHeader title={C.heading} intro={C.intro} />
      <ol className="flex flex-col">
        {C.beliefs.map((belief, i) => (
          <Reveal
            as="li"
            key={belief.title}
            className="grid grid-cols-[48px_1fr] gap-4 border-t border-white/10 py-9 max-sm:grid-cols-[32px_1fr] max-sm:gap-3"
          >
            <span className="pt-2 font-geist-mono text-[13px] text-(--home-text-4)">{String(i + 1).padStart(2, '0')}</span>
            <span className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-x-10 gap-y-3">
              <span className="text-[clamp(22px,2.4vw,30px)] leading-[1.25] tracking-[-.015em] text-balance">{belief.title}</span>
              <span className="text-base leading-[1.65] text-(--home-text-3)">{belief.body}</span>
            </span>
          </Reveal>
        ))}
      </ol>
      {/* AdCendy is a product: the people behind it are on the company's site. */}
      <Reveal>
        <p className="border-t border-white/10 pt-7 text-base text-(--home-text-3)">
          {C.company.lead}{' '}
          <a
            href={C.company.url}
            target="_blank"
            rel="noopener"
            className="text-white underline decoration-white/30 underline-offset-4"
          >
            {C.company.name}
          </a>
          .{isPilot && <> {C.pilotNote}</>}
        </p>
      </Reveal>
    </HomeSection>
  );
}
