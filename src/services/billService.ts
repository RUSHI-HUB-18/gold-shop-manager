import { apiClient } from '@/utils/api';
import { Bill, BillFormPayload } from '@/types';

export const billService = {
  async getBills(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ bills: Bill[]; pagination: { total: number; page: number; limit: number; totalPages: number }; stats: { totalSales: number; count: number; gstCollected: number; discountAmount: number } }> {
    const query = new URLSearchParams();
    if (params) {
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
    }
    const queryString = query.toString();
    return apiClient.get(`/api/bills${queryString ? `?${queryString}` : ''}`);
  },

  async getBillById(id: string): Promise<{ bill: Bill }> {
    return apiClient.get(`/api/bills/${id}`);
  },

  async createBill(payload: BillFormPayload): Promise<{ bill: Bill }> {
    return apiClient.post('/api/bills', payload);
  }
};
