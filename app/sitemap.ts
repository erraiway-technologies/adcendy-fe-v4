import type { MetadataRoute } from 'next';
import { getSite } from '@/shared/seo/site';
import { LEGAL_PAGES } from '@/shared/seo/legal-pages';

/** The public pages worth a search result. */
const PAGES = ['/', '/contact', ...Object.keys(LEGAL_PAGES)];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  if (!site.indexable) return [];
  return PAGES.map((path) => ({ url: new URL(path, site.origin).toString() }));
}
