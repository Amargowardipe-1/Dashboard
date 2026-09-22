import apiClient from '@/lib/api';

export const supportApi = {
  getSupportQueries: async () => {
    const response = await apiClient.get('/v1/admin/support-queries');
    return response.data;
  },
  updateQueryStatus: async (id, status) => {
    const response = await apiClient.patch(`/v1/admin/support-queries/${id}/status`, { status });
    return response.data;
  },
  replyToQuery: async (id, payload) => {
    const response = await apiClient.post(`/v1/admin/support-queries/${id}/reply`, payload);
    return response.data;
  },
  deleteQuery: async (id) => {
    const response = await apiClient.delete(`/v1/admin/support-queries/${id}`);
    return response.data;
  },
};
