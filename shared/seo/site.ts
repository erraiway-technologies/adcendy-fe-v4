import 'server-only';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getServerRuntimePublicConfig } from '@/shared/runtime-config/server';
import { BUSINESS_TERMS } from '@/shared/marketing/business-terms';

export const SITE_NAME = 'AdCendy';
export const SITE_TITLE = 'AdCendy - Market Intelligence & Strategy Reports';
export const SITE_DESCRIPTION = `Competitive intelligence and a human-reviewed marketing strategy your team can own, delivered within ${BUSINESS_TERMS.delivery.businessDays} business days.`;

/**
 * Where this deployment is served from, and whether search engines may index
 * it. Both come from the runtime configuration: one build serves uat and
 * production, so neither can be known when the image is built. Waiting on the
 * request keeps Next from rendering these at build time, where there is no
 * configuration.
 */
export async function getSite(): Promise<{ origin: string; indexable: boolean }> {
  await connection();
  const config = getServerRuntimePublicConfig();
  return { origin: config.APP_ORIGIN, indexable: config.APP_ENV === 'production' };
}

/**
 * A public page's canonical address and link preview. Open Graph is replaced
 * as a whole by a page that sets it, so every field is restated here.
 */
export function pageMetadata(
  path: string,
  { title, description = SITE_DESCRIPTION }: { title?: string; description?: string } = {},
): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: path,
      title: title ? `${title} | ${SITE_NAME}` : SITE_TITLE,
      description,
    },
  };
}
