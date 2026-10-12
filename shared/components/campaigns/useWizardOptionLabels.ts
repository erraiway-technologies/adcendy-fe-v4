'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { wizardRepository } from '@/shared/api/repositories';
import { createWizardOptionLabels } from '@/shared/types/wizard';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * The backend's written labels for wizard answers shown outside the wizard
 * (V3-01, V3-03), read from the wizard options the wizard itself loads, so
 * they share one cache entry. `label` and `list` give any answer by its
 * served label, or as itself when it has none. An industry has no label until
 * they load (never its stored value), and a country reads by the platform's
 * English region name.
 */
export function useWizardOptionLabels() {
  const { data: wizardOptions } = useQuery({
    queryKey: queryKeys.wizard.options(undefined),
    queryFn: () => wizardRepository.getWizardOptions(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const labels = createWizardOptionLabels(wizardOptions);
    return {
      ...labels,
      industry: (value?: string | null) => labels.find('industryCategory', value),
      country: (code?: string | null) => {
        if (!code) {
          return null;
        }
        const known = labels.find('targetMarkets', code);
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
