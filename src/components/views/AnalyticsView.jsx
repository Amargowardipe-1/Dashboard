'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/analytics.api';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartSkeleton } from '../ui/Skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, Users, ArrowUpRight, Clock, ShieldAlert, Calendar, CalendarDays, RefreshCcw, Filter } from 'lucide-react';

export default function AnalyticsView() {
  const { symbol, formatAmount } = useCurrency();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter states
  const [filterMode, setFilterMode] = useState('this_month'); // 'this_month' | 'last_month' | '30_days' | '7_days' | 'month' | 'range'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);

  // Compute query params based on filterMode
  const getQueryParams = () => {
    if (filterMode === 'this_month') {
      return { year: currentYear, month: now.getMonth() + 1, preset: 'this_month' };
    }
    if (filterMode === 'last_month') {
      const prev = new Date(currentYear, now.getMonth() - 1, 1);
      return { year: prev.getFullYear(), month: prev.getMonth() + 1, preset: 'last_month' };
    }
    if (filterMode === '30_days') {
      return { preset: '30_days' };
    }
    if (filterMode === '7_days') {
      return { preset: '7_days' };
    }
    if (filterMode === 'month') {
      if (selectedMonth) {
        const [y, m] = selectedMonth.split('-');
        return { year: Number(y), month: Number(m) };
      }
      return { year: currentYear, month: now.getMonth() + 1 };
    }
    if (filterMode === 'range') {
      return { startDate, endDate };
    }
    return {};
  };

  const queryParams = getQueryParams();

  // Fetch charts data with active filters
  const { data: chartDataResponse, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['userGrowthCharts', filterMode, selectedMonth, startDate, endDate],
    queryFn: () => analyticsApi.getCharts(queryParams),
  });

  const growthData = chartDataResponse?.growth || [];
  const subscriptionTrend = chartDataResponse?.subscriptions || [];
  const activeLabel = chartDataResponse?.label || (
    filterMode === 'this_month' ? 'This Month (Day-wise)' :
    filterMode === 'last_month' ? 'Last Month (Day-wise)' :
    filterMode === '30_days' ? 'Last 30 Days (Day-wise)' :
    filterMode === '7_days' ? 'Last 7 Days (Day-wise)' :
    filterMode === 'month' ? `${selectedMonth} (Day-wise)` :
    `${startDate} to ${endDate}`
  );

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border p-16 text-center animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3.5 border border-rose-500/20">
          <ShieldAlert size={20} />
        </div>
        <h3 className="text-sm font-bold text-foreground">API Connection Error</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Could not retrieve advanced analytics. Verify your backend server is active and try again.
        </p>
        <button 
          onClick={() => refetch()} 
          className="mt-4 h-9 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-md shadow-primary/10"
        >
          <RefreshCcw size={13} className="inline mr-1.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Examine user onboarding rate, daily signups, and active user retention over selected dates and months.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md">
              <RefreshCcw size={12} className="animate-spin text-primary" /> Updating...
            </span>
          )}
        </div>
      </div>

      {/* Date & Month Picker Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <CalendarDays size={15} className="text-primary" />
            <span>Time Range &amp; Granularity:</span>
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({activeLabel})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'this_month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: '30_days', label: 'Last 30 Days' },
              { key: '7_days', label: 'Last 7 Days' },
              { key: 'month', label: 'Pick Month' },
              { key: 'range', label: 'Custom Range' },
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => setFilterMode(preset.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterMode === preset.key
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Conditional Month Picker Input */}
          {filterMode === 'month' && (
            <div className="flex items-center gap-2 pl-2 border-l border-border animate-in fade-in duration-200">
              <span className="text-xs text-muted-foreground font-medium">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                max={currentMonthStr}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Conditional Date Range Inputs */}
          {filterMode === 'range' && (
            <div className="flex items-center gap-2 pl-2 border-l border-border flex-wrap animate-in fade-in duration-200">
              <span className="text-xs text-muted-foreground font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={now.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Rate</span>
          <h4 className="text-xl font-bold mt-2 text-foreground">
            {isLoading ? 'Loading...' : (chartDataResponse?.advancedMetrics?.activeRate || '0.0%')}
          </h4>
          <p className="text-[10px] font-medium text-muted-foreground mt-2">
            Based on unique visitor logins in selected window
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Session Duration</span>
          <h4 className="text-xl font-bold mt-2 text-foreground">
            {isLoading ? 'Loading...' : (chartDataResponse?.advancedMetrics?.avgSessionDuration || '0m 0s')}
          </h4>
          <p className="text-[10px] font-medium text-muted-foreground mt-2">
            Calculated via transaction and audit activity
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Retention (D30)</span>
          <h4 className="text-xl font-bold mt-2 text-foreground">
            {isLoading ? 'Loading...' : (chartDataResponse?.advancedMetrics?.d30Retention || '38.5%')}
          </h4>
          <p className="text-[10px] font-medium text-muted-foreground mt-2">
            Cohort retention across selected timeframe
          </p>
        </div>
      </div>

      {/* Main Charts — Day-wise / Month-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups Chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Daily User Signups
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                New subscriber registrations per day for {activeLabel}.
              </p>
            </div>
            {chartDataResponse?.summary && (
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                {chartDataResponse.summary.totalSignups} Total
              </span>
            )}
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-popover)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="Signups" fill="#6366f1" radius={[4, 4, 0, 0]} name="New Signups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Active Users Chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Active Users Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily active accounts and engagement for {activeLabel}.
              </p>
            </div>
            {chartDataResponse?.summary && (
              <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {chartDataResponse.summary.totalActiveDays} Active Days
              </span>
            )}
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-popover)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ActiveUsers" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={growthData.length <= 15} 
                    name="Active Users" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

