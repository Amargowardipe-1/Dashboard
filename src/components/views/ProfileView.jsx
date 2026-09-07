'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '@/store/adminSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/auth.api';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  KeyRound,
  Calendar,
  Clock,
  CheckCircle2,
  Save,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Layers,
  Coins,
  CreditCard,
  Lock,
  Zap,
  Activity,
  Award
} from 'lucide-react';

export default function ProfileView() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { profile: reduxProfile } = useSelector((state) => state.admin);

  const [copiedId, setCopiedId] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [upiId, setUpiId] = useState('');

  // Fetch admin profile from backend
  const { 
    data: dbUser, 
    isLoading, 
    isFetching,
    refetch 
  } = useQuery({
    queryKey: ['adminProfileDetails'],
    queryFn: async () => {
      const res = await authApi.getProfile();
      return res?.data || res;
    },
    staleTime: 60000,
  });

  // Populate form fields when profile data is available
  useEffect(() => {
    if (dbUser) {
      setFullName(dbUser.fullName || reduxProfile?.name || '');
      setMobile(dbUser.mobile || '');
      setCurrency(dbUser.currency || 'INR');
      setUpiId(dbUser.upiId || '');
    }
  }, [dbUser, reduxProfile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await authApi.updateProfile(payload);
      return res?.data || res;
    },
    onSuccess: (updatedData) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries(['adminProfileDetails']);
      queryClient.invalidateQueries(['adminProfile']);

      const nameToSave = updatedData?.fullName || fullName;
      dispatch(updateProfile({
        name: nameToSave,
        email: dbUser?.email || reduxProfile?.email,
        role: (dbUser?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'),
        avatar: nameToSave ? nameToSave.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'
      }));

      setSuccessMessage('Profile updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update profile.');
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    updateMutation.mutate({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      currency,
      upiId: upiId.trim()
    });
  };

  const copyUserId = () => {
    if (dbUser?._id || dbUser?.id) {
      navigator.clipboard.writeText(dbUser._id || dbUser.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const displayName = dbUser?.fullName || reduxProfile?.name || 'Administrator';
  const displayEmail = dbUser?.email || reduxProfile?.email || 'admin@expenseai.co';
  const displayRole = (dbUser?.role === 'super_admin' ? 'Super Administrator' : 'Administrator');
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active';

  const lastActiveTime = dbUser?.lastVisitedAt
    ? new Date(dbUser.lastVisitedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Online now';

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading administrator profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <ShieldCheck size={16} />
            <span>Executive Administration</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal admin credentials, security settings, and platform privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-all shadow-sm"
            title="Refresh profile details"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-primary' : 'text-muted-foreground'} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Notification Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <Shield size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-card/60 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar Badge */}
            <div className="relative group shrink-0">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 text-primary-foreground flex items-center justify-center text-2xl md:text-3xl font-black shadow-lg shadow-primary/25 border-2 border-primary/30">
                {userInitials}
              </div>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background" title="Status: Active" />
            </div>

            {/* User Core Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25 shadow-sm">
                  <Award size={13} />
                  {displayRole}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 size={11} /> Verified Account
                </span>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground/70" />
                <span>{displayEmail}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/80 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary/70" />
                  <span>Member Since: <strong className="text-foreground font-semibold">{memberSince}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-primary/70" />
                  <span>Last Active: <strong className="text-foreground font-semibold">{lastActiveTime}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* User ID copy box */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Admin Account ID</span>
            <button
              onClick={copyUserId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-all group"
              title="Click to copy User ID"
            >
              <span className="max-w-[140px] truncate">{dbUser?._id || dbUser?.id || 'N/A'}</span>
              {copiedId ? (
                <Check size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <Copy size={14} className="text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats / Security Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Access Level</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">Tier-1 Root Admin</div>
            <p className="text-xs text-muted-foreground">Full CRUD & System Authority</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Session Security</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Lock size={16} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">HttpOnly Cookies</div>
            <p className="text-xs text-muted-foreground">Auto-Rotated Secure Tokens</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">System State</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Zap size={16} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">Active & Healthy</div>
            <p className="text-xs text-muted-foreground">Live AI & Database Sync</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Currency Setup</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Coins size={16} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{currency} Active</div>
            <p className="text-xs text-muted-foreground">Multi-currency exchange live</p>
          </div>
        </div>
      </div>

      {/* Two-Column Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Editable Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User size={18} className="text-primary" />
                Personal & Contact Information
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your administrative display name, contact phone, and financial identifiers.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User size={13} />
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amar G."
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail size={13} />
                    Registered Email Address
                  </label>
                  <span className="text-[11px] font-semibold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-md">
                    Primary Identity
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={displayEmail}
                    disabled
                    className="w-full h-11 px-3.5 rounded-xl border border-border/60 bg-muted/40 text-sm font-medium text-muted-foreground cursor-not-allowed select-none"
                  />
                  <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Email is tied to your master administrative authentication.</p>
              </div>

              {/* Mobile Phone & Currency Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone size={13} />
                    Contact Mobile
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Preferred Currency */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Coins size={13} />
                    Preferred Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="AED">AED (د.إ) - UAE Dirham</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                  </select>
                </div>
              </div>

              {/* UPI ID / Payment Handle */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard size={13} />
                  Admin UPI ID / Settlement Handle
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. admin@upi or payment-settle@okhdfcbank"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-[11px] text-muted-foreground">Used for admin settlement verification and quick test transactions.</p>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Privileges & Security Summary */}
        <div className="space-y-6">
          
          {/* Admin Privileges Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-base border-b border-border pb-3">
              <Shield className="text-primary" size={18} />
              <h4>Admin Role & Capabilities</h4>
            </div>

            <p className="text-xs text-muted-foreground">
              Your account has full root permissions across the ExpenseAI platform:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-foreground">User Management</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Ban, unban, delete, and inspect registered users and accounts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={14} />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-foreground">Plans & Coupons</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Create and modify subscription tiers, promo codes, and pricing rules.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-foreground">AI Engine & Gemini OCR</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Switch Gemini models, configure AI advisors, and manage API keys.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity size={14} />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-foreground">Financial Auditing</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Access raw payment verification logs and transaction histories.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access Box */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-base border-b border-border pb-3">
              <KeyRound className="text-primary" size={18} />
              <h4>Authentication & Security</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Session Protocol</span>
                <span className="font-semibold text-foreground">HttpOnly Cookie</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Token Rotation</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Enabled
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Account Role</span>
                <span className="font-semibold text-primary">{displayRole}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Password Status</span>
                <span className="font-semibold text-foreground">Secure (Bcrypt 10)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground font-semibold">Security Tip:</strong> To rotate passwords or update master credentials, utilize the authentication gateway or update via root admin scripts.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
