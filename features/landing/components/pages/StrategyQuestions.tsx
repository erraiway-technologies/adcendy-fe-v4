'use client';

import { STRATEGY_QUESTIONS, chapterReference } from '../../content/pages';
import { HomeSection, QuestionList, SectionHeader } from '../home/primitives';

const ITEMS = STRATEGY_QUESTIONS.items.map((item) => ({
  question: item.question,
  answer: item.answer,
  reference: chapterReference(item.chapter),
}));

/** "Questions your strategy answers": each answer names the chapter it comes from. */
export function StrategyQuestions({ tone }: { tone?: 'plain' | 'deep' }) {
  return (
    <HomeSection tone={tone}>
      <SectionHeader title={STRATEGY_QUESTIONS.heading} className="mb-12" />
      <QuestionList items={ITEMS} idPrefix="strategy-question" />
    </HomeSection>
  );
}
