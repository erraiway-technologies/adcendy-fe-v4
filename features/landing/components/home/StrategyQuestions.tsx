'use client';

import { HOME_QUESTIONS, chapterReference } from '../../content/home';
import { HomeSection, QuestionList, SectionHeader } from './primitives';

const ITEMS = HOME_QUESTIONS.items.map((item) => ({
  question: item.question,
  answer: item.answer,
  reference: chapterReference(item.chapter),
}));

/** "Questions your strategy answers": each answer names the chapter it comes from. */
export function StrategyQuestions() {
  return (
    <HomeSection>
      <SectionHeader title={HOME_QUESTIONS.heading} className="mb-12" />
      <QuestionList items={ITEMS} idPrefix="strategy-question" />
    </HomeSection>
  );
}
