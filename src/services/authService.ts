import { apiClient } from '@/utils/api';

export const authService = {
  async login(body: { identifier: string; password: string }): Promise<any> {
    return apiClient.post('/api/auth/login', body);
  },

  async register(body: { fullName: string; email?: string; phoneNumber?: string; password: string }): Promise<any> {
    return apiClient.post('/api/auth/register', body);
  },

  async logout(): Promise<any> {
    return apiClient.post('/api/auth/logout', {});
  },

  async requestOtp(identifier: string): Promise<any> {
    return apiClient.post('/api/auth/forgot-password', {
      action: 'request-otp',
      identifier
    });
  },

  async resetPassword(body: { identifier: string; otp: string; newPassword: string }): Promise<any> {
    return apiClient.post('/api/auth/forgot-password', {
      action: 'reset-password',
      ...body
    });
  }
};
