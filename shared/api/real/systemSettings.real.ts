import { http } from '../index';
import type { ApiResponse } from '../types';
import {
  normalizeSettingHistory,
  normalizeSystemSetting,
  normalizeSystemSettingsListing,
  type RevertSystemSettingPayload,
  type SettingChange,
  type SystemSetting,
  type SystemSettingsListing,
  type UpdateSystemSettingPayload,
} from '@/shared/types/systemSettings';

const BASE = '/api/v2/admin/pipeline-v2/config';

function unwrapResponseData<T>(response: ApiResponse<T> | T | undefined): T | undefined {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T | undefined;
}

function requireSetting(value: unknown): SystemSetting {
  const setting = normalizeSystemSetting(unwrapResponseData(value));
  if (!setting) {
    throw new Error('The settings service returned an unreadable setting.');
  }
  return setting;
}

export const systemSettingsRealAdapter = {
  async listSettings(): Promise<SystemSettingsListing> {
    const response = await http<ApiResponse<unknown>>(BASE);
    return normalizeSystemSettingsListing(unwrapResponseData(response));
  },

  async listHistory(params: { key?: string; limit?: number } = {}): Promise<SettingChange[]> {
    const response = await http<ApiResponse<unknown>>(`${BASE}/history`, {
      query: { key: params.key, limit: params.limit },
    });
    return normalizeSettingHistory(unwrapResponseData(response));
  },

  async updateSetting(payload: UpdateSystemSettingPayload): Promise<SystemSetting> {
    const response = await http<ApiResponse<unknown>>(
      `${BASE}/${encodeURIComponent(payload.key)}`,
      { method: 'PUT', body: { value: payload.value, reason: payload.reason } },
    );
    return requireSetting(response);
  },

  async revertChange(payload: RevertSystemSettingPayload): Promise<SystemSetting> {
    const response = await http<ApiResponse<unknown>>(
      `${BASE}/changes/${encodeURIComponent(payload.changeId)}/revert`,
      { method: 'POST', body: { reason: payload.reason } },
    );
    return requireSetting(response);
  },
};
