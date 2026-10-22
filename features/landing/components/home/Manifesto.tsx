'use client';

import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import { HOME_MANIFESTO as C } from '../../content/home';
import { Reveal } from './Reveal';
import { MONO_LABEL } from './primitives';

/** The /about page: how we think about marketing strategy, and who is behind AdCendy. */
export function Manifesto() {
  const { isPilot } = usePublicCatalogue();
  return (
    <main className="mx-auto max-w-[1280px] px-10 pt-[160px] max-sm:px-6">
      <span className={MONO_LABEL}>About</span>
      <h1 className="mt-4 max-w-[20ch] text-[clamp(44px,5.6vw,86px)] leading-[1.08] font-normal tracking-[-.02em] text-balance">
        {C.heading}
      </h1>
      <p className="mt-6 mb-14 max-w-[52ch] text-lg leading-[1.6] text-(--home-text-2)">{C.intro}</p>
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
    </main>
  );
}
