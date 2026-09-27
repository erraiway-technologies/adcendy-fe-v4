'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import { buildFaqs } from './faq-content';

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { isPilot } = usePublicCatalogue();
  const faqs = buildFaqs(isPilot);

  // A link straight to an answer opens it, on arrival and on every click
  // after, since SectionLink announces the hash even when it is unchanged.
  useEffect(() => {
    const openLinked = () => {
      // The pilot changes answers, never order, so either list gives the index.
      const linked = buildFaqs(false).findIndex(
        (faq) => faq.id && `#${faq.id}` === window.location.hash,
      );
      if (linked !== -1) setOpenIdx(linked);
    };
    openLinked();
    window.addEventListener('hashchange', openLinked);
    return () => window.removeEventListener('hashchange', openLinked);
  }, []);

  return (
    <section id="faq" className="bg-background py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="font-space-grotesk text-4xl sm:text-5xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Adcendy
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              id={faq.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              viewport={{ once: true }}
              className="border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-card/30 transition-colors"
              >
                <span className="font-space-grotesk font-semibold text-foreground text-sm sm:text-base">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIdx === idx ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 py-4 border-t border-border bg-card/30">
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
