import { createRuntimeRepositoryAdapter } from '@/lib/env';
import { billingReportsMockAdapter } from '../mock/billingReports.mock';
import { billingReportsRealAdapter } from '../real/billingReports.real';

/** R-14c: the business overview and the monthly GST register, for the admin. */
export const billingReportsRepository = createRuntimeRepositoryAdapter(
  billingReportsMockAdapter,
  billingReportsRealAdapter,
);
