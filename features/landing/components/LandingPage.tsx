'use client';

import dynamic from 'next/dynamic';
import { useRuntimeConfigReady } from '@/shared/runtime-config/features';
import { canOverrideLandingVariant, useLandingDesignVariant } from '../hooks/useLandingDesignVariant';

const LandingPageV1 = dynamic(() => import('./LandingPageV1').then(m => ({ default: m.LandingPageV1 })));
const LandingPageV2 = dynamic(() => import('./LandingPageV2').then(m => ({ default: m.LandingPageV2 })));
const LandingPageV3 = dynamic(() => import('./LandingPageV3').then(m => ({ default: m.LandingPageV3 })));
const LandingVariantToggle = dynamic(
  () => import('./LandingVariantToggle').then(m => ({ default: m.LandingVariantToggle })),
  { ssr: false }
);

export function LandingPage() {
  const variant = useLandingDesignVariant();
  // The toggle depends on the runtime configuration, which the server never
  // has: deciding before it is ready would make the browser's first render
  // disagree with the server's HTML.
  const runtimeConfigReady = useRuntimeConfigReady();

  return (
    <>
      {variant === 'v1' ? <LandingPageV1 /> : variant === 'v2' ? <LandingPageV2 /> : <LandingPageV3 />}
      {runtimeConfigReady && canOverrideLandingVariant() && <LandingVariantToggle />}
    </>
  );
}
