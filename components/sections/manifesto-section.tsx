'use client';

import { motion } from 'framer-motion';
import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import { BUSINESS_TERMS as TERMS } from '@/shared/marketing/business-terms';
import { TEAM } from '@/shared/marketing/team';

const BELIEFS = [
  {
    title: 'Most marketing strategies fail because of bad inputs, not bad ideas.',
    body: 'Agencies skip research to hit deadlines. AI tools pattern-match instead of investigating. The output is generic because the input was generic. We invert that — research is where we spend the most time, not the least.',
  },
  {
    title: 'Founders need decisions they can act on, not suggestions to interpret.',
    body: "A strategy that says \"consider building a content engine\" isn't a strategy. We tell you what to build, why, and in what order — and we're willing to be wrong in writing.",
  },
  {
    title: 'The process is the product, not the output.',
    body: `Lots of tools can generate a marketing strategy in 10 seconds. Ours takes up to ${TERMS.delivery.businessDays} business days — because we spend them collecting real data about your actual market, analyzing it properly, and checking every recommendation against the evidence before it reaches you. The time is intentional. The rigour is the value.`,
  },
];

export function Manifesto() {
  const { isPilot } = usePublicCatalogue();
  return (
    <section id="manifesto" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 space-y-4"
        >
          <h2 className="font-space-grotesk text-4xl sm:text-5xl font-bold text-foreground">
            How we think about marketing strategy
          </h2>
          <p className="text-lg text-muted-foreground">
            Three things shaped how AdCendy works.
          </p>
        </motion.div>

        <div className="space-y-8">
          {BELIEFS.map((belief, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.12 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mt-1">
                <span className="font-space-grotesk text-xs font-bold text-primary">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="font-space-grotesk text-lg font-bold text-foreground">
                  {belief.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{belief.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <h3 className="font-space-grotesk text-lg font-bold text-foreground">
            Who&apos;s behind AdCendy
          </h3>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            AdCendy is built by a two-person team under{' '}
            <span className="text-foreground font-medium">{TERMS.company.legalName}</span>.
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {TEAM.map((member) => (
              <li key={member.name} className="space-y-1">
                <p className="text-foreground font-medium">{member.name}</p>
                <p className="text-xs uppercase tracking-wide text-primary">{member.role}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{member.about}</p>
                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </li>
            ))}
          </ul>
          {isPilot && (
            <p className="mt-6 text-muted-foreground text-sm leading-relaxed">
              We&apos;re starting with a small, limited pilot so the product is shaped by real
              client feedback, not built in a vacuum.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
