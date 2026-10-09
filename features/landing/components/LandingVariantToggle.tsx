'use client';

import { useState, useEffect } from 'react';
import { LANDING_DESIGN_CONFIG } from '../config/landingDesignConfig';
import {
  LANDING_DESIGN_VARIANTS,
  isLandingDesignVariant,
  type LandingDesignVariant,
} from '../types/landing.types';

const VARIANT_NAMES: Record<LandingDesignVariant, string> = {
  v1: 'Classic (v1)',
  v2: 'Intelligence Stream (v2)',
  v3: 'Dusk (v3)',
};

export function LandingVariantToggle() {
  const [variant, setVariant] = useState<LandingDesignVariant | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LANDING_DESIGN_CONFIG.localStorageKey) as LandingDesignVariant | null;
    setVariant(isLandingDesignVariant(stored) ? stored : LANDING_DESIGN_CONFIG.defaultVariant);
  }, []);

  if (variant === null) return null;

  const next =
    LANDING_DESIGN_VARIANTS[(LANDING_DESIGN_VARIANTS.indexOf(variant) + 1) % LANDING_DESIGN_VARIANTS.length]!;

  const toggle = () => {
    localStorage.setItem(LANDING_DESIGN_CONFIG.localStorageKey, next);
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      title={`Switch to ${VARIANT_NAMES[next]}`}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 100,
        fontFamily: '"Geist Mono", monospace',
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: 'rgba(212,168,83,0.75)',
        background: 'rgba(8,8,7,0.72)',
        border: '1px solid rgba(212,168,83,0.28)',
        borderRadius: '20px',
        padding: '5px 12px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, color 0.2s',
      }}
    >
      {`${variant} → ${next}`}
    </button>
  );
}
