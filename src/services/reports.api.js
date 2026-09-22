import apiClient from '@/lib/api';

export const reportsApi = {
  getSummary: async (params = {}) => {
    const response = await apiClient.get('/v1/admin/reports/summary', { params });
    return response.data.data;
  },

  getRevenue: async (params = {}) => {
    const query = typeof params === 'object' ? params : (params ? { year: params } : {});
    const response = await apiClient.get('/v1/admin/reports/revenue', { params: query });
    return response.data.data;
  },

  getUsers: async (params = {}) => {
    const query = typeof params === 'object' ? params : (params ? { year: params } : {});
    const response = await apiClient.get('/v1/admin/reports/users', { params: query });
    return response.data.data;
  },

  getSubscriptions: async (params = {}) => {
    const query = typeof params === 'object' ? params : (params ? { year: params } : {});
    const response = await apiClient.get('/v1/admin/reports/subscriptions', { params: query });
    return response.data.data;
  },

  getPayments: async (params = {}) => {
    const response = await apiClient.get('/v1/admin/reports/payments', { params });
    return response.data.data;
  },
};

export default reportsApi;

