import { http } from '../index';
import { readMetaTokenHealth, type MetaTokenHealth } from '@/shared/components/ops/metaAccess';

/** Admin-only Meta access endpoints (backend `admin/meta`, V3-401). */
export const metaAccessApi = {
  async status(): Promise<MetaTokenHealth | null> {
    return readMetaTokenHealth(await http<unknown>('/v1/admin/meta/token/status'));
  },

  /** Asks Meta about the token first; a token Meta refuses is not saved. */
  async save(accessToken: string): Promise<void> {
    const response = await http<unknown>('/v1/admin/meta/token/inject', {
      method: 'POST',
      body: { accessToken, source: 'admin_page' },
    });
    const record = (response && typeof response === 'object' ? (response as Record<string, unknown>) : {}) as Record<
      string,
      unknown
    >;
    const data = (record.data && typeof record.data === 'object' ? record.data : record) as Record<string, unknown>;
    if (data.success === false) {
      throw new Error(typeof data.message === 'string' ? data.message : 'Meta token was not saved.');
    }
  },

  /** A small read of the Meta Ad Library with the saved token. */
  async verify(): Promise<{ ok: boolean; detail: string }> {
    try {
      const response = await http<unknown>('/v1/admin/meta/token/verify', {
        method: 'POST',
        body: { searchTerms: 'software', countryCode: 'IN' },
      });
      const record = (response && typeof response === 'object' ? (response as Record<string, unknown>) : {}) as Record<
        string,
        unknown
      >;
      const data = (record.data && typeof record.data === 'object' ? record.data : record) as Record<string, unknown>;
      const count = typeof data.resultCount === 'number' ? data.resultCount : 0;
      return { ok: true, detail: `The Ad Library answered (${count} sample ad${count === 1 ? '' : 's'}).` };
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : 'The Ad Library request failed.' };
    }
  },
};
