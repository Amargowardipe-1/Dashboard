'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '@/store/adminSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/auth.api';
import Dialog from '../ui/Dialog';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Laptop,
  Smartphone,
  Globe,
  Activity,
  FileText,
  Award,
  Coins,
  BadgeCheck,
  XCircle,
  Radio,
  History,
} from 'lucide-react';

// Helper to parse userAgent string into friendly device and browser names
function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown Browser', os: 'Unknown OS', isMobile: false, label: 'Unknown Device' };

  let browser = 'Web Browser';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/postman/i.test(ua)) browser = 'Postman API Client';

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  return {
    browser,
    os,
    isMobile,
    label: `${browser} on ${os}`,
  };
}

export default function ProfileView() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { profile: reduxProfile } = useSelector((state) => state.admin);

  // General feedback messages
  const [copiedId, setCopiedId] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Section 1: Profile Information editable states
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [currency, setCurrency] = useState('INR');

  // Section 3: Security (Password change) states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Section 6: Danger Zone confirmation modal
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);

  // Fetch admin profile from backend
  const {
    data: dbUser,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['adminProfileDetails'],
    queryFn: async () => {
      const res = await authApi.getProfile();
      return res?.data || res;
    },
    staleTime: 60000,
  });

  // Fetch active sessions from backend
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    isFetching: isSessionsFetching,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['adminSessions'],
    queryFn: async () => {
      const res = await authApi.getSessions();
      return res?.data || [];
    },
    staleTime: 30000,
  });

  const activeSessions = useMemo(() => {
    return Array.isArray(sessionsData) ? sessionsData : [];
  }, [sessionsData]);

  // Fetch real audit logs from backend
  const {
    data: auditLogsData,
    isLoading: isAuditLoading,
    isFetching: isAuditFetching,
    refetch: refetchAuditLogs,
  } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await authApi.getAuditLogs(30);
      return res?.data || [];
    },
    staleTime: 30000,
  });

  const auditLogs = useMemo(() => {
    return Array.isArray(auditLogsData) ? auditLogsData : [];
  }, [auditLogsData]);

  // Populate form fields when profile data is received
  useEffect(() => {
    if (dbUser) {
      setFullName(dbUser.fullName || reduxProfile?.name || '');
      setMobile(dbUser.mobile || '');
      setCurrency(dbUser.currency || 'INR');
    }
  }, [dbUser, reduxProfile]);

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await authApi.updateProfile(payload);
      return res?.data || res;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries(['adminProfileDetails']);
      queryClient.invalidateQueries(['adminProfile']);

      const nameToSave = updatedData?.fullName || fullName;
      dispatch(
        updateProfile({
          name: nameToSave,
          email: dbUser?.email || reduxProfile?.email,
          role: dbUser?.role === 'super_admin' ? 'Super Administrator' : 'Administrator',
          avatar: nameToSave
            ? nameToSave
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
            : 'A',
        })
      );

      setSuccessMessage('Profile information updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update profile.');
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 4000);
    },
  });

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: async ({ currentPass, newPass }) => {
      return await authApi.changePassword(currentPass, newPass);
    },
    onSuccess: (res) => {
      setPasswordSuccess(res?.message || 'Password updated successfully!');
      setPasswordError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    },
    onError: (err) => {
      setPasswordError(err?.response?.data?.message || err?.message || 'Failed to change password.');
      setPasswordSuccess('');
      setTimeout(() => setPasswordError(''), 5000);
    },
  });

  // Logout All Sessions Mutation
  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      return await authApi.logoutAllSessions();
    },
    onSuccess: () => {
      window.location.href = '/login';
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message || 'Failed to revoke all sessions.');
      setIsLogoutAllModalOpen(false);
    },
  });

  // Form submit: Update Profile
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
    });
  };

  // Form submit: Change Password
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    passwordMutation.mutate({
      currentPass: currentPassword,
      newPass: newPassword,
    });
  };

  // Copy User ID
  const copyUserId = () => {
    const id = dbUser?._id || dbUser?.id;
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Sign out current device
  const handleLogoutCurrent = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    window.location.href = '/login';
  };

  // Derived user details
  const displayName = dbUser?.fullName || reduxProfile?.name || 'Administrator';
  const displayEmail = dbUser?.email || reduxProfile?.email || 'admin@expenseai.co';
  const isSuperAdmin = dbUser?.role === 'super_admin';
  const displayRole = isSuperAdmin ? 'Super Administrator' : 'Administrator';
  const accountStatus = dbUser?.accountStatus || 'active';
  const isAccountActive = accountStatus === 'active';
  const isVerified = dbUser?.isVerified ?? true;
  const avatarUrl = dbUser?.avatar?.url || null;

  const userInitials =
    displayName
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

  const lastLoginTime = dbUser?.lastVisitedAt
    ? new Date(dbUser.lastVisitedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Current Session Active';

  if (isProfileLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading administrator profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
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
            Production administrative identity, security credentials, active sessions, and access controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchProfile();
              refetchSessions();
              refetchAuditLogs();
            }}
            disabled={isProfileFetching || isSessionsFetching || isAuditFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-all shadow-sm cursor-pointer disabled:opacity-60"
            title="Refresh profile details, sessions, and audit logs"
          >
            <RefreshCw
              size={14}
              className={isProfileFetching || isSessionsFetching || isAuditFetching ? 'animate-spin text-primary' : 'text-muted-foreground'}
            />
            <span>{isProfileFetching || isSessionsFetching || isAuditFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1 & 2: HERO PROFILE & ACCOUNT OVERVIEW
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-card/60 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with fallback to initials */}
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-2xl object-cover shadow-lg border-2 border-primary/30"
                />
              ) : (
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 text-primary-foreground flex items-center justify-center text-2xl md:text-3xl font-black shadow-lg shadow-primary/25 border-2 border-primary/30">
                  {userInitials}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${
                  isAccountActive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={`Status: ${isAccountActive ? 'Active' : 'Inactive'}`}
              />
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25 shadow-sm">
                  <Award size={13} />
                  {displayRole}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isAccountActive
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isAccountActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isAccountActive ? 'Account Active' : 'Account Suspended'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isVerified
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <CheckCircle2 size={11} /> {isVerified ? 'Verified Email' : 'Unverified'}
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
                  <span>Last Login: <strong className="text-foreground font-semibold">{lastLoginTime}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* User ID Copy Box */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Admin ID</span>
            <button
              onClick={copyUserId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer group"
              title="Click to copy Admin ID"
            >
              <span className="max-w-[150px] truncate">{dbUser?._id || dbUser?.id || 'N/A'}</span>
              {copiedId ? (
                <Check size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <Copy size={14} className="text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: ACCOUNT INFORMATION METRICS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Role</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-foreground">{displayRole}</div>
            <p className="text-xs text-muted-foreground">
              {isSuperAdmin ? 'Full Root Privileges' : 'Standard Admin Authority'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isAccountActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              <Activity size={16} />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-foreground capitalize">{accountStatus}</div>
            <p className="text-xs text-muted-foreground">
              {isAccountActive ? 'Platform access operational' : 'Restricted account state'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Created Date</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-foreground">{memberSince}</div>
            <p className="text-xs text-muted-foreground">Account registration timestamp</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Last Login / Active</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-foreground truncate" title={lastLoginTime}>
              {lastLoginTime}
            </div>
            <p className="text-xs text-muted-foreground">Recent authentication recorded</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1 (FORM) & SECTION 3 (SECURITY: CHANGE PASSWORD)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1 Form: Personal & Profile Information */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <User size={18} className="text-primary" />
              1. Profile Information
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edit supported profile attributes. Email is protected and tied to master credentials.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail size={13} />
                  Email Address
                </label>
                <span className="text-[11px] font-semibold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-md">
                  Read Only
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
              <p className="text-[11px] text-muted-foreground">
                Email verification status: <strong className={isVerified ? 'text-emerald-500' : 'text-amber-500'}>{isVerified ? 'Verified' : 'Unverified'}</strong>
              </p>
            </div>

            {/* Mobile & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone size={13} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
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
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center justify-end border-t border-border">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Security & Change Password Form */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              3. Security & Change Password
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your administrative login password. Password must be at least 6 characters.
            </p>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-semibold animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock size={13} />
                Current Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <KeyRound size={13} />
                New Password (Min 6 characters) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Confirm New Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex items-center justify-end border-t border-border">
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-primary/40 hover:bg-primary/10 text-primary font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer"
              >
                {passwordMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: RECENT ACTIVITY (REAL AUDIT LOG STATE)
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <History size={18} className="text-primary" />
                4. Recent Activity & Audit Log
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {auditLogs.length} {auditLogs.length === 1 ? 'Event' : 'Events'} Logged
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live database audit trails of administrative logins, credential changes, and system operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchAuditLogs()}
              disabled={isAuditFetching}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-all cursor-pointer shrink-0"
            >
              <RefreshCw size={13} className={isAuditFetching ? 'animate-spin text-primary' : ''} />
              <span>Refresh Logs</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary text-[11px] font-semibold text-muted-foreground border border-border">
              <Radio size={12} className="text-emerald-500 animate-pulse" />
              <span>Audit Engine: Live</span>
            </div>
          </div>
        </div>

        {isAuditLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <FileText size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">No Recent Admin Logs Recorded</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Administrative actions and security occurrences are tracked in real-time. Entries will populate here as actions take place.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => {
              let IconComponent = Shield;
              let badgeColor = 'bg-primary/10 text-primary border-primary/20';

              if (log.category === 'auth') {
                IconComponent = KeyRound;
                badgeColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
              } else if (log.category === 'security') {
                IconComponent = Lock;
                badgeColor = 'bg-purple-500/10 text-purple-500 border-purple-500/20';
              } else if (log.category === 'settings') {
                IconComponent = User;
                badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
              } else if (log.category === 'user') {
                IconComponent = User;
                badgeColor = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
              } else if (log.category === 'system') {
                IconComponent = ShieldCheck;
                badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
              }

              const { label: deviceLabel } = parseUserAgent(log.userAgent);
              const formattedDate = log.createdAt
                ? new Date(log.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <div
                  key={log._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background/80 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0 text-foreground">
                      <IconComponent size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{log.description}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{log.adminName || 'Admin'}</span>
                        <span>•</span>
                        {log.userAgent ? (
                          <>
                            <span>{deviceLabel}</span>
                            <span>•</span>
                          </>
                        ) : null}
                        {log.ipAddress ? (
                          <>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{log.ipAddress}</span>
                            <span>•</span>
                          </>
                        ) : null}
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      log.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      <CheckCircle2 size={10} />
                      {log.status === 'success' ? 'Recorded' : log.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: ACTIVE SESSIONS & LOGIN SECURITY
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Laptop size={18} className="text-primary" />
                5. Active Sessions & Device Security
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {activeSessions.length} Active {activeSessions.length === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time refresh tokens stored in backend database. Devices authorized to access this account.
            </p>
          </div>

          <button
            onClick={() => refetchSessions()}
            disabled={isSessionsFetching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-all cursor-pointer shrink-0"
          >
            <RefreshCw size={13} className={isSessionsFetching ? 'animate-spin text-primary' : ''} />
            <span>Check Active Sessions</span>
          </button>
        </div>

        {isSessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No active multi-device sessions found. Your current session is authenticated via HttpOnly cookie.
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session, index) => {
              const { browser, os, isMobile, label } = parseUserAgent(session.userAgent);
              const isFirst = index === 0;
              const signedInDate = session.createdAt
                ? new Date(session.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Active';
              const expiresDate = session.expiresAt
                ? new Date(session.expiresAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Standard TTL';

              return (
                <div
                  key={session._id || index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background/50 hover:bg-background/80 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {isMobile ? <Smartphone size={18} /> : <Laptop size={18} />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        {isFirst && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Signed in: <strong className="text-foreground/80 font-medium">{signedInDate}</strong></span>
                        <span>•</span>
                        <span>Valid until: <strong className="text-foreground/80 font-medium">{expiresDate}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[11px] font-mono text-muted-foreground/70 bg-muted px-2 py-1 rounded-md">
                      ID: {String(session._id).slice(-8)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: DANGER ZONE
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-destructive/20 pb-4">
          <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
            <AlertTriangle size={18} />
            6. Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actions here terminate your administrative privileges and active token authorizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Action 1: Sign out current account */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card/60 gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <LogOut size={15} className="text-muted-foreground" />
                Sign Out Current Session
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Log out of your administrative account on this device and clear session cookies.
              </p>
            </div>
            <button
              onClick={handleLogoutCurrent}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out This Device</span>
            </button>
          </div>

          {/* Action 2: Revoke all sessions everywhere */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/10 gap-4">
            <div>
              <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
                <ShieldAlert size={15} />
                Sign Out All Devices (Revoke All Sessions)
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Revoke all active refresh tokens in the backend database. Forces logout across all browsers and devices immediately.
              </p>
            </div>
            <button
              onClick={() => setIsLogoutAllModalOpen(true)}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold text-xs shadow-md shadow-destructive/20 transition-all cursor-pointer"
            >
              <ShieldAlert size={14} />
              <span>Sign Out All Devices</span>
            </button>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL: LOGOUT ALL SESSIONS
         ───────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={isLogoutAllModalOpen}
        onClose={() => setIsLogoutAllModalOpen(false)}
        title="Revoke All Active Sessions?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Warning: Master Invalidation</strong>
              This action will delete all active refresh tokens for your user ID in the backend database. You and any active sessions on other devices will be signed out immediately.
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Are you sure you wish to terminate all active sessions? You will need to log back in.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsLogoutAllModalOpen(false)}
              disabled={logoutAllMutation.isPending}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => logoutAllMutation.mutate()}
              disabled={logoutAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold shadow-md shadow-destructive/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {logoutAllMutation.isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
                  <span>Revoking...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  <span>Yes, Terminate All Sessions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
