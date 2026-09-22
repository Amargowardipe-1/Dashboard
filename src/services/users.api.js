import apiClient from '@/lib/api';

// Dynamic Plan Name Formatter
const formatPlanName = (planStr) => {
  if (!planStr || planStr === 'free' || planStr === 'none') return 'Free Tier';
  const str = String(planStr).trim();
  if (str === 'pro') return 'Pro Plan';
  if (str === 'basic') return 'Basic Plan';
  if (str === 'business' || str === 'business-plan') return 'Business Plan';
  return str
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

// Dynamic User Status Resolver:
// 1. Account Suspended -> "Suspended"
// 2. Paid Plan (basic, pro, business, or any future plan != free) AND active subscription status -> "Active"
// 3. Free Tier OR inactive/expired subscription -> "Pending"
const resolveUserStatus = (u) => {
  if (u.accountStatus === 'suspended') return 'Suspended';

  const planSlug = String(u.subscription?.plan || 'free').toLowerCase().trim();
  const subStatus = String(u.subscription?.status || 'inactive').toLowerCase().trim();

  // Free Tier is always 'Pending'
  if (planSlug === 'free' || planSlug === 'none') {
    return 'Pending';
  }

  // Any paid plan (basic, pro, business, or future plans) with active subscription status is 'Active'
  if (subStatus === 'active') {
    return 'Active';
  }

  // Paid plan with inactive/expired/cancelled subscription is 'Pending'
  return 'Pending';
};

export const usersApi = {
  getUsers: async (params = {}) => {
    const { search = '', status = 'All', plan = 'All', page = 1, limit = 8 } = params;
    
    const queryParams = {};
    if (search) queryParams.search = search;
    if (status && status !== 'All') {
      queryParams.status = status.toLowerCase();
    }
    if (plan && plan !== 'All') {
      queryParams.plan = plan.toLowerCase();
    }
    queryParams.page = page;
    queryParams.limit = limit;

    const response = await apiClient.get('/v1/admin/users', { params: queryParams });
    const { users, total, page: currentPage, totalPages } = response.data.data;

    const mappedUsers = users.map(u => ({
      id: u._id,
      name: u.fullName,
      email: u.email,
      subscription: formatPlanName(u.subscription?.plan),
      status: resolveUserStatus(u),
      accountStatus: u.accountStatus || 'active',
      joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      avatar: u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
    }));

    return {
      users: mappedUsers,
      total,
      page: currentPage,
      totalPages
    };
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/v1/admin/users/${id}`);
    const { user, payments } = response.data.data;

    return {
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        subscription: formatPlanName(user.subscription?.plan),
        status: resolveUserStatus(user),
        accountStatus: user.accountStatus || 'active',
        joinedDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
        avatar: user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
      },
      payments: payments.map(p => ({
        id: p._id,
        amount: p.amount,
        status: p.status === 'success' ? 'Success' : (p.status === 'pending' ? 'Pending' : 'Failed'),
        date: p.paidAt ? new Date(p.paidAt).toLocaleString() : ''
      }))
    };
  },

  toggleStatus: async (id) => {
    const response = await apiClient.patch(`/v1/admin/users/${id}/status`);
    return response.data.data;
  },

  resetPassword: async (id) => {
    const response = await apiClient.post(`/v1/admin/users/${id}/reset-password`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/v1/admin/users', userData);
    return response.data;
  },
};
export default usersApi;
