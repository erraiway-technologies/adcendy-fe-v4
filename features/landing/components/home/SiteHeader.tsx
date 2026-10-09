'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionLink } from '@/components/nav/section-link';
import { useMarketingAuth } from '@/src/lib/auth/useAuth';
import { HOME_CTA_LABEL } from '../../content/home';
import { useScrollFrame } from '../../hooks/useHomeMotion';
import { useStrategyCta } from '../../hooks/useStrategyCta';
import { HOME_SECTIONS as S } from '../../landing-sections';

/** In the bar from lg up; the narrowed bar has room for these five. */
const BAR_LINKS = [S.inside, S.howItWorks, S.whatYouGet, S.pricing, S.faq];
/** Behind the menu below lg: every section, in page order. */
const MENU_LINKS = Object.values(S);

/** Scrolled past this, the bar narrows and gets its own background. */
const COMPACT_AFTER_PX = 40;

/**
 * The public site's header, on the homepage and every page around it. Section
 * links go back to the homepage from anywhere else.
 */
export function SiteHeader() {
  const { status } = useMarketingAuth();
  const ctaHref = useStrategyCta();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  // Below lg the section links sit behind a menu, open for the page it was
  // opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn !== null && menuOpenOn === pathname;
  const closeMenu = () => setMenuOpenOn(null);

  useScrollFrame(() => setCompact(window.scrollY > COMPACT_AFTER_PX));

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpenOn(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const account =
    status === 'authed' ? { href: '/app', label: 'Dashboard' } : { href: '/auth/login', label: 'Sign in' };
  // An open menu needs the bar's background to be readable over the hero.
  const solid = compact || menuOpen;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-4">
      <div
        className={cn(
          'pointer-events-auto mx-auto rounded-[10px] border py-2.5 pr-2.5 pl-5',
          'motion-safe:[transition:max-width_.8s_var(--home-ease),background-color_.5s,border-color_.5s]',
          solid
            ? 'border-white/8 bg-[rgba(40,40,40,.82)] backdrop-blur-[16px]'
            : 'border-transparent bg-transparent',
          compact ? 'max-w-[980px]' : 'max-w-[1400px]',
        )}
      >
        <div className="flex items-center justify-between gap-x-7 gap-y-3">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-[20px] font-semibold tracking-[-.02em] whitespace-nowrap"
          >
            AdCendy
          </Link>

          <nav aria-label="Main" className="hidden gap-x-7 text-[15px] whitespace-nowrap text-(--home-nav-link) lg:flex">
            {BAR_LINKS.map((link) => (
              <SectionLink key={link.id} sectionId={link.id}>
                {link.label}
              </SectionLink>
            ))}
            <Link href={account.href}>{account.label}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={ctaHref}
              className={cn(
                'home-button-primary rounded-md bg-white px-4 py-2.5 text-[15px] whitespace-nowrap text-(--home-button-text) hover:bg-(--home-button-hover)',
                'motion-safe:transition-colors motion-safe:duration-300',
                'max-[400px]:hidden',
              )}
            >
              {HOME_CTA_LABEL}
            </Link>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center text-(--home-nav-link) lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="site-nav-menu"
              onClick={() => setMenuOpenOn(menuOpen ? null : pathname)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="site-nav-menu"
            aria-label="Main"
            className="mt-2.5 flex max-h-[calc(100dvh-110px)] flex-col overflow-y-auto border-t border-white/8 pt-1 text-[17px] text-(--home-nav-link) lg:hidden"
          >
            {MENU_LINKS.map((link) => (
              <SectionLink key={link.id} sectionId={link.id} onClick={closeMenu} className="py-2.5">
                {link.label}
              </SectionLink>
            ))}
            <Link href="/contact" onClick={closeMenu} className="py-2.5">
              Contact
            </Link>
            <Link href={account.href} onClick={closeMenu} className="py-2.5">
              {account.label}
            </Link>
            <Link href={ctaHref} onClick={closeMenu} className="py-2.5 min-[401px]:hidden">
              {HOME_CTA_LABEL}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
