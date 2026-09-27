import React from "react"
import type { Metadata } from 'next'
import { Providers, RuntimeConfigGate } from '@/shared/providers/Providers'
import { BrandSplash } from '@/shared/components/BrandSplash'
import { ApiDebugPanel } from '@/components/dev/api-debug-panel'
import { BUSINESS_TERMS } from '@/shared/marketing/business-terms'
import Script from 'next/script'
import './fonts.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AdCendy - Market Intelligence & Strategy Reports',
    template: '%s | AdCendy',
  },
  description: `Competitive intelligence and a human-reviewed marketing strategy your team can own, delivered within ${BUSINESS_TERMS.delivery.businessDays} business days.`,
  // Link previews (WhatsApp, LinkedIn, Slack, X). No absolute URL or image here:
  // the same build serves uat and production, each on its own host.
  openGraph: {
    type: 'website',
    siteName: 'AdCendy',
    title: 'AdCendy - Market Intelligence & Strategy Reports',
    description: `Competitive intelligence and a human-reviewed marketing strategy your team can own, delivered within ${BUSINESS_TERMS.delivery.businessDays} business days.`,
  },
  twitter: {
    card: 'summary',
    title: 'AdCendy - Market Intelligence & Strategy Reports',
    description: `Competitive intelligence and a human-reviewed marketing strategy your team can own, delivered within ${BUSINESS_TERMS.delivery.businessDays} business days.`,
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
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
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
