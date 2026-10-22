import { WhatYouGetPage } from '@/features/landing/components/pages/LearnMorePages';
import { pageMetadata } from '@/shared/seo/site';

export const metadata = pageMetadata('/what-you-get', {
  title: 'What you get',
  description: 'Everything inside an AdCendy strategy: the deliverables, the questions it answers, how it is made and how you will know it is working.',
});

export default function WhatYouGetRoute() {
  return <WhatYouGetPage />;
}
