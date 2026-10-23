import { cn } from '@/lib/utils';
import { HOME_WHO_ITS_FOR as C } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, MONO_LABEL, MarkedList, MoreLink, SectionHeader } from './primitives';

/**
 * Who it is for and who it is not for yet (each half can be linked to), then
 * where AdCendy sits next to a freelancer and an agency.
 */
export function WhoItsFor() {
  return (
    <HomeSection id="who-its-for" tone="deep">
      <SectionHeader eyebrow={C.eyebrow} title={C.heading} intro={C.intro} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
        <Reveal
          id="who-its-for-fit"
          className="scroll-mt-[90px] rounded-xl border border-white/10 bg-(--home-surface) p-[clamp(28px,3.5vw,44px)]"
        >
          <h3 className="mb-5 text-[24px] tracking-[-.015em]">{C.fitHeading}</h3>
          <MarkedList items={C.fit} />
        </Reveal>
        <Reveal
          id="who-its-for-not-yet"
          delay={120}
          className="scroll-mt-[90px] rounded-xl border border-white/8 p-[clamp(28px,3.5vw,44px)]"
        >
          <h3 className="mb-5 text-[24px] tracking-[-.015em] text-(--home-text-2)">{C.notYetHeading}</h3>
          <MarkedList items={C.notYet} mark="–" />
        </Reveal>
      </div>

      <Reveal id="compare" className="mt-16 scroll-mt-[90px]">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-x-10">
          {C.compare.map((option, i) => {
            const ours = i === 0;
            return (
              <li
                key={option.name}
                className={cn('flex flex-col gap-2 border-t pt-5 pb-8', ours ? 'border-white' : 'border-white/10')}
              >
                <span className={MONO_LABEL}>{option.role}</span>
                <span className={cn('text-[22px] tracking-[-.01em]', !ours && 'text-(--home-text-2)')}>{option.name}</span>
                <span className="text-base leading-[1.55] text-(--home-text-3)">{option.body}</span>
              </li>
            );
          })}
        </ul>
        <MoreLink href={C.more.href} label={C.more.label} className="mt-4" />
      </Reveal>
    </HomeSection>
  );
}
