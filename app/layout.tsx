import React from "react"
import type { Metadata } from 'next'
import { Providers, RuntimeConfigGate } from '@/shared/providers/Providers'
import { BrandSplash } from '@/shared/components/BrandSplash'
import { ApiDebugPanel } from '@/components/dev/api-debug-panel'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, getSite } from '@/shared/seo/site'
import Script from 'next/script'
import './fonts.css'
import './globals.css'

// Shared by every page; each public page adds its canonical address
// (pageMetadata). The origin and indexing come from the runtime configuration,
// so absolute URLs name the host actually serving the page.
const SITE_METADATA: Metadata = {
  title: {
    default: SITE_TITLE,
    template: '%s | AdCendy',
  },
  description: SITE_DESCRIPTION,
  // Link previews (WhatsApp, LinkedIn, Slack, X). The image is
  // app/opengraph-image.png.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      {
        url: '/Adcendy icon + bg 48x48.svg',
        type: 'image/svg+xml',
        sizes: '48x48',
      },
    ],
    shortcut: '/Adcendy icon + bg 48x48.svg',
    apple: '/apple-icon.png',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    ...SITE_METADATA,
    metadataBase: new URL(site.origin),
    // Only production is for search engines.
    ...(site.indexable ? {} : { robots: { index: false, follow: false } }),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="/runtime-config.js" strategy="beforeInteractive" />
        {/* Self-hosted fonts (app/fonts.css); the Latin files are what nearly every page needs. */}
        <link rel="preload" href="/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {/* First load only: the logo until the page is ready, then one reveal. */}
        <BrandSplash />
        <Providers>
          {children}
          {/* Local debugging only; it reads the runtime flags, so it waits for them. */}
          <RuntimeConfigGate fallback={null}>
            <ApiDebugPanel />
          </RuntimeConfigGate>
        </Providers>
      </body>
    </html>
  )
}
