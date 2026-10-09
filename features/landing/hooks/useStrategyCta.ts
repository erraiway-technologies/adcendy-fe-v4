'use client';

import { useMarketingAuth } from '@/src/lib/auth/useAuth';

/**
 * Where "Get your strategy" goes: sign-up for visitors, the app for someone
 * already signed in. `checkout` sends signed-in visitors straight to buying.
 */
export function useStrategyCta(target: 'app' | 'checkout' = 'app'): string {
  const { status } = useMarketingAuth();
  if (status !== 'authed') return '/auth/signup';
  return target === 'checkout' ? '/app/checkout' : '/app';
}
