import { http, httpRaw } from '../index';
import type { ApiResponse } from '../types';
import type { BusinessOverview, GstMonth } from '@/shared/types/billingReports';

const BASE = '/api/v2/admin/billing/reports';

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
}

export const billingReportsRealAdapter = {
  async overview(query: { from?: string; to?: string }): Promise<BusinessOverview> {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value));
    return unwrap(await http<ApiResponse<BusinessOverview>>(`${BASE}/overview`, { query: params }));
  },

  async gstMonth(month: string): Promise<GstMonth> {
    return unwrap(await http<ApiResponse<GstMonth>>(`${BASE}/gst`, { query: { month } }));
  },

  /** The month's register as a CSV file. */
  async gstMonthCsv(month: string): Promise<{ blob: Blob; fileName: string }> {
    const response = await httpRaw<Blob>(`${BASE}/gst.csv`, {
      query: { month },
      headers: { Accept: 'text/csv' },
      responseType: 'blob',
    });
    return { blob: response.data, fileName: `adcendy-gst-register-${month}.csv` };
  },
};
