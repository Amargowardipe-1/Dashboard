'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/services/plans.api';
import { dashboardApi } from '@/services/dashboard.api';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartSkeleton } from '../ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Layers, ShieldCheck, Zap, Server, ShieldAlert, ChevronRight, Trash2, Pencil } from 'lucide-react';
import Dialog from '../ui/Dialog';

const ICON_MAP = {
  server: Server,
  layers: Layers,
  zap: Zap,
  shield: ShieldAlert,
  crown: Zap
};

const COLOR_MAP = {
  free: 'text-slate-500 bg-slate-500/10',
  basic: 'text-indigo-500 bg-indigo-500/10',
  pro: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/5',
  enterprise: 'text-amber-500 bg-amber-500/10'
};

const EMPTY_CREATE_FORM = {
  name: '',
  slug: '',
  description: '',
  price: '',
  billingCycle: 'monthly',
  durationDays: '30',
  icon: 'crown',
  status: 'active',
  features: '',
  chatbotLimit: 50,
  receiptScannerLimit: 30,
  voiceScannerLimit: 20,
  gracePeriodDays: 7,
  enableSplitBill: true,
  _slugEdited: false,
};

export default function PlansView() {
  const queryClient = useQueryClient();
  const { symbol, currency, formatAmount, convertAmount } = useCurrency();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  // Edit Plan & Price State
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    durationDays: '30',
    status: 'active',
    description: '',
    features: '',
    chatbotLimit: 0,
    receiptScannerLimit: 0,
    voiceScannerLimit: 0,
    gracePeriodDays: 7,
    enableSplitBill: true,
  });

  // Form states for configuration
  const [chatbotLimit, setChatbotLimit] = useState(0);
  const [receiptScannerLimit, setReceiptScannerLimit] = useState(0);
  const [voiceScannerLimit, setVoiceScannerLimit] = useState(0);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [splitBillEnabled, setSplitBillEnabled] = useState(true);

  const { data: plans = [], isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ['plansList'],
    queryFn: () => plansApi.getPlans()
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => dashboardApi.getSummary()
  });

  const updateLimitsMutation = useMutation({
    mutationFn: ({ id, limits }) => plansApi.updateLimits(id, limits),
    onSuccess: () => {
      queryClient.invalidateQueries(['plansList']);
      alert('Plan limits updated successfully.');
      setSelectedPlan(null);
    },
    onError: (err) => alert(err.message || 'Failed to update plan limits.')
  });

  const createPlanMutation = useMutation({
    mutationFn: (data) => plansApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['plansList']);
      alert(`Plan created successfully in ${currency}! Mobile app users will see auto-conversion in their own app currency.`);
      setIsCreateModalOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err.message || 'Failed to create plan.';
      alert(`Error: ${msg}`);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => plansApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['plansList']);
      alert(`Plan price updated successfully in ${currency}!`);
      setEditingPlan(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err.message || 'Failed to update plan.';
      alert(`Error: ${msg}`);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => plansApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['plansList']);
      alert('Plan deleted successfully.');
    },
    onError: (err) => alert(err.message || 'Failed to delete plan.')
  });

  const handleConfigureLimits = (plan) => {
    setSelectedPlan(plan);
    setChatbotLimit(plan.limits?.chatbotLimit || 0);
    setReceiptScannerLimit(plan.limits?.receiptScannerLimit || 0);
    setVoiceScannerLimit(plan.limits?.voiceScannerLimit || 0);
    setGracePeriodDays(plan.limits?.gracePeriodDays || 7);
    setSplitBillEnabled(plan.limits?.enableSplitBill !== false);
  };

  const handleSaveLimits = (e) => {
    e.preventDefault();
    if (!selectedPlan?._id) return;
    updateLimitsMutation.mutate({
      id: selectedPlan._id,
      limits: {
        chatbotLimit,
        receiptScannerLimit,
        voiceScannerLimit,
        gracePeriodDays,
        enableSplitBill: splitBillEnabled,
      }
    });
  };

  const handleEditPlanClick = (plan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name || '',
      price: plan.price !== undefined ? String(plan.price) : '',
      billingCycle: plan.billingCycle || 'monthly',
      durationDays: plan.durationDays !== undefined ? String(plan.durationDays) : '30',
      status: plan.status || 'active',
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      chatbotLimit: plan.limits?.chatbotLimit ?? 0,
      receiptScannerLimit: plan.limits?.receiptScannerLimit ?? 0,
      voiceScannerLimit: plan.limits?.voiceScannerLimit ?? 0,
      gracePeriodDays: plan.limits?.gracePeriodDays ?? 7,
      enableSplitBill: plan.limits?.enableSplitBill !== false,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveEditPlan = (e) => {
    e.preventDefault();
    if (!editingPlan?._id) return;
    const featuresArray = editForm.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: editForm.name.trim(),
      price: Number(editForm.price),
      currency: currency, // Saved strictly in Dashboard Settings currency
      billingCycle: editForm.billingCycle,
      durationDays: Number(editForm.durationDays),
      status: editForm.status,
      description: editForm.description.trim(),
      features: featuresArray,
      limits: {
        chatbotLimit: Number(editForm.chatbotLimit) || 0,
        receiptScannerLimit: Number(editForm.receiptScannerLimit) || 0,
        voiceScannerLimit: Number(editForm.voiceScannerLimit) || 0,
        gracePeriodDays: Number(editForm.gracePeriodDays) || 7,
        enableSplitBill: Boolean(editForm.enableSplitBill),
      },
    };

    console.log("[PlansView] Dashboard currency from useCurrency():", currency);
    console.log("[PlansView] Sending plan update payload with limits:", JSON.stringify({ price: payload.price, limits: payload.limits }));

    updatePlanMutation.mutate({ id: editingPlan._id, data: payload });
  };

  const handleCreateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setCreateForm((prev) => ({
      ...prev,
      [name]: finalValue,
      ...(name === 'name' && !prev._slugEdited
        ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }
        : {}),
    }));
  };

  const handleSlugChange = (e) => {
    setCreateForm((prev) => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      _slugEdited: true,
    }));
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    const featuresArray = createForm.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: createForm.name.trim(),
      slug: createForm.slug.trim(),
      description: createForm.description.trim(),
      price: Number(createForm.price),
      currency: currency, // Saved strictly in Dashboard Settings currency
      billingCycle: createForm.billingCycle,
      durationDays: Number(createForm.durationDays),
      icon: createForm.icon,
      status: createForm.status,
      features: featuresArray,
      limits: {
        chatbotLimit: Number(createForm.chatbotLimit) || 0,
        receiptScannerLimit: Number(createForm.receiptScannerLimit) || 0,
        voiceScannerLimit: Number(createForm.voiceScannerLimit) || 0,
        gracePeriodDays: Number(createForm.gracePeriodDays) || 7,
        enableSplitBill: Boolean(createForm.enableSplitBill),
      },
    };
    createPlanMutation.mutate(payload);
  };

  const chartData = React.useMemo(() => {
    return (summary?.pie || []).map(item => ({
      ...item,
      value: convertAmount(item.value, 'INR')
    }));
  }, [summary?.pie, convertAmount]);
  
  const isLoading = plansLoading || summaryLoading;

  if (plansError) {
    return (
      <div className="rounded-xl border border-dashed border-border p-16 text-center animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3.5 border border-rose-500/20">
          <ShieldAlert size={20} />
        </div>
        <h3 className="text-sm font-bold text-foreground">API Connection Error</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Could not retrieve administration stats. Verify your backend server is active and try again.
        </p>
        <button 
          onClick={() => refetchPlans()} 
          className="mt-4 h-9 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-md shadow-primary/10"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Active Subscription Plans</h1>
        <p className="text-sm text-muted-foreground">Manage service limits, pricing structure, and track revenue per tier.</p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = ICON_MAP[plan.icon] || Zap;
          const colorClass = COLOR_MAP[plan.slug] || 'text-slate-500 bg-slate-500/10';
          const frequencyLabel = plan.billingCycle === 'monthly' ? 'month' : (plan.billingCycle === 'yearly' ? 'year' : 'forever');
          const baseCurrency = plan.currency || plan.baseCurrency || 'INR';
          
          return (
            <div 
              key={plan._id || plan.slug} 
              className={`rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm flex flex-col justify-between hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">{plan.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                      INR (₹)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditPlanClick(plan)}
                      className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Edit Price & Details"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the pricing plan "${plan.name}"?`)) {
                          deletePlanMutation.mutate(plan._id);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                </div>
                
                {/* Pricing info */}
                <div className="mt-4 flex flex-col">
                  <div className="flex items-baseline text-foreground">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {formatAmount(plan.price || plan.basePrice || 0)}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">/{frequencyLabel}</span>
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    <span>Currency: INR (₹)</span>
                  </div>
                </div>
                
                <p className="mt-3.5 text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
                
                {/* Limits list */}
                <div className="mt-4 p-2.5 bg-muted/40 border border-border rounded-lg text-[10px] space-y-1">
                  <p className="font-bold text-foreground mb-1 text-[11px]">Plan Quota Limits:</p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Chatbot Queries:</span> <span className="font-bold text-foreground">{plan.limits?.chatbotLimit || 'No limit'}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Receipt Scans:</span> <span className="font-bold text-foreground">{plan.limits?.receiptScannerLimit || 'No limit'}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Voice Scanner:</span> <span className="font-bold text-foreground">{plan.limits?.voiceScannerLimit || 'No limit'}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Grace Days:</span> <span className="font-bold text-foreground">{plan.limits?.gracePeriodDays || 7} days</span></p>
                </div>

                {/* Feature List */}
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <span className="text-emerald-500 font-bold leading-none select-none mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button 
                  onClick={() => handleEditPlanClick(plan)}
                  className="flex-1 h-8 flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-150 border border-primary/20"
                >
                  <Pencil size={12} />
                  Edit Price
                </button>
                <button 
                  onClick={() => handleConfigureLimits(plan)}
                  className="flex-1 h-8 flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150"
                >
                  Limits
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Graph & Distribution Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Distribution Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="border-b border-border pb-4 mb-4">
            <h3 className="text-sm font-bold text-foreground">Monthly Recurring Income per Plan</h3>
            <p className="text-xs text-muted-foreground">Overview of monthly revenue contributions across active plans.</p>
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tickFormatter={(val) => `${symbol}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip 
                    formatter={(val) => [`${symbol}${Number(val).toLocaleString()}`, 'Monthly Income']}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-popover)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Plan Configuration Panel */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-border pb-4 mb-4">
              <h3 className="text-sm font-bold text-foreground">Plan Controls</h3>
              <p className="text-xs text-muted-foreground">Adjust currency settings, discount coupons, and payment terms.</p>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Dashboard Active Currency</span>
                <span className="font-bold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/20">
                  {currency === 'USD' ? 'USD ($)' : 'INR (₹)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Active Discount Codes</span>
                <span className="font-bold text-emerald-500">4 coupons</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Grace Period Threshold</span>
                <span className="font-semibold text-foreground">7 business days</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold text-muted-foreground">Default Payment Gateway</span>
                <span className="font-bold text-primary">Razorpay</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full h-9 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
            >
              Create New Plan Tier
            </button>
          </div>
        </div>
      </div>

      {/* Edit Plan & Price Dialog */}
      <Dialog
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title={`Edit Plan & Price - ${editingPlan?.name || ''}`}
        size="lg"
      >
        {editingPlan && (
          <form onSubmit={handleSaveEditPlan} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              {/* Plan Name */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="font-semibold text-muted-foreground">Plan Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Price with Static Dashboard Currency Notation Badge (Dropdown Removed) */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="font-semibold text-primary font-bold">
                  Plan Price ({currency === 'USD' ? 'USD $' : 'INR ₹'}) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-9 px-3 flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 text-primary text-xs font-extrabold select-none flex-shrink-0">
                    {currency === 'USD' ? 'USD ($)' : 'INR (₹)'}
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    min="0"
                    step="any"
                    placeholder={currency === 'USD' ? "e.g. 20" : "e.g. 1499"}
                    className="flex-1 h-9 px-3 rounded-lg border-2 border-primary bg-background text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Price is set in {currency === 'USD' ? 'US Dollars ($)' : 'Indian Rupees (₹)'} (Active Dashboard Settings). Mobile app users will see auto-conversion in their own phone currency.
                </span>
              </div>

              {/* Billing Cycle */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Billing Cycle</label>
                <select
                  name="billingCycle"
                  value={editForm.billingCycle}
                  onChange={handleEditFormChange}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              {/* Duration Days */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Duration (Days)</label>
                <input
                  type="number"
                  name="durationDays"
                  value={editForm.durationDays}
                  onChange={handleEditFormChange}
                  min="1"
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="font-semibold text-muted-foreground">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFormChange}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active (visible to mobile users)</option>
                  <option value="draft">Draft (hidden from users)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                rows={2}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Features */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Features (one per line)</label>
              <textarea
                name="features"
                value={editForm.features}
                onChange={handleEditFormChange}
                rows={4}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
              />
            </div>

            {/* Feature & Usage Limits Section */}
            <div className="border-t border-border pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    Feature & Usage Limits
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure feature quotas and allowances for subscribers of this plan. (0 = Unlimited)
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                  Usage Quotas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                {/* Chatbot Queries Limit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground text-[11px]">Chatbot Queries Limit</label>
                    <span className="text-[10px] text-muted-foreground font-mono">0 = Unlimited</span>
                  </div>
                  <input
                    type="number"
                    name="chatbotLimit"
                    value={editForm.chatbotLimit}
                    onChange={handleEditFormChange}
                    min="0"
                    placeholder="e.g. 50 (0 for unlimited)"
                    className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Receipt Scans Limit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground text-[11px]">Receipt Scans Limit</label>
                    <span className="text-[10px] text-muted-foreground font-mono">0 = Unlimited</span>
                  </div>
                  <input
                    type="number"
                    name="receiptScannerLimit"
                    value={editForm.receiptScannerLimit}
                    onChange={handleEditFormChange}
                    min="0"
                    placeholder="e.g. 30 (0 for unlimited)"
                    className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Voice Scanner Limit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground text-[11px]">Voice Scanner Limit</label>
                    <span className="text-[10px] text-muted-foreground font-mono">0 = Unlimited</span>
                  </div>
                  <input
                    type="number"
                    name="voiceScannerLimit"
                    value={editForm.voiceScannerLimit}
                    onChange={handleEditFormChange}
                    min="0"
                    placeholder="e.g. 20 (0 for unlimited)"
                    className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Grace Period (Days) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground text-[11px]">Grace Period (Days)</label>
                    <span className="text-[10px] text-muted-foreground">Renewal buffer</span>
                  </div>
                  <input
                    type="number"
                    name="gracePeriodDays"
                    value={editForm.gracePeriodDays}
                    onChange={handleEditFormChange}
                    min="0"
                    placeholder="e.g. 7"
                    className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Split Bill Switch */}
                <div className="col-span-1 sm:col-span-2 flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background mt-1">
                  <div>
                    <p className="font-semibold text-foreground text-xs">Enable Split Bill</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Allow users on this plan to create split bills in groups</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, enableSplitBill: !prev.enableSplitBill }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                      editForm.enableSplitBill ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        editForm.enableSplitBill ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatePlanMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition-colors disabled:opacity-50"
              >
                {updatePlanMutation.isPending ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Configure Limits Dialog */}
      <Dialog 
        isOpen={!!selectedPlan} 
        onClose={() => setSelectedPlan(null)}
        title={`Configure Limits - ${selectedPlan?.name || ''}`}
      >
        {selectedPlan && (
          <form onSubmit={handleSaveLimits} className="space-y-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Chatbot Queries Limit</label>
              <input
                type="number"
                value={chatbotLimit}
                onChange={(e) => setChatbotLimit(Number(e.target.value))}
                min="0"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Receipt Scans Limit</label>
              <input
                type="number"
                value={receiptScannerLimit}
                onChange={(e) => setReceiptScannerLimit(Number(e.target.value))}
                min="0"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Voice Scanner Limit</label>
              <input
                type="number"
                value={voiceScannerLimit}
                onChange={(e) => setVoiceScannerLimit(Number(e.target.value))}
                min="0"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Grace Period (Days)</label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                min="1"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="font-semibold text-foreground text-xs">Enable Split Bill</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Allow users on this plan to create split bills in groups</p>
              </div>
              <button
                type="button"
                onClick={() => setSplitBillEnabled(!splitBillEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  splitBillEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    splitBillEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-border pt-4 mt-2 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={updateLimitsMutation.isPending}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition-colors disabled:opacity-50"
              >
                Save Configuration
              </button>
            </div>
          </form>
        )}
      </Dialog>
      
      {/* Create Plan Dialog */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateForm(EMPTY_CREATE_FORM); }}
        title="Create New Plan Tier"
        size="lg"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {/* Plan Name */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="font-semibold text-muted-foreground">Plan Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="name"
                value={createForm.name}
                onChange={handleCreateFormChange}
                placeholder="e.g. Pro Plan"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="font-semibold text-muted-foreground">Slug (unique ID) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="slug"
                value={createForm.slug}
                onChange={handleSlugChange}
                placeholder="e.g. pro"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                required
              />
              <span className="text-[10px] text-muted-foreground">Lowercase, no spaces. Used to identify plan internally (e.g. "pro", "basic").</span>
            </div>

            {/* Price with Static Dashboard Currency Notation Badge (Dropdown Removed) */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="font-semibold text-primary font-bold">
                Price ({currency === 'USD' ? 'USD $' : 'INR ₹'}) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="h-9 px-3 flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 text-primary text-xs font-extrabold select-none flex-shrink-0">
                  {currency === 'USD' ? 'USD ($)' : 'INR (₹)'}
                </div>
                <input
                  type="number"
                  name="price"
                  value={createForm.price}
                  onChange={handleCreateFormChange}
                  placeholder={currency === 'USD' ? "e.g. 20" : "e.g. 1499"}
                  min="0"
                  step="any"
                  className="flex-1 h-9 px-3 rounded-lg border-2 border-primary bg-background text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Billing Cycle <span className="text-rose-500">*</span></label>
              <select
                name="billingCycle"
                value={createForm.billingCycle}
                onChange={handleCreateFormChange}
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>

            {/* Duration Days */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Duration (Days) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                name="durationDays"
                value={createForm.durationDays}
                onChange={handleCreateFormChange}
                min="1"
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* Icon */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Icon</label>
              <select
                name="icon"
                value={createForm.icon}
                onChange={handleCreateFormChange}
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="crown">Crown</option>
                <option value="zap">Zap</option>
                <option value="layers">Layers</option>
                <option value="server">Server</option>
                <option value="shield">Shield</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Initial Status</label>
              <select
                name="status"
                value={createForm.status}
                onChange={handleCreateFormChange}
                className="h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active (visible to mobile users)</option>
                <option value="draft">Draft (hidden from users)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-muted-foreground">Description</label>
            <textarea
              name="description"
              value={createForm.description}
              onChange={handleCreateFormChange}
              placeholder="Brief description shown to users on the pricing page..."
              rows={2}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Features */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-muted-foreground">Features (one per line)</label>
            <textarea
              name="features"
              value={createForm.features}
              onChange={handleCreateFormChange}
              placeholder={"Unlimited receipt scans\nAI chatbot access\nPriority support"}
              rows={4}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
            />
            <span className="text-[10px] text-muted-foreground">Each line becomes a feature bullet shown to mobile app users.</span>
          </div>

          {/* Feature & Usage Limits Section */}
          <div className="border-t border-border pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  Feature & Usage Limits
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Decide AI quotas and usage allowances for this new plan (0 = Unlimited).
                </p>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                Usage Quotas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
              {/* Chatbot Queries Limit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-[11px]">Chatbot Queries Limit</label>
                  <span className="text-[10px] text-muted-foreground font-mono">0 = Unlimited</span>
                </div>
                <input
                  type="number"
                  name="chatbotLimit"
                  value={createForm.chatbotLimit}
                  onChange={handleCreateFormChange}
                  min="0"
                  placeholder="e.g. 50 (0 for unlimited)"
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Receipt Scans Limit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-[11px]">Receipt Scans Limit</label>
                  <span className="text-[10px] text-muted-foreground font-mono">0 = Unlimited</span>
                </div>
                <input
                  type="number"
                  name="receiptScannerLimit"
                  value={createForm.receiptScannerLimit}
                  onChange={handleCreateFormChange}
                  min="0"
                  placeholder="e.g. 30 (0 for unlimited)"
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Voice Scanner Limit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-[11px]">Voice Scanner Limit</label>
                  <span className="text-[10px] text-muted-foreground font-mono">0 = Unlimited</span>
                </div>
                <input
                  type="number"
                  name="voiceScannerLimit"
                  value={createForm.voiceScannerLimit}
                  onChange={handleCreateFormChange}
                  min="0"
                  placeholder="e.g. 20 (0 for unlimited)"
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Grace Period (Days) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-[11px]">Grace Period (Days)</label>
                  <span className="text-[10px] text-muted-foreground">Renewal buffer</span>
                </div>
                <input
                  type="number"
                  name="gracePeriodDays"
                  value={createForm.gracePeriodDays}
                  onChange={handleCreateFormChange}
                  min="0"
                  placeholder="e.g. 7"
                  className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Split Bill Switch */}
              <div className="col-span-1 sm:col-span-2 flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background mt-1">
                <div>
                  <p className="font-semibold text-foreground text-xs">Enable Split Bill</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Allow users on this plan to create split bills in groups</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateForm((prev) => ({ ...prev, enableSplitBill: !prev.enableSplitBill }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                    createForm.enableSplitBill ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      createForm.enableSplitBill ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsCreateModalOpen(false); setCreateForm(EMPTY_CREATE_FORM); }}
              className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlanMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition-colors disabled:opacity-50"
            >
              {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
