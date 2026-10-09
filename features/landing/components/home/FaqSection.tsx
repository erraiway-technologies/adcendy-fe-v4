'use client';

import { useEffect, useState } from 'react';
import { buildFaqs } from '@/components/sections/faq-content';
import { usePublicCatalogue } from '@/shared/payments/usePublicCatalogue';
import { HOME_FAQ } from '../../content/home';
import { HomeSection, QuestionList, SectionHeader } from './primitives';

/**
 * The FAQ. Pilot-only promises appear while the server says the pilot is on.
 * A link straight to an answer (#faq-industries) opens it, on arrival and on
 * every click after, since SectionLink announces the hash even when unchanged.
 */
export function FaqSection() {
  const { isPilot } = usePublicCatalogue();
  const faqs = buildFaqs(isPilot);
  const [open, setOpen] = useState(-1);

  useEffect(() => {
    const openLinked = () => {
      // The pilot changes answers, never order, so either list gives the index.
      const linked = buildFaqs(false).findIndex((faq) => faq.id && `#${faq.id}` === window.location.hash);
      if (linked !== -1) setOpen(linked);
    };
    openLinked();
    window.addEventListener('hashchange', openLinked);
    return () => window.removeEventListener('hashchange', openLinked);
  }, []);

  return (
    <HomeSection id="faq">
      <SectionHeader title={HOME_FAQ.heading} intro={HOME_FAQ.intro} className="mb-12" />
      <QuestionList
        items={faqs.map((faq) => ({ question: faq.question, answer: faq.answer, id: faq.id }))}
        idPrefix="faq-answer"
        open={open}
        onOpenChange={setOpen}
      />
    </HomeSection>
  );
}
