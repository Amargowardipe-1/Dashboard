'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveView } from '@/store/uiSlice';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/services/payments.api';
import { useCurrency } from '@/hooks/useCurrency';
import { TableSkeleton } from '../ui/Skeleton';
import Dialog from '../ui/Dialog';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ShieldAlert,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  Settings
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusColor = (s) => {
  switch (s) {
    case 'success':  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'pending':  return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'failed':   return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'refunded': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    default:         return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
};

const planLabel = (p) => {
  const map = { pro_monthly: 'Pro Monthly', pro_yearly: 'Pro Yearly' };
  return map[p] || p || '—';
};

// ─── Summary Card ────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function PaymentsView() {
  const dispatch = useDispatch();
  const { formatAmount } = useCurrency();
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [planFilter, setPlanFilter]       = useState('');
  const [page, setPage]                   = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminPayments', { search, statusFilter, planFilter, page }],
    queryFn:  () => paymentsApi.getPayments({ search, status: statusFilter, plan: planFilter, page, limit: 10 }),
  });

  const payments   = data?.payments   || [];
  const totalPages = data?.totalPages  || 1;
  const totalCount = data?.total       || 0;
  const summary    = data?.summary     || {};

  // ─── Error state ────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border p-16 text-center animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3.5 border border-rose-500/20">
          <ShieldAlert size={20} />
        </div>
        <h3 className="text-sm font-bold text-foreground">API Connection Error</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Could not retrieve the payment ledger. Check that your backend is running.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 h-9 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-md shadow-primary/10"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Trace billing details, examine gateway invoices, and manage subscriber transactions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = 'payment';
            }
            dispatch(setActiveView('settings'));
          }}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Settings size={14} className="text-primary" />
          Gateway Settings
        </button>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={CreditCard}   label="Total Revenue"   value={formatAmount(summary.totalRevenue)}          colorClass="bg-violet-500/10 text-violet-500" />
          <SummaryCard icon={CheckCircle}  label="Successful"      value={summary.successCount  ?? 0}         colorClass="bg-emerald-500/10 text-emerald-500" />
          <SummaryCard icon={Clock}        label="Pending"         value={summary.pendingCount  ?? 0}         colorClass="bg-amber-500/10 text-amber-500" />
          <SummaryCard icon={XCircle}      label="Failed"          value={summary.failedCount   ?? 0}         colorClass="bg-rose-500/10 text-rose-500" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search user name, email, or order ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-muted/30 focus:bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1"><Filter size={13} /> Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1"><Filter size={13} /> Plan</span>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Plans</option>
              <option value="pro_monthly">Pro Monthly</option>
              <option value="pro_yearly">Pro Yearly</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/35 mx-auto mb-3.5" />
          <h3 className="text-sm font-bold text-foreground">No payments found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Adjust your filters to find transactions.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Gateway</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/15 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-foreground">{p.user?.fullName || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{p.user?.email || '—'}</p>
                    </td>
                    <td className="p-4 font-bold text-foreground">{formatAmount(p.amount)}</td>
                    <td className="p-4 font-medium text-foreground">{planLabel(p.plan)}</td>
                    <td className="p-4 text-muted-foreground font-medium capitalize">{p.provider || '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{fmtDate(p.paidAt || p.createdAt)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Showing <span className="text-foreground">{payments.length}</span> of <span className="text-foreground">{totalCount}</span> transactions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold px-2 text-foreground">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Transaction Details">
        {selectedPayment && (
          <div className="space-y-4 text-sm">
            <div className="pb-4 border-b border-border flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Amount</span>
                <h4 className="font-bold text-foreground text-2xl mt-0.5">{formatAmount(selectedPayment.amount)}</h4>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusColor(selectedPayment.status)}`}>
                {selectedPayment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Account Holder</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedPayment.user?.fullName || '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedPayment.user?.email || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Gateway</span>
                <p className="font-semibold text-foreground mt-0.5 capitalize">{selectedPayment.provider || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Plan</span>
                <p className="font-semibold text-foreground mt-0.5">{planLabel(selectedPayment.plan)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Paid At</span>
                <p className="font-semibold text-foreground mt-0.5">{fmtDate(selectedPayment.paidAt)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Razorpay Order ID</span>
                <p className="font-mono text-xs text-foreground mt-0.5 break-all">{selectedPayment.razorpayOrderId || '—'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Razorpay Payment ID</span>
                <p className="font-mono text-xs text-foreground mt-0.5 break-all">{selectedPayment.razorpayPaymentId || '—'}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-2 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
