import { createRuntimeRepositoryAdapter } from '@/lib/env';
import { adminOrdersMockAdapter } from '../mock/adminOrders.mock';
import { adminOrdersRealAdapter } from '../real/adminOrders.real';
import type {
  AdminOrderPage,
  AdminOrdersQuery,
  AdminRefund,
  CreateRefundPayload,
} from '@/shared/types/adminOrders';

const adapter = createRuntimeRepositoryAdapter(adminOrdersMockAdapter, adminOrdersRealAdapter);

export const adminOrdersRepository = {
  /** Orders newest first, with refunds and the buyer's unused markets. */
  async listOrders(query: AdminOrdersQuery): Promise<AdminOrderPage> {
    return adapter.listOrders(query);
  },

  /** R-14: a short-lived link to an invoice's or credit note's PDF. */
  async getDocumentLink(documentId: string): Promise<{ url: string; fileName: string }> {
    return adapter.getDocumentLink(documentId);
  },

  /** Records the markets decision, then asks Razorpay to refund. */
  async createRefund(orderId: string, payload: CreateRefundPayload): Promise<AdminRefund> {
    return adapter.createRefund(orderId, payload);
  },
};
