import type { BusinessOverview, GstMonth } from '../../types/billingReports.ts';

// Local stand-in for the reports: one Indian and one US client.

const line = (currency: string, orders: number, grossMinor: number, taxMinor: number, refundedMinor = 0) => ({
  currency,
  orders,
  grossMinor,
  taxMinor,
  refundedMinor,
  netMinor: grossMinor - refundedMinor,
  credits: orders,
});

export const billingReportsMockAdapter = {
  async overview(query: { from?: string; to?: string }): Promise<BusinessOverview> {
    const to = query.to ?? '2026-11';
    const from = query.from ?? '2026-10';
    return {
      from,
      to,
      months: [from, to],
      totals: [line('INR', 2, 4_696_400, 716_400, 100_000), line('USD', 1, 60_000, 0)],
      byMonth: [
        { ...line('INR', 0, 0, 0), month: from },
        { ...line('INR', 2, 4_696_400, 716_400, 100_000), month: to },
        { ...line('USD', 0, 0, 0), month: from },
        { ...line('USD', 1, 60_000, 0), month: to },
      ],
      byCountry: [
        { ...line('INR', 2, 4_696_400, 716_400, 100_000), country: 'IN' },
        { ...line('USD', 1, 60_000, 0), country: 'US' },
      ],
      byChannel: [
        { ...line('INR', 2, 4_696_400, 716_400, 100_000), channel: 'checkout' },
        { ...line('USD', 1, 60_000, 0), channel: 'checkout' },
      ],
      byClient: [
        {
          ...line('INR', 2, 4_696_400, 716_400, 100_000),
          userId: 'u1',
          email: 'client@example.com',
          name: 'Example Client',
          countries: ['IN'],
          firstPaidAt: '2026-11-02T06:00:00.000Z',
          lastPaidAt: '2026-11-20T06:00:00.000Z',
        },
        {
          ...line('USD', 1, 60_000, 0),
          userId: 'u2',
          email: 'buyer@example.us',
          name: null,
          countries: ['US'],
          firstPaidAt: '2026-11-05T06:00:00.000Z',
          lastPaidAt: '2026-11-05T06:00:00.000Z',
        },
      ],
      clientCount: 2,
    };
  },

  async gstMonth(month: string): Promise<GstMonth> {
    const totals = { count: 2, taxableMinor: 3_980_000, cgstMinor: 0, sgstMinor: 0, igstMinor: 716_400, totalMinor: 4_696_400 };
    const none = { count: 0, taxableMinor: 0, cgstMinor: 0, sgstMinor: 0, igstMinor: 0, totalMinor: 0 };
    return {
      month,
      rows: [],
      summary: {
        invoices: totals,
        creditNotes: none,
        net: { b2b: none, b2c: totals },
        b2cByState: [{ ...totals, stateCode: '27', placeOfSupply: 'Maharashtra (27)' }],
        exports: [{ ...none, count: 1, taxableMinor: 60_000, totalMinor: 60_000, currency: 'USD' }],
        sacCodes: ['998311'],
      },
    };
  },

  async gstMonthCsv(month: string): Promise<{ blob: Blob; fileName: string }> {
    return { blob: new Blob(['Type,Number\r\n'], { type: 'text/csv' }), fileName: `adcendy-gst-register-${month}.csv` };
  },
};
