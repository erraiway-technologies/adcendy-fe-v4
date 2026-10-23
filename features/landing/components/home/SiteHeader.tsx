'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { SectionLink } from '@/components/nav/section-link';
import { useMarketingAuth } from '@/src/lib/auth/useAuth';
import { useScrollFrame } from '../../hooks/useHomeMotion';
import { HOME_SECTIONS as S } from '../../landing-sections';

/** In the bar from lg up: every section, so the one being read is always named. */
const BAR_LINKS = [S.why, S.inside, S.howItWorks, S.whoItsFor, S.pricing, S.faq];
/** Behind the menu below lg: every section, in page order. */
const MENU_LINKS = Object.values(S);

/** Scrolled past this, the bar narrows and gets its own background. */
const COMPACT_AFTER_PX = 40;
/** A section is the one being read once its top passes this far down the viewport. */
const READING_LINE = 0.4;

/**
 * The homepage section being read: the last whose top has passed the reading
 * line. A held (sticky) section stays at the top while the next slides over
 * it, so it reads as passed until the next one crosses the line too.
 */
function sectionBeingRead(): string | null {
  const line = window.innerHeight * READING_LINE;
  let current: string | null = null;
  for (const { id } of MENU_LINKS) {
    const section = document.getElementById(id);
    if (section && section.getBoundingClientRect().top <= line) current = id;
  }
  return current;
}

/**
 * The public site's header, on the homepage and every page around it. Section
 * links go back to the homepage from anywhere else.
 */
export function SiteHeader() {
  const { status } = useMarketingAuth();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  // The section being read, lit in the bar and the menu (homepage only).
  const [reading, setReading] = useState<string | null>(null);
  // Below lg the section links sit behind a menu, open for the page it was
  // opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn !== null && menuOpenOn === pathname;
  const closeMenu = () => setMenuOpenOn(null);

  useScrollFrame(() => {
    setCompact(window.scrollY > COMPACT_AFTER_PX);
    setReading(pathname === '/' ? sectionBeingRead() : null);
  });

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
          <Link href="/" onClick={closeMenu} className="shrink-0">
            <BrandLogo height={48} priority />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-x-1 text-[15px] whitespace-nowrap text-(--home-nav-link) lg:flex">
            {BAR_LINKS.map((link) => (
              <SectionLink
                key={link.id}
                sectionId={link.id}
                aria-current={reading === link.id ? 'location' : undefined}
                className={cn(
                  'rounded-full px-3 py-1.5 motion-safe:transition-colors motion-safe:duration-300',
                  reading === link.id ? 'bg-white/12 text-white' : 'hover:text-white',
                )}
              >
                {link.label}
              </SectionLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Signing in sits where a call to action would; the page has its own. */}
            <Link
              href={account.href}
              className={cn(
                'rounded-md border border-white/18 px-4 py-2.5 text-[15px] whitespace-nowrap text-white hover:bg-white/5',
                'motion-safe:transition-colors motion-safe:duration-300',
              )}
            >
              {account.label}
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
              <SectionLink
                key={link.id}
                sectionId={link.id}
                onClick={closeMenu}
                aria-current={reading === link.id ? 'location' : undefined}
                className={cn('py-2.5', reading === link.id && 'text-white')}
              >
                {reading === link.id && (
                  <span aria-hidden="true" className="mr-2.5 inline-block size-1.5 rounded-full bg-white align-middle" />
                )}
                {link.label}
              </SectionLink>
            ))}
            <Link href="/contact" onClick={closeMenu} className="py-2.5">
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
