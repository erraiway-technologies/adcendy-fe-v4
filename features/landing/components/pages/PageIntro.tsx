import { Reveal } from '../home/Reveal';
import { MONO_LABEL } from '../home/primitives';

/** The top of a page the homepage links out to: a label, the page's h1, a line of context. */
export function PageIntro({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro: string }) {
  return (
    <div className="mx-auto max-w-[1280px] px-10 pt-[160px] max-sm:px-6">
      <span className={MONO_LABEL}>{eyebrow}</span>
      <h1 className="mt-4 max-w-[20ch] text-[clamp(44px,5.6vw,86px)] leading-[1.08] font-normal tracking-[-.02em] text-balance">
        {heading}
      </h1>
      <Reveal>
        <p className="mt-6 max-w-[52ch] text-lg leading-[1.6] text-(--home-text-2)">{intro}</p>
      </Reveal>
    </div>
  );
}
