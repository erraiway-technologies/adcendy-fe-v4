export type LandingDesignVariant = 'v1' | 'v2' | 'v3';

export const LANDING_DESIGN_VARIANTS: readonly LandingDesignVariant[] = ['v1', 'v2', 'v3'];

export function isLandingDesignVariant(value: unknown): value is LandingDesignVariant {
  return LANDING_DESIGN_VARIANTS.includes(value as LandingDesignVariant);
}
