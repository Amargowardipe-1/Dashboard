import apiClient from '@/lib/api';

export const settingsApi = {
  getSettings: async () => {
    const response = await apiClient.get('/v1/admin/settings');
    return response.data.data;
  },
  updateSettings: async (payload) => {
    const response = await apiClient.put('/v1/admin/settings', payload);
    return response.data.data;
  },
  testPaymentGateway: async (payload) => {
    const response = await apiClient.post('/v1/admin/settings/test-payment', payload);
    return response.data;
  },
};

export default settingsApi;
