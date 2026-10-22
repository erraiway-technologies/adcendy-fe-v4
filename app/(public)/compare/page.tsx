import { ComparePage } from '@/features/landing/components/pages/LearnMorePages';
import { pageMetadata } from '@/shared/seo/site';

export const metadata = pageMetadata('/compare', {
  title: 'Compare',
  description: 'AdCendy, a freelancer or an agency: what each gives you, and who AdCendy is and is not for.',
});

export default function CompareRoute() {
  return <ComparePage />;
}
