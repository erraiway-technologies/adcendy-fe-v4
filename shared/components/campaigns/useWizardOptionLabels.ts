'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { wizardRepository } from '@/shared/api/repositories';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function labelMap(options: unknown) {
  const labels = new Map<string, string>();
  if (!Array.isArray(options)) {
    return labels;
  }
  for (const option of options) {
    if (option && typeof option.value === 'string' && typeof option.label === 'string') {
      labels.set(option.value, option.label);
    }
  }
  return labels;
}

/**
 * The backend's written labels for the wizard answers shown outside the
 * wizard (V3-01): an industry by its name, a country by its name. Reads the
 * wizard options the wizard itself loads, so they share one cache entry.
 * Until they load, an industry has no label (never its stored value) and a
 * country reads by the platform's English region name.
 */
export function useWizardOptionLabels() {
  const { data: wizardOptions } = useQuery({
    queryKey: queryKeys.wizard.options(undefined),
    queryFn: () => wizardRepository.getWizardOptions(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const industries = labelMap(wizardOptions?.fieldOptions?.industryCategory);
    const countries = labelMap(wizardOptions?.fieldOptions?.targetMarkets);
    return {
      industry: (value?: string | null) => (value ? (industries.get(value) ?? null) : null),
      country: (code?: string | null) => {
        if (!code) {
          return null;
        }
        const known = countries.get(code);
        if (known) {
          return known;
        }
        try {
          return regionNames.of(code) ?? code;
        } catch {
          return code;
        }
      },
    };
  }, [wizardOptions]);
}

export type WizardOptionLabels = ReturnType<typeof useWizardOptionLabels>;
