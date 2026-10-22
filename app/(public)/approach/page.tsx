import { ApproachPage } from '@/features/landing/components/pages/LearnMorePages';
import { pageMetadata } from '@/shared/seo/site';

export const metadata = pageMetadata('/approach', {
  title: 'Our approach',
  description: 'Why AdCendy uses AI for the reading and people for the judgment, and why the strategy is the cheap part.',
});

export default function ApproachRoute() {
  return <ApproachPage />;
}
