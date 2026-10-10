import brandMark from '@/shared/brand/adcendy-mark.svg';

/**
 * The breathing AdCendy mark as an in-page loading state - the same mark and
 * animation as the first-load splash (.brand-splash__logo in globals.css), for
 * waits that happen after it, such as the signed-in app checking the session.
 */
export function BrandLoadingMark({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-splash__logo" src={brandMark.src} alt="" width={96} height={96} />
    </div>
  );
}
