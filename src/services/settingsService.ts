import { apiClient } from '@/utils/api';

export const settingsService = {
  async getSettings(): Promise<any> {
    return apiClient.get('/api/settings');
  },

  async updateSettings(gstPercentage: number): Promise<any> {
    return apiClient.post('/api/settings', { gstPercentage });
  },

  async getGoldRate(): Promise<any> {
    return apiClient.get('/api/gold-rate');
  },

  async updateGoldRate(rate22K: number, rate24K: number | null): Promise<any> {
    return apiClient.post('/api/gold-rate', { rate22K, rate24K });
  }
};
