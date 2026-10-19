import { http } from '../index';
import type { ApiResponse } from '../types';
import {
  normalizeProspectScanDetail,
  normalizeProspectScanList,
  normalizeProspectScanSpend,
  normalizeProspectScanSummary,
  normalizeProspectSubmitResult,
  type MarkOutreachSentPayload,
  type ProspectInputsPatch,
  type ProspectOperatorFactPayload,
  type ProspectScanDetail,
  type ProspectScanListItem,
  type ProspectScanSpend,
  type ProspectScanSummary,
  type ProspectSubmission,
  type ProspectSubmitResult,
} from '@/shared/types/prospectScans';

const BASE = '/api/v2/admin/prospect-scans';

function unwrapResponseData<T>(response: ApiResponse<T> | T | undefined): T | undefined {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T | undefined;
}

const scanPath = (scanId: string) => `${BASE}/${encodeURIComponent(scanId)}`;

function requireDetail(value: unknown): ProspectScanDetail {
  const detail = normalizeProspectScanDetail(value);
  if (!detail) {
    throw new Error('The prospect scan service returned an unreadable scan.');
  }
  return detail;
}

export const prospectScansRealAdapter = {
  async list(query: { batchId?: string; status?: string }): Promise<ProspectScanListItem[]> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
    );
    const response = await http<ApiResponse<unknown>>(BASE, { query: params });
    return normalizeProspectScanList(unwrapResponseData(response));
  },

  async summary(batchId?: string): Promise<ProspectScanSummary> {
    const response = await http<ApiResponse<unknown>>(`${BASE}/summary`, {
      query: batchId ? { batchId } : {},
    });
    return normalizeProspectScanSummary(unwrapResponseData(response));
  },

  async spend(): Promise<ProspectScanSpend> {
    const response = await http<ApiResponse<unknown>>(`${BASE}/spend`);
    return normalizeProspectScanSpend(unwrapResponseData(response));
  },

  async get(scanId: string): Promise<ProspectScanDetail> {
    const response = await http<ApiResponse<unknown>>(scanPath(scanId));
    return requireDetail(unwrapResponseData(response));
  },

  // Re-submitting a prospect returns the existing scan, so a replay is safe.
  async submit(prospects: ProspectSubmission[]): Promise<ProspectSubmitResult> {
    const response = await http<ApiResponse<unknown>>(BASE, {
      method: 'POST',
      body: { prospects },
      allowAuthReplay: true,
    });
    return normalizeProspectSubmitResult(unwrapResponseData(response));
  },

  // A hand reading replaces the operator's earlier one of its kind.
  async addFact(scanId: string, payload: ProspectOperatorFactPayload): Promise<ProspectScanDetail> {
    const response = await http<ApiResponse<unknown>>(`${scanPath(scanId)}/facts`, {
      method: 'POST',
      body: payload,
      allowAuthReplay: true,
    });
    return requireDetail(unwrapResponseData(response));
  },

  async updateInputs(
    scanId: string,
    patch: ProspectInputsPatch,
  ): Promise<ProspectScanDetail & { rescanNeeded: boolean }> {
    const response = await http<ApiResponse<unknown>>(scanPath(scanId), {
      method: 'PATCH',
      body: patch,
      allowAuthReplay: true,
    });
    const data = unwrapResponseData(response);
    return {
      ...requireDetail(data),
      rescanNeeded:
        Boolean(data) && typeof data === 'object' && (data as Record<string, unknown>).rescanNeeded === true,
    };
  },

  async rescan(scanId: string): Promise<void> {
    await http<ApiResponse<unknown>>(`${scanPath(scanId)}/rescan`, {
      method: 'POST',
      allowAuthReplay: true,
    });
  },

  async recheck(scanId: string): Promise<void> {
    await http<ApiResponse<unknown>>(`${scanPath(scanId)}/recheck`, {
      method: 'POST',
      allowAuthReplay: true,
    });
  },

  // Not replayed after a session refresh: a replay would read as a second send.
  async markSent(scanId: string, payload: MarkOutreachSentPayload): Promise<void> {
    await http<ApiResponse<unknown>>(`${scanPath(scanId)}/outreach/sent`, {
      method: 'POST',
      body: payload,
    });
  },

  async exportCsv(batchId?: string): Promise<string> {
    return http<string>(`${BASE}/export.csv`, {
      query: batchId ? { batchId } : {},
      responseType: 'text',
    });
  },
};
