'use client';

import { useEffect, useState } from 'react';
import { buildFaqs } from '@/features/landing/content/faq';
import { HOME_FAQ } from '../../content/home';
import { HomeSection, QuestionList, SectionHeader } from './primitives';

/**
 * The FAQ. A link straight to an answer (#faq-industries) opens it, on arrival and on
 * every click after, since SectionLink announces the hash even when unchanged.
 */
export function FaqSection() {
  const faqs = buildFaqs();
  const [open, setOpen] = useState(-1);

  useEffect(() => {
    const openLinked = () => {
      const linked = buildFaqs().findIndex((faq) => faq.id && `#${faq.id}` === window.location.hash);
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
