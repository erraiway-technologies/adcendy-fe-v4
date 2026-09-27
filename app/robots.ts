import type { MetadataRoute } from 'next';
import { getSite } from '@/shared/seo/site';

// Its own route, so /robots.txt never reaches the [legalSlug] page.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  // Only production is for search engines; uat and local ask to be left alone.
  if (!site.indexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The signed-in app and the API have nothing to index. `$` ends a match,
      // so /app$ keeps /apple-icon.png crawlable.
      disallow: ['/app$', '/app/', '/admin$', '/admin/', '/api/', '/v1/'],
    },
    sitemap: `${site.origin}/sitemap.xml`,
  };
}
