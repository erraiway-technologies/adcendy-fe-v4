import { HOME_STATEMENT } from '../../content/home';
import { Reveal } from './Reveal';

/** The opening statement, and why the hard part is not your team's to staff. */
export function Statement() {
  return (
    <section id="why-not-your-team" className="mx-auto max-w-[1280px] scroll-mt-[90px] px-10 pt-40 max-sm:px-6">
      <Reveal>
        <p className="max-w-[30ch] text-[clamp(28px,3.4vw,46px)] leading-[1.25] tracking-[-.015em] text-pretty text-white">
          {HOME_STATEMENT.lead} <span className="text-(--home-text-4)">{HOME_STATEMENT.aside}</span>
        </p>
      </Reveal>
      <Reveal
        delay={120}
        className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-10 gap-y-6"
      >
        {HOME_STATEMENT.detail.map((paragraph, i) => (
          <p
            key={paragraph}
            className={i === 0 ? 'text-lg leading-[1.6] text-(--home-text-2)' : 'text-lg leading-[1.6] text-white'}
          >
            {paragraph}
          </p>
        ))}
      </Reveal>
    </section>
  );
}
