import apiClient from '@/lib/api';

export const analyticsApi = {
  getCharts: async (params = {}) => {
    try {
      const response = await apiClient.get('/v1/admin/analytics', { params });
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn('Analytics endpoint failed, falling back to dashboard metrics', e);
    }

    const response = await apiClient.get('/v1/admin/dashboard');
    const { charts, advancedMetrics } = response.data?.data || {};

    // Adapt user growth trend: backend returns {_id: "YYYY-MM-DD", users: count}
    const growth = charts?.userGrowthTrend?.map(t => ({
      date: t._id,
      day: t._id,
      name: t._id,
      Signups: t.users,
      ActiveUsers: t.users
    })) || [];

    const subscriptions = charts?.subscriptionDistribution?.map(d => ({
      name: d._id === 'pro' ? 'Pro Plan' : (d._id === 'basic' ? 'Basic Plan' : (d._id === 'business-plan' || d._id === 'business' ? 'Business Plan' : 'Free Tier')),
      Active: d.users,
      Churned: 0
    })) || [];

    return {
      growth,
      subscriptions,
      advancedMetrics
    };
  }
};
export default analyticsApi;


