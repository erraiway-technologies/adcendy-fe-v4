import Image from 'next/image';
import { cn } from '@/lib/utils';

/** public/Adcendy-logo-tight.svg is cropped to the artwork: 717 × 307. */
const LOGO_RATIO = 717 / 307;

/**
 * The AdCendy logo, mark and name together, at a given height (px). It is
 * cream on transparent, for the dusk backgrounds it sits on.
 */
export function BrandLogo({
  height = 40,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/Adcendy-logo-tight.svg"
      alt="AdCendy"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      priority={priority}
      className={cn('block max-w-none', className)}
    />
  );
}
