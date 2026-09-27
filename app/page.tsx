import { LandingPage } from '@/features/landing/components/LandingPage';
import { buildFaqs } from '@/components/sections/faq-content';
import { StructuredData } from '@/shared/seo/StructuredData';
import { SITE_DESCRIPTION, SITE_NAME, getSite, pageMetadata } from '@/shared/seo/site';

export const metadata = pageMetadata('/');

// Rendered on the server, so the front page arrives as finished HTML - readable
// before any JavaScript runs, and by search engines and link previews.
export default async function Home() {
  const { origin } = await getSite();
  return (
    <>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: `${origin}/`,
          logo: `${origin}/apple-icon.png`,
          description: SITE_DESCRIPTION,
        }}
      />
      {/* The same answers the FAQ section renders on the server. */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: buildFaqs(false).map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }}
      />
      <LandingPage />
    </>
  );
}
