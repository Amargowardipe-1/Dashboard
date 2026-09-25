import apiClient from '@/lib/api';

export const dashboardApi = {
  getSummary: async () => {
    const response = await apiClient.get('/v1/admin/dashboard');
    const { cards, charts, recentActivity } = response.data.data;

    // Build real sparklines from the 7-day trends returned by the backend
    const revenueSpark = charts.revenueTrend?.map(t => t.revenue) || [0];
    const usersSpark = charts.userGrowthTrend?.map(t => t.users) || [0];
    // Monthly users sparkline — daily signups for current month (synced with monthly card)
    const monthlyUsersSpark = charts.monthlyUsersTrend?.map(t => t.users) || [0];

    // Adapt stats to frontend expected shape
    const stats = {
      totalUsers: { value: cards.users.total || 0, growth: 0.0, label: 'Total Users' },
      verifiedUsers: { value: cards.users.verified || 0, growth: 0.0, label: 'Verified Users' },
      premiumUsers: { value: cards.users.premium || 0, growth: 0.0, label: 'Premium Users' },
      freeUsers: { value: cards.users.free || 0, growth: 0.0, label: 'Free Users' },
      todayUsers: { value: cards.users.today || 0, growth: 0.0, label: "Today's Signups" },
      monthlyUsers: { value: cards.users.monthly || 0, growth: cards.users.monthlyGrowth || 0.0, label: 'Monthly Signups' },
      totalRevenue: { value: cards.revenue.total || 0, growth: 0.0, label: 'Total Revenue' },
      todayRevenue: { value: cards.revenue.today || 0, growth: 0.0, label: "Today's Revenue" },
      monthlyRevenue: { value: cards.revenue.monthly || 0, growth: 0.0, label: 'Monthly Recurring Revenue' },
      pendingPayments: { value: cards.payments.pending || 0, growth: 0.0, label: 'Pending Payments' },
      activePlans: { value: cards.plans.active || 0, growth: 0.0, label: 'Active Plans' }
    };

    const sparklines = {
      totalUsers: usersSpark,
      verifiedUsers: usersSpark,
      premiumUsers: usersSpark,
      freeUsers: usersSpark,
      todayUsers: usersSpark,
      monthlyUsers: monthlyUsersSpark,
      totalRevenue: revenueSpark,
      todayRevenue: revenueSpark,
      monthlyRevenue: revenueSpark,
      pendingPayments: [cards.payments.pending || 0],
      activePlans: [cards.plans.active || 0]
    };

    // Color palette for plans
    const PLAN_COLORS = {
      'free': '#94a3b8',
      'basic': '#6366f1',
      'pro': '#10b981',
      'business': '#f59e0b',
      'business-plan': '#f59e0b',
      'enterprise': '#ec4899',
      'enterprise-plan': '#ec4899',
      'ultra-pros': '#8b5cf6',
      'ultra-pro': '#8b5cf6',
    };

    const PALETTE = [
      '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#3b82f6',
    ];

    const getPlanColor = (slug, index) => {
      const s = String(slug || '').toLowerCase().trim();
      if (PLAN_COLORS[s]) return PLAN_COLORS[s];
      return PALETTE[index % PALETTE.length];
    };

    // 1. Revenue trend: backend gives array of { date, revenue, plans }
    const trend = charts.revenueTrend?.map(t => {
      const item = {
        name: t.date || t._id,
        Total: t.revenue || 0,
      };
      if (t.plans && typeof t.plans === 'object') {
        Object.entries(t.plans).forEach(([planName, val]) => {
          item[planName] = val || 0;
        });
      }
      return item;
    }) || [];

    // 2. Revenue by plan (Pie Chart): backend gives array of { slug, name, revenue, payments }
    const pie = charts.revenueByPlan?.map((p, idx) => ({
      name: p.name || 'Free Tier',
      value: p.revenue || 0,
      color: getPlanColor(p.slug, idx),
      slug: p.slug
    })) || [];

    // Adapt recentActivity tables
    const latestUsers = recentActivity.latestUsers?.map(u => ({
      id: u._id,
      name: u.fullName,
      email: u.email,
      subscription: u.subscription?.plan === 'pro' ? 'Pro Plan' : 'Free Tier',
      status: u.subscription?.status === 'active' ? 'Active' : 'Inactive',
      joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      avatar: u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
    })) || [];

    const latestPayments = recentActivity.latestPayments?.map(p => ({
      id: p._id,
      user: p.userId?.fullName || 'Unknown User',
      email: p.userId?.email || '',
      amount: p.amount || 0,
      provider: p.provider || 'Gateway',
      status: p.status === 'success' ? 'Success' : (p.status === 'pending' ? 'Pending' : 'Failed'),
      plan: p.plan || 'Subscription',
      date: p.paidAt ? new Date(p.paidAt).toLocaleString() : new Date(p.createdAt).toLocaleString()
    })) || [];

    return {
      stats,
      sparklines,
      trend,
      pie,
      latestUsers,
      latestPayments,
      revenueCurrency: cards.revenue?.revenueCurrency || 'INR',
    };
  }
};
export default dashboardApi;
