'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { systemSettingsRepository } from '@/shared/api/repositories';
import type {
  RevertSystemSettingPayload,
  UpdateSystemSettingPayload,
} from '@/shared/types/systemSettings';

export function useSystemSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.systemSettings.list(),
    queryFn: () => systemSettingsRepository.listSettings(),
    enabled,
  });
}

export function useSystemSettingHistory(key: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.systemSettings.history(key ?? undefined),
    queryFn: () => systemSettingsRepository.listHistory({ key: key ?? undefined, limit: 20 }),
    enabled: Boolean(key) && enabled,
  });
}

function useInvalidateSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.systemSettings.all });
}

export function useUpdateSystemSetting() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (payload: UpdateSystemSettingPayload) => systemSettingsRepository.updateSetting(payload),
    onSuccess: invalidate,
  });
}

export function useRevertSystemSettingChange() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (payload: RevertSystemSettingPayload) => systemSettingsRepository.revertChange(payload),
    onSuccess: invalidate,
  });
}
