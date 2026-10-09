'use client';

import Link from 'next/link';
import { SectionLink } from '@/components/nav/section-link';
import { usePublicLegalDocuments } from '@/shared/legal/useLegalCatalogue';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { BUSINESS_TERMS } from '@/shared/marketing/business-terms';
import { SITE_TAGLINE } from '../../content/home';
import {
  HOME_SECTIONS as S,
  LANDING_SUB_TARGETS as T,
  type LandingTarget,
} from '../../landing-sections';

/** A place on the homepage, or another page. */
type FooterLink = { section: LandingTarget } | { label: string; href: string };

// The sitemap follows the homepage, in its order, with the header's labels.
const COLUMNS: Record<string, FooterLink[]> = {
  Product: [
    { section: S.inside },
    { section: S.whyNotYourTeam },
    { section: S.whatYouGet },
    { section: S.howItWorks },
    { section: S.benchmarks },
    { section: S.whyNotAI },
    { section: S.comparison },
    { section: S.budget },
    { section: S.pricing },
    { section: S.faq },
  ],
  'Is it for you': [{ section: T.goodFit }, { section: T.notYetFit }, { section: T.industries }],
  Company: [{ section: S.manifesto }, { label: 'Contact', href: '/contact' }],
};

function FooterEntry({ link }: { link: FooterLink }) {
  if ('section' in link) {
    return <SectionLink sectionId={link.section.id}>{link.section.label}</SectionLink>;
  }
  return <Link href={link.href}>{link.label}</Link>;
}

/** The public site's footer: the sitemap, the published policies, and who runs it. */
export function SiteFooter() {
  // The published policies, as the Backend lists them; the column hides until they load.
  const { data: legalDocuments } = usePublicLegalDocuments();
  const legalLinks: FooterLink[] = (legalDocuments ?? [])
    .filter((document) => document.url)
    .map((document) => ({ label: document.title, href: document.url as string }));
  const columns = legalLinks.length > 0 ? { ...COLUMNS, Legal: legalLinks } : COLUMNS;

  return (
    <footer className="mx-auto max-w-[1280px] px-10 pt-40 pb-12 max-sm:px-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-x-10 gap-y-12 border-t border-white/8 pt-12">
        <div className="flex flex-col gap-3">
          <Link href="/" className="w-fit">
            <BrandLogo height={56} />
          </Link>
          <p className="max-w-[24ch] text-sm leading-[1.55] text-(--home-text-4)">{SITE_TAGLINE}</p>
        </div>
        {Object.entries(columns).map(([heading, links]) => (
          <nav key={heading} aria-label={heading} className="flex flex-col gap-3">
            <span className="font-geist-mono text-xs tracking-[.06em] text-(--home-text-4) uppercase">{heading}</span>
            <ul className="flex flex-col gap-2.5 text-[15px] text-(--home-text-3)">
              {links.map((link) => (
                <li key={'section' in link ? link.section.id : link.label}>
                  <FooterEntry link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-t border-white/8 pt-7 text-sm text-(--home-text-4)">
        <span>
          © {new Date().getFullYear()} {BUSINESS_TERMS.company.legalName}
        </span>
        <span>{SITE_TAGLINE}</span>
      </div>
    </footer>
  );
}
