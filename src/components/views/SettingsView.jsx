'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '@/store/adminSlice';
import { setCurrency } from '@/store/uiSlice';
import { useForm } from 'react-hook-form';
import { useCurrency } from '@/hooks/useCurrency';
import { authApi } from '@/services/auth.api';
import settingsApi from '@/services/settings.api';
import {
  Save,
  User,
  BellRing,
  Sparkles,
  Eye,
  EyeOff,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Settings as SettingsIcon,
  DollarSign,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Shield,
  Key,
  Globe,
  RefreshCw,
} from 'lucide-react';

export default function SettingsView() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.admin);
  
  const [activeTab, setActiveTab] = useState('ai');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [showRzpWebhookSecret, setShowRzpWebhookSecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testGatewayResult, setTestGatewayResult] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      // Profile
      name: profile?.name || '',
      email: profile?.email || '',
      role: profile?.role || '',
      avatar: profile?.avatar || '',
      // Settings
      geminiModel: 'gemini-flash-latest',
      geminiApiKey: '',
      aiReceiptScanner: true,
      voiceTransactionScanner: false,
      aiChatbotAdvisor: true,
      maintenanceMode: false,
      autoBackup: true,
      emailNotifications: true,
      smsNotifications: false,
      currency: 'INR',
      // Payment Gateway
      paymentGateway: {
        provider: 'razorpay',
        environment: 'test',
        razorpay: {
          enabled: true,
          keyId: '',
          keySecret: '',
          webhookSecret: '',
        },
        stripe: {
          enabled: false,
          publishableKey: '',
          secretKey: '',
          webhookSecret: '',
        },
      },
    }
  });

  const selectedModel = watch('geminiModel');
  const aiReceiptScanner = watch('aiReceiptScanner');
  const voiceTransactionScanner = watch('voiceTransactionScanner');
  const aiChatbotAdvisor = watch('aiChatbotAdvisor');
  const selectedCurrency = watch('currency');

  // Watched payment fields
  const paymentProvider = watch('paymentGateway.provider');
  const paymentEnvironment = watch('paymentGateway.environment');
  const rzpEnabled = watch('paymentGateway.razorpay.enabled');
  const stripeEnabled = watch('paymentGateway.stripe.enabled');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (['ai', 'payment', 'profile', 'system', 'notifications'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const systemSettings = await settingsApi.getSettings();
        
        reset({
          name: profile?.name || '',
          email: profile?.email || '',
          role: profile?.role || '',
          avatar: profile?.avatar || '',
          geminiModel: systemSettings?.geminiModel || 'gemini-flash-latest',
          geminiApiKey: systemSettings?.geminiApiKey || '',
          aiReceiptScanner: systemSettings?.aiReceiptScanner ?? true,
          voiceTransactionScanner: systemSettings?.voiceTransactionScanner ?? false,
          aiChatbotAdvisor: systemSettings?.aiChatbotAdvisor ?? true,
          maintenanceMode: systemSettings?.maintenanceMode ?? false,
          autoBackup: systemSettings?.autoBackup ?? true,
          emailNotifications: systemSettings?.emailNotifications ?? true,
          smsNotifications: systemSettings?.smsNotifications ?? false,
          currency: systemSettings?.currency || 'INR',
          paymentGateway: {
            provider: systemSettings?.paymentGateway?.provider || 'razorpay',
            environment: systemSettings?.paymentGateway?.environment || 'test',
            razorpay: {
              enabled: systemSettings?.paymentGateway?.razorpay?.enabled ?? true,
              keyId: systemSettings?.paymentGateway?.razorpay?.keyId || '',
              keySecret: systemSettings?.paymentGateway?.razorpay?.keySecret || '',
              webhookSecret: systemSettings?.paymentGateway?.razorpay?.webhookSecret || '',
            },
            stripe: {
              enabled: systemSettings?.paymentGateway?.stripe?.enabled ?? false,
              publishableKey: systemSettings?.paymentGateway?.stripe?.publishableKey || '',
              secretKey: systemSettings?.paymentGateway?.stripe?.secretKey || '',
              webhookSecret: systemSettings?.paymentGateway?.stripe?.webhookSecret || '',
            },
          },
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [profile, reset]);

  const handleTestConnection = async () => {
    try {
      setIsTestingGateway(true);
      setTestGatewayResult(null);
      const gatewayData = watch('paymentGateway');
      const res = await settingsApi.testPaymentGateway({
        provider: gatewayData?.provider || 'razorpay',
        keyId: gatewayData?.razorpay?.keyId,
        keySecret: gatewayData?.razorpay?.keySecret,
      });
      setTestGatewayResult({
        success: res.success,
        message: res.message || 'Payment gateway connection verified successfully!',
      });
    } catch (err) {
      setTestGatewayResult({
        success: false,
        message: err?.response?.data?.message || err.message || 'Payment gateway connection failed.',
      });
    } finally {
      setIsTestingGateway(false);
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/payment/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const onSubmit = async (data) => {
    try {
      // Save profile ONLY if name is provided to avoid Mongoose fullName validation error
      if (data.name && data.name.trim()) {
        try {
          await authApi.updateProfile({
            fullName: data.name.trim(),
            email: data.email
          });
          dispatch(updateProfile({
            name: data.name.trim(),
            email: data.email,
            role: data.role,
            avatar: data.avatar
          }));
        } catch (profileErr) {
          console.warn('Profile update warning:', profileErr?.message);
        }
      }
      
      // Save system settings
      await settingsApi.updateSettings({
        geminiModel: data.geminiModel,
        geminiApiKey: data.geminiApiKey,
        aiReceiptScanner: data.aiReceiptScanner,
        voiceTransactionScanner: data.voiceTransactionScanner,
        aiChatbotAdvisor: data.aiChatbotAdvisor,
        maintenanceMode: data.maintenanceMode,
        autoBackup: data.autoBackup,
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        currency: data.currency,
        paymentGateway: data.paymentGateway,
      });

      // Update Dashboard Redux UI Currency State
      dispatch(setCurrency(data.currency));

      alert('Settings & Payment Configuration saved successfully!');
    } catch (error) {
      alert(error?.response?.data?.message || error.message || 'Failed to save settings.');
    }
  };

  const tabs = [
    { id: 'ai', label: 'AI Engine & Models', icon: Cpu },
    { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
    { id: 'profile', label: 'Super Admin Profile', icon: User },
    { id: 'system', label: 'System & Security', icon: ShieldCheck },
    { id: 'notifications', label: 'Alert Notifications', icon: BellRing },
  ];

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="text-primary" />
          Settings & Configuration
        </h1>
        <p className="text-sm text-muted-foreground">Manage your AI models, system preferences, and dashboard display currency.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-muted/40 p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center whitespace-nowrap gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-primary' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Tab Content: AI Engine */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
              
              <div className="space-y-4 border-b border-border pb-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Gemini Model Switcher
                  </label>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <CheckCircle2 size={12} /> Active: {selectedModel}
                  </span>
                </div>
                <select
                  {...register('geminiModel')}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash — Recommended (High Speed & Vision OCR)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite — Ultra Lightweight & High Speed</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro — Advanced Reasoning & Logic</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash — Multimodal Fast Processing</option>
                  <option value="gemini-flash-latest">gemini-flash-latest — Default Alias</option>
                </select>
              </div>

              <div className="space-y-4 border-b border-border pb-6">
                <div>
                  <label className="text-sm font-bold text-foreground">Custom Gemini API Key</label>
                  <p className="text-xs text-muted-foreground mt-1">Leave blank to use the default environment API key set in server .env</p>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    {...register('geminiApiKey')}
                    placeholder="AIzaSy..."
                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-sm font-bold text-foreground">AI Feature Toggles</h3>
                
                {/* Toggle 1 */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      AI Receipt Scanner
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${aiReceiptScanner ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {aiReceiptScanner ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Enable or disable receipt OCR parsing for camera & gallery uploads.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('aiReceiptScanner')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Voice Transaction Scanner
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${voiceTransactionScanner ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {voiceTransactionScanner ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Enable or disable voice speech-to-text transaction parsing.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('voiceTransactionScanner')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Toggle 3 */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      AI Chatbot Advisor
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${aiChatbotAdvisor ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {aiChatbotAdvisor ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Enable or disable interactive AI financial assistant.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('aiChatbotAdvisor')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Payment Gateway */}
        {activeTab === 'payment' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            
            {/* Top Gateway Environment & Status Banner */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="text-primary" size={20} />
                    Payment Gateway Engine
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage API credentials, test/live environments, and webhook secrets. All changes apply in real-time.
                  </p>
                </div>
                
                {/* Active Environment Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Mode:</span>
                  {paymentEnvironment === 'live' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      LIVE PRODUCTION
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      TEST (SANDBOX)
                    </span>
                  )}
                </div>
              </div>

              {/* Environment Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentEnvironment === 'test' 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border bg-background hover:bg-muted/30'
                }`}>
                  <input
                    type="radio"
                    value="test"
                    {...register('paymentGateway.environment')}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      Test Mode (Sandbox)
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">Safe for Testing</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use Razorpay test keys (<code className="text-xs bg-muted px-1 py-0.5 rounded">rzp_test_...</code>). No real bank charges.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentEnvironment === 'live' 
                    ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500' 
                    : 'border-border bg-background hover:bg-muted/30'
                }`}>
                  <input
                    type="radio"
                    value="live"
                    {...register('paymentGateway.environment')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      Live Mode (Production)
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Real Payments</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use Razorpay live keys (<code className="text-xs bg-muted px-1 py-0.5 rounded">rzp_live_...</code>). Real user bank payments will be collected.
                    </p>
                  </div>
                </label>
              </div>

              {/* Primary Payment Provider Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Default Payment Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('paymentGateway.provider', 'razorpay', { shouldDirty: true })}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      paymentProvider === 'razorpay'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/20'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        Razorpay
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">Primary</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">UPI, Debit/Credit Cards, Net Banking, Wallets (INR)</p>
                    </div>
                    {paymentProvider === 'razorpay' && <CheckCircle2 size={18} className="text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue('paymentGateway.provider', 'stripe', { shouldDirty: true })}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      paymentProvider === 'stripe'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/20'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        Stripe
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">International</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Global Credit/Debit Cards, USD / EUR multi-currency</p>
                    </div>
                    {paymentProvider === 'stripe' && <CheckCircle2 size={18} className="text-primary" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Razorpay Configuration Details Card */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm">
                    RZP
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Razorpay API Credentials</h4>
                    <p className="text-xs text-muted-foreground">Obtain these from your Razorpay Dashboard &gt; Settings &gt; API Keys.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('paymentGateway.razorpay.enabled')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Razorpay Key ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Key size={13} className="text-primary" />
                      Razorpay Key ID
                    </label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {paymentEnvironment === 'live' ? 'rzp_live_...' : 'rzp_test_...'}
                    </span>
                  </div>
                  <input
                    type="text"
                    {...register('paymentGateway.razorpay.keyId')}
                    placeholder={paymentEnvironment === 'live' ? "rzp_live_abcdef123456" : "rzp_test_abcdef123456"}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground">Public Key ID passed to mobile app & checkout</p>
                </div>

                {/* Razorpay Key Secret */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Shield size={13} className="text-primary" />
                    Razorpay Key Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showRzpSecret ? "text" : "password"}
                      {...register('paymentGateway.razorpay.keySecret')}
                      placeholder="••••••••••••••••••••••••••••••"
                      className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRzpSecret(!showRzpSecret)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      title={showRzpSecret ? "Hide Key Secret" : "Show Key Secret"}
                    >
                      {showRzpSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Private server secret used to create orders and verify payment signatures</p>
                </div>

                {/* Razorpay Webhook Secret */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-primary" />
                    Razorpay Webhook Secret (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showRzpWebhookSecret ? "text" : "password"}
                      {...register('paymentGateway.razorpay.webhookSecret')}
                      placeholder="webhook_secret_..."
                      className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRzpWebhookSecret(!showRzpWebhookSecret)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      title={showRzpWebhookSecret ? "Hide Webhook Secret" : "Show Webhook Secret"}
                    >
                      {showRzpWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Used to verify asynchronous webhook event notifications from Razorpay</p>
                </div>

                {/* Webhook Endpoint URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Globe size={13} className="text-primary" />
                    Webhook Endpoint URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/payment/webhook`}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-xs font-mono text-muted-foreground cursor-not-allowed select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="h-10 px-3 border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedWebhook ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedWebhook ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Add this URL in Razorpay Dashboard &gt; Webhooks with event <code className="text-[11px] bg-muted px-1 py-0.5 rounded">payment.captured</code></p>
                </div>

              </div>

              {/* Real-time Connection Test Action */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Verify these credentials directly against the Razorpay API before saving.
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingGateway}
                  className="h-9 px-4 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTestingGateway ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Test Razorpay Connection
                    </>
                  )}
                </button>
              </div>

              {/* Connection Test Feedback Result */}
              {testGatewayResult && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
                  testGatewayResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {testGatewayResult.success ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="shrink-0 text-rose-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {testGatewayResult.success ? 'Gateway Verified' : 'Connection Error'}
                    </p>
                    <p className="mt-0.5 leading-relaxed">{testGatewayResult.message}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Stripe Configuration Card (Collapsible/Optional) */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-sm">
                    STR
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Stripe Gateway (International)</h4>
                    <p className="text-xs text-muted-foreground">Optional gateway for overseas clients paying with non-INR cards.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('paymentGateway.stripe.enabled')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Stripe Publishable Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Key size={13} className="text-primary" />
                    Publishable Key
                  </label>
                  <input
                    type="text"
                    {...register('paymentGateway.stripe.publishableKey')}
                    placeholder="pk_test_..."
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                {/* Stripe Secret Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Shield size={13} className="text-primary" />
                    Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showStripeSecret ? "text" : "password"}
                      {...register('paymentGateway.stripe.secretKey')}
                      placeholder="sk_test_..."
                      className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      title={showStripeSecret ? "Hide Secret Key" : "Show Secret Key"}
                    >
                      {showStripeSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Hot-reload notice banner */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
              <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Zero Downtime Dynamic Configuration:</span> Key updates take effect immediately on all subsequent order generation and signature verification operations. Mobile and web checkouts will receive the updated Key ID on the next checkout request.
              </p>
            </div>

          </div>
        )}

        {/* Tab Content: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="rounded-xl border border-border bg-card shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Super Admin"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@expense.ai"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">System Role</label>
                <input
                  type="text"
                  {...register('role')}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Avatar Initials (2 Chars)</label>
                <input
                  type="text"
                  maxLength={2}
                  {...register('avatar')}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: System & Security */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
             <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground">Maintenance Mode</h4>
                    <p className="text-xs text-muted-foreground mt-1">Restrict client app edits.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('maintenanceMode')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground">Auto Database Backup</h4>
                    <p className="text-xs text-muted-foreground mt-1">Snapshot every 24h.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('autoBackup')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Dashboard Display Currency (Fixed to INR) */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign size={16} className="text-primary" />
                      Dashboard System Currency
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The Admin Dashboard operates exclusively in INR (₹). All revenue, plans, reports, and payments are managed in INR.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                    INR (₹) — Indian Rupee
                  </span>
                </div>

             </div>
          </div>
        )}

        {/* Tab Content: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
             <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground">Email Notifications</h4>
                    <p className="text-xs text-muted-foreground mt-1">Weekly billing reports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('emailNotifications')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-foreground">SMS Urgent Toggles</h4>
                    <p className="text-xs text-muted-foreground mt-1">Payment warnings.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" {...register('smsNotifications')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

             </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
