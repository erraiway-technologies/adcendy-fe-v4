import type { LandingDesignVariant } from '../types/landing.types';

export const LANDING_DESIGN_CONFIG = {
  defaultVariant: 'v3' as LandingDesignVariant,
  queryParamKey: 'v',
  localStorageKey: 'adcendy_landing_variant',
} as const;
