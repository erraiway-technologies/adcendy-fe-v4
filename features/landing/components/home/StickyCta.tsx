'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketingAuth } from '@/src/lib/auth/useAuth';
import { HOME_STICKY_CTA as C } from '../../content/home';
import { useScrollFrame } from '../../hooks/useHomeMotion';

/**
 * A bar along the bottom once a visitor is well into the page (past 60%, or
 * 2000px) and before its end, until they dismiss it. It starts the wizard
 * directly.
 */
export function StickyCta() {
  const { status } = useMarketingAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const href = status === 'authed' ? '/app/wizard' : '/auth/signup?next=/app/wizard';

  useScrollFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const share = scrollable > 0 ? window.scrollY / scrollable : 0;
    // Gone again over the closing section and footer, which say the same.
    const nearEnd = scrollable - window.scrollY < 900;
    setVisible((share > 0.6 || window.scrollY > 2000) && !nearEnd);
  });

  const shown = visible && !dismissed;

  return (
    <div
      aria-hidden={!shown}
      inert={!shown}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-3 z-40 px-4',
        'motion-safe:[transition:opacity_.5s,transform_.6s_var(--home-ease)]',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[980px] flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[10px] border border-white/8 bg-[rgba(40,40,40,.82)] py-2.5 pr-2.5 pl-5 backdrop-blur-[16px]">
        <div className="min-w-0">
          <p className="text-base">{C.title}</p>
          <p className="text-sm text-(--home-text-3) max-sm:hidden">{C.body}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="home-button-primary rounded-md bg-white px-4 py-2.5 text-[15px] whitespace-nowrap text-(--home-button-text) hover:bg-(--home-button-hover) motion-safe:transition-colors motion-safe:duration-300"
          >
            {C.cta} →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-(--home-text-3) hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
