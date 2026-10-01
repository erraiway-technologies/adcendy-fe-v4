import ENV, { createRuntimeRepositoryAdapter } from '@/lib/env';
import { systemSettingsMockAdapter } from '../mock/systemSettings.mock';
import { systemSettingsRealAdapter } from '../real/systemSettings.real';
import type {
  RevertSystemSettingPayload,
  SettingChange,
  SystemSetting,
  SystemSettingsListing,
  UpdateSystemSettingPayload,
} from '@/shared/types/systemSettings';

const adapter = createRuntimeRepositoryAdapter(systemSettingsMockAdapter, systemSettingsRealAdapter);

if (ENV.features.apiLogging && typeof window !== 'undefined') {
  console.log('[System Settings Repository] Using adapter:', ENV.API.dataSource);
}

export const systemSettingsRepository = {
  /** Every setting with its value, default, effect and limits. */
  async listSettings(): Promise<SystemSettingsListing> {
    return adapter.listSettings();
  },

  /** Recent changes, newest first; one setting's when `key` is given. */
  async listHistory(params: { key?: string; limit?: number } = {}): Promise<SettingChange[]> {
    return adapter.listHistory(params);
  },

  async updateSetting(payload: UpdateSystemSettingPayload): Promise<SystemSetting> {
    return adapter.updateSetting(payload);
  },

  /** Puts back the value a change replaced, as a new change with its own reason. */
  async revertChange(payload: RevertSystemSettingPayload): Promise<SystemSetting> {
    return adapter.revertChange(payload);
  },
};
