import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/shared/seo/site';
import { CONSENT_PAGES } from '@/shared/seo/legal-pages';
import { LegalDocumentView } from '../../[legalSlug]/LegalDocumentView';

type Params = { params: Promise<{ consentSlug: string }> };

// The page explaining one consent, linked from the consent itself. Any path
// that is not one of them is a real 404 from the server.
async function consentPath({ params }: Params): Promise<string> {
  const path = `/consents/${(await params).consentSlug}`;
  if (!(path in CONSENT_PAGES)) notFound();
  return path;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const path = await consentPath(props);
  return pageMetadata(path, { title: CONSENT_PAGES[path] });
}

export default async function ConsentDocumentPage(props: Params) {
  return <LegalDocumentView path={await consentPath(props)} />;
}
