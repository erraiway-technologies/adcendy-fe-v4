'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useMarketingAuth } from '@/src/lib/auth/useAuth';
import { SectionLink } from '@/components/nav/section-link';
import { LANDING_SECTIONS } from '../landing-sections';

const MONO: React.CSSProperties = {
  fontFamily: '"Geist Mono", "Courier New", monospace',
};

// This nav also renders above the auth screens; SectionLink takes the
// reader back to '/' first when the section is not on the current page.
const NAV_LINKS = [
  LANDING_SECTIONS.howItWorks,
  LANDING_SECTIONS.whatYouGet,
  LANDING_SECTIONS.benchmarks,
  LANDING_SECTIONS.whoItsFor,
  LANDING_SECTIONS.comparison,
  LANDING_SECTIONS.pricing,
  LANDING_SECTIONS.faq,
];

const LINK_STYLE: React.CSSProperties = {
  ...MONO,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: 'rgba(237,232,220,0.42)',
  textDecoration: 'none',
  transition: 'color 0.2s',
  whiteSpace: 'nowrap',
};

const ACCOUNT_STYLE: React.CSSProperties = {
  ...MONO,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: 'rgba(212,168,83,0.80)',
  border: '1px solid rgba(212,168,83,0.32)',
  padding: '6px 16px',
  borderRadius: '3px',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export function IntelligenceStreamNav() {
  const { status } = useMarketingAuth();
  const router = useRouter();
  const pathname = usePathname();
  // The section links fit in one row from lg up; below that they sit behind a
  // menu. It is open for the page it was opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn !== null && menuOpenOn === pathname;
  const closeMenu = () => setMenuOpenOn(null);

  useEffect(() => {
    router.prefetch('/auth/login');
    router.prefetch('/auth/signup');
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpenOn(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        background: 'rgba(8,8,7,0.92)',
        borderBottom: '1px solid rgba(237,232,220,0.07)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div
        className="max-w-none flex items-center justify-between"
        style={{ padding: '0 clamp(16px, 4vw, 64px)', height: '60px', gap: '16px' }}
      >
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          style={{
            width: '115px',
            textDecoration: 'none',
          }}
        >
          <Image
            src="/Adcendy-logo-tight.svg"
            alt="AdCendy"
            width={90}
            height={40}
            className="h-10 w-[90px] max-w-none"
            // The wordmark is drawn a little wider than the file.
            style={{ transform: 'scaleX(1.28)', transformOrigin: 'left center' }}
            priority
          />
        </Link>

        <div className="hidden lg:flex items-center" style={{ gap: 'clamp(16px, 2.2vw, 44px)' }}>
          {NAV_LINKS.map(link => (
            <SectionLink
              key={link.id}
              sectionId={link.id}
              style={LINK_STYLE}
              className="hover:text-amber-300/70"
            >
              {link.label}
            </SectionLink>
          ))}
        </div>

        <div className="flex shrink-0 items-center" style={{ gap: '12px' }}>
          {status === 'authed' ? (
            <Link href="/app" style={ACCOUNT_STYLE}>
              Dashboard -&gt;
            </Link>
          ) : (
            <Link href="/auth/login" style={ACCOUNT_STYLE}>
              Sign In
            </Link>
          )}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center"
            style={{ width: '36px', height: '36px', color: 'rgba(237,232,220,0.78)' }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="landing-nav-menu"
            onClick={() => setMenuOpenOn(menuOpen ? null : pathname)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="landing-nav-menu"
          className="lg:hidden flex flex-col"
          style={{
            padding: '8px clamp(16px, 4vw, 64px) 20px',
            borderTop: '1px solid rgba(237,232,220,0.07)',
          }}
        >
          {NAV_LINKS.map(link => (
            <SectionLink
              key={link.id}
              sectionId={link.id}
              onClick={closeMenu}
              style={{ ...LINK_STYLE, fontSize: '12px', padding: '12px 0', color: 'rgba(237,232,220,0.72)' }}
              className="hover:text-amber-300/70"
            >
              {link.label}
            </SectionLink>
          ))}
        </div>
      )}
    </nav>
  );
}
