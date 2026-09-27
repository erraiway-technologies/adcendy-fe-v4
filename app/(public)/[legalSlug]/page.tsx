import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/shared/seo/site';
import { LEGAL_PAGES } from '@/shared/seo/legal-pages';
import { LegalDocumentView } from './LegalDocumentView';

type Params = { params: Promise<{ legalSlug: string }> };

// Every single-segment path lands here, so anything that is not a published
// policy is a real 404 from the server - not a 200 page that says so later,
// which search engines would index as a page of its own.
async function legalPath({ params }: Params): Promise<string> {
  const path = `/${(await params).legalSlug}`;
  if (!(path in LEGAL_PAGES)) notFound();
  return path;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const path = await legalPath(props);
  return pageMetadata(path, { title: LEGAL_PAGES[path] });
}

export default async function LegalDocumentPage(props: Params) {
  await legalPath(props);
  return <LegalDocumentView />;
}
