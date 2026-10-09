import { cn } from '@/lib/utils';
import { HOME_WHY_NOT_AI as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, SectionHeader } from './primitives';

/** AI-generated against AI-powered, then the four things the difference rests on. */
export function WhyNotAI() {
  return (
    <HomeSection id="why-not-ai">
      <SectionHeader title={C.heading} intro={C.intro} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
        {C.contrast.map((side, i) => {
          const ours = i === 1;
          return (
            <Reveal
              key={side.title}
              delay={i * 120}
              className={cn(
                'flex flex-col gap-3 rounded-md border p-[clamp(28px,3.5vw,44px)]',
                ours ? 'border-white/40 bg-(--home-surface)' : 'border-white/8',
              )}
            >
              <span className={cn('font-geist-mono text-xs tracking-[.06em] uppercase', ours ? 'text-white' : 'text-(--home-text-4)')}>
                {side.title}
              </span>
              <p className={cn('text-lg leading-[1.6]', ours ? 'text-(--home-text-2)' : 'text-(--home-text-3)')}>{side.body}</p>
            </Reveal>
          );
        })}
      </div>
      <ol className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-x-10">
        {C.pillars.map((pillar, i) => (
          <Reveal
            as="li"
            key={pillar.title}
            delay={(i % 2) * 120}
            className="grid grid-cols-[48px_1fr] gap-4 border-t border-white/10 py-7 max-sm:grid-cols-[32px_1fr] max-sm:gap-3"
          >
            <span className="pt-1.5 font-geist-mono text-[13px] text-(--home-text-4)">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex flex-col gap-2.5">
              <span className="text-[22px] leading-[1.25] tracking-[-.01em]">{pillar.title}</span>
              <span className="text-base leading-[1.6] text-(--home-text-3)">{pillar.body}</span>
            </span>
          </Reveal>
        ))}
      </ol>
    </HomeSection>
  );
}
