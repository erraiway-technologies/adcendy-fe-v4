'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect } from 'react';

const DuskRidgesCanvas = dynamic(
  () => import('@/features/landing/components/home/DuskRidgesCanvas').then(m => ({ default: m.DuskRidgesCanvas })),
  { ssr: false },
);

/** The homepage hero's sky, so signing in feels like the same place. */
const DUSK_SKY =
  'linear-gradient(180deg,#1A1D23 0%,#262B34 34%,#3F4250 54%,#5B5157 62%,#2C2828 72%,#232323 100%)';

function DuskBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: DUSK_SKY }}>
      <div
        className="pointer-events-none absolute top-[62%] left-1/2 -mt-[260px] -ml-[800px] h-[520px] w-[1600px] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(232,172,132,.32), transparent)' }}
      />
      <DuskRidgesCanvas className="absolute inset-0 block size-full" />
      <div className="pointer-events-none absolute inset-0 bg-[url('/textures/grain.png')] opacity-55 mix-blend-overlay" />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="absolute top-4 right-4 z-20 font-geist-mono text-xs tracking-[.06em] text-white/60 uppercase hover:text-white"
    >
      Back
    </Link>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[clamp(36px,4vw,48px)] leading-[1.05] font-normal tracking-[-.02em] text-white">{title}</h1>
      <p className="mt-2 text-[15px] text-(--home-text-3)">{subtitle}</p>
    </div>
  );
}

const CARD = 'relative w-full rounded-[10px] border border-white/8 bg-[rgba(40,40,40,.82)] shadow-[0_40px_80px_rgba(0,0,0,.35)] backdrop-blur-[16px]';

export function AuthV2Shell({
  title,
  subtitle,
  children,
  modal = false,
}: {
  /** Optional: a form with headings of its own (one per step) leaves them out. */
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  modal?: boolean;
}) {
  useEffect(() => {
    if (!modal) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
    };
  }, [modal]);

  if (modal) {
    return (
      <div className="fixed inset-0 z-40 overflow-hidden bg-(--home-bg) text-(--home-text)">
        <DuskBackdrop />
        <div className="relative z-10 h-dvh overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 pt-[84px] pb-8">
            <div className={CARD} style={{ width: 'min(92vw, 560px)' }}>
              <BackLink />
              <div className="px-8 py-10 md:px-10">
                {title && <Heading title={title} subtitle={subtitle ?? ''} />}
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--home-bg) px-4 pt-[84px] pb-8 text-(--home-text)">
      <div
        className="relative w-full overflow-hidden rounded-[10px] border border-white/8 bg-(--home-surface) shadow-[0_40px_80px_rgba(0,0,0,.35)]"
        style={{ width: 'min(92vw, 900px)', minHeight: '640px' }}
      >
        <BackLink />
        <div className="grid min-h-[640px] grid-cols-1 md:grid-cols-[40%_60%]">
          <div className="relative hidden border-r border-white/8 md:block">
            <DuskBackdrop />
          </div>
          <div className="relative z-10 flex items-center justify-center px-8 py-10 md:px-12">
            <div className="w-full max-w-[440px]">
              {title && <Heading title={title} subtitle={subtitle ?? ''} />}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
