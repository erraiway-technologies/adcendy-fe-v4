import { http } from '../index';
import type { ApiResponse } from '../types';
import {
  normalizeAdminPaymentLink,
  normalizeAdminPaymentLinkPage,
  type AdminPaymentLink,
  type AdminPaymentLinkPage,
  type IssuedPaymentLink,
  type PaymentLinkOptions,
  type PaymentLinkPayment,
  type PaymentLinkPreview,
  type PaymentLinkRequest,
  type PaymentLinkState,
  type PublicPaymentLink,
} from '@/shared/types/paymentLinks';

const ADMIN = '/api/v2/admin/billing/payment-links';
const PUBLIC = '/v1/billing/payment-links';

function unwrap<T>(response: ApiResponse<T> | T | undefined): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
}

function issued(value: unknown): IssuedPaymentLink {
  const body = (value ?? {}) as { link?: unknown; url?: unknown };
  const link = normalizeAdminPaymentLink(body.link);
  if (!link || typeof body.url !== 'string') {
    throw new Error('The payment links service returned no link.');
  }
  return { link, url: body.url };
}

const publicPath = (key: string, suffix = '') => `${PUBLIC}/${encodeURIComponent(key)}${suffix}`;

export const paymentLinksRealAdapter = {
  async options(query: { pricingCountryCode?: string; clientEmail?: string }): Promise<PaymentLinkOptions> {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value));
    return unwrap(await http<ApiResponse<PaymentLinkOptions>>(`${ADMIN}/options`, { query: params }));
  },

  async preview(request: PaymentLinkRequest): Promise<PaymentLinkPreview> {
    return unwrap(await http<ApiResponse<PaymentLinkPreview>>(`${ADMIN}/preview`, { method: 'POST', body: request }));
  },

  async create(request: PaymentLinkRequest): Promise<IssuedPaymentLink> {
    return issued(unwrap(await http<ApiResponse<unknown>>(ADMIN, { method: 'POST', body: request })));
  },

  async list(query: { page?: number; pageSize?: number }): Promise<AdminPaymentLinkPage> {
    return normalizeAdminPaymentLinkPage(unwrap(await http<ApiResponse<unknown>>(ADMIN, { query })));
  },

  async cancel(id: string): Promise<AdminPaymentLink> {
    const link = normalizeAdminPaymentLink(
      unwrap(await http<ApiResponse<unknown>>(`${ADMIN}/${encodeURIComponent(id)}/cancel`, { method: 'POST' })),
    );
    if (!link) throw new Error('The payment links service returned no link.');
    return link;
  },

  async renew(id: string, expiresInDays?: number): Promise<IssuedPaymentLink> {
    return issued(
      unwrap(
        await http<ApiResponse<unknown>>(`${ADMIN}/${encodeURIComponent(id)}/renew`, {
          method: 'POST',
          body: expiresInDays ? { expiresInDays } : {},
        }),
      ),
    );
  },

  async publicState(key: string): Promise<{ state: PaymentLinkState }> {
    return unwrap(await http<ApiResponse<{ state: PaymentLinkState }>>(publicPath(key), { skipAuth: true }));
  },

  async open(key: string, email: string): Promise<PublicPaymentLink> {
    return unwrap(
      await http<ApiResponse<PublicPaymentLink>>(publicPath(key, '/open'), {
        method: 'POST',
        body: { email },
        skipAuth: true,
      }),
    );
  },

  async pay(
    key: string,
    input: { email: string; acceptedLegalDocumentVersionIdsV2: string[]; givenConsentTypesV2: string[] },
  ): Promise<PaymentLinkPayment> {
    return unwrap(
      await http<ApiResponse<PaymentLinkPayment>>(publicPath(key, '/pay'), {
        method: 'POST',
        body: input,
        skipAuth: true,
      }),
    );
  },

  async verify(
    key: string,
    input: { email: string; providerOrderId: string; providerPaymentId: string; signature: string },
  ): Promise<{ state: PaymentLinkState }> {
    return unwrap(
      await http<ApiResponse<{ state: PaymentLinkState }>>(publicPath(key, '/verify'), {
        method: 'POST',
        body: input,
        skipAuth: true,
      }),
    );
  },
};
