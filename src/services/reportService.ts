import { apiClient } from '@/utils/api';

export interface DateFilterParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export const reportService = {
  async getSalesReport(params?: DateFilterParams): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      if (params.groupBy) query.append('groupBy', params.groupBy);
    }
    const queryString = query.toString();
    return apiClient.get(`/api/reports/sales${queryString ? `?${queryString}` : ''}`);
  },

  async getCustomerReport(): Promise<any> {
    return apiClient.get('/api/reports/customers');
  },

  async getGstReport(params?: DateFilterParams): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
    }
    const queryString = query.toString();
    return apiClient.get(`/api/reports/gst${queryString ? `?${queryString}` : ''}`);
  },

  async getItemSalesReport(params?: DateFilterParams): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
    }
    const queryString = query.toString();
    return apiClient.get(`/api/reports/items${queryString ? `?${queryString}` : ''}`);
  }
};
