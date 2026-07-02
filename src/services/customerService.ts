import { apiClient } from '@/utils/api';
import { Customer, CustomerFormPayload } from '@/types';

export const customerService = {
  async getCustomers(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ customers: Customer[]; pagination: { total: number; page: number; limit: number; totalPages: number }; stats: { total: number; active: number; inactive: number; newThisMonth: number } }> {
    const query = new URLSearchParams();
    if (params) {
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
    }
    const queryString = query.toString();
    return apiClient.get(`/api/customers${queryString ? `?${queryString}` : ''}`);
  },

  async getCustomerById(id: string): Promise<{ customer: Customer }> {
    return apiClient.get(`/api/customers/${id}`);
  },

  async createCustomer(payload: CustomerFormPayload): Promise<{ customer: Customer }> {
    return apiClient.post('/api/customers', payload);
  },

  async updateCustomer(id: string, payload: CustomerFormPayload): Promise<{ customer: Customer }> {
    return apiClient.put(`/api/customers/${id}`, payload);
  },

  async deleteCustomer(id: string): Promise<any> {
    return apiClient.delete(`/api/customers/${id}`);
  }
};
