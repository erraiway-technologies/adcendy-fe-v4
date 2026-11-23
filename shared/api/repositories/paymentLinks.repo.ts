import { createRuntimeRepositoryAdapter } from '@/lib/env';
import { paymentLinksMockAdapter } from '../mock/paymentLinks.mock';
import { paymentLinksRealAdapter } from '../real/paymentLinks.real';

const adapter = createRuntimeRepositoryAdapter(
  paymentLinksMockAdapter as unknown as typeof paymentLinksRealAdapter,
  paymentLinksRealAdapter,
);

/** R-14b: payment links, for the admin orders screen and the public payment page. */
export const paymentLinksRepository = adapter;
