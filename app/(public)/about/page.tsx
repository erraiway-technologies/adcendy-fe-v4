import { Manifesto } from '@/features/landing/components/home/Manifesto';
import { pageMetadata } from '@/shared/seo/site';

export const metadata = pageMetadata('/about', {
  title: 'About',
  description: 'How AdCendy thinks about marketing strategy, and who is behind it.',
});

export default function AboutPage() {
  return <Manifesto />;
}
