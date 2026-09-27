import { pageMetadata } from '@/shared/seo/site';
import { ContactView } from './ContactView';

export const metadata = pageMetadata('/contact', {
  title: 'Contact',
  description: 'Talk to the AdCendy strategy team about partnerships, integrations, or a bespoke market read.',
});

export default function ContactPage() {
  return <ContactView />;
}
