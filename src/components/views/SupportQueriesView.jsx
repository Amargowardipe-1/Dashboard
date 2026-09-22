'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/services/support.api';
import { TableSkeleton } from '../ui/Skeleton';
import Dialog from '../ui/Dialog';
import {
  Search,
  Filter,
  HelpCircle,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Eye,
  RefreshCw,
  Phone,
  Send,
  Trash2,
  X,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';

export default function SupportQueriesView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyModalQuery, setReplyModalQuery] = useState(null);
  const [deleteModalQuery, setDeleteModalQuery] = useState(null);
  
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [toastMessage, setToastMessage] = useState(null); // { type: 'success'|'error', text: '' }

  const queryClient = useQueryClient();

  const showToast = (text, type = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Queries & Mutations ──────────────────────────────────────────────
  const { data: responseData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['supportQueries'],
    queryFn: () => supportApi.getSupportQueries(),
  });

  const queries = Array.isArray(responseData?.data)
    ? responseData.data
    : Array.isArray(responseData)
    ? responseData
    : [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => supportApi.updateQueryStatus(id, status),
    onMutate: ({ id }) => {
      setActionLoadingId(`status-${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supportQueries'] });
      showToast(`Ticket status updated to "${formatStatusLabel(variables.status)}".`);
    },
    onError: (err) => {
      showToast(err.message || 'Failed to update status', 'error');
    },
    onSettled: () => {
      setActionLoadingId('');
    },
  });

  const deleteQueryMutation = useMutation({
    mutationFn: (id) => supportApi.deleteQuery(id),
    onMutate: (id) => {
      setActionLoadingId(`delete-${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportQueries'] });
      showToast('Support query deleted successfully.');
      setDeleteModalQuery(null);
    },
    onError: (err) => {
      showToast(err.message || 'Failed to delete query', 'error');
    },
    onSettled: () => {
      setActionLoadingId('');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, payload }) => supportApi.replyToQuery(id, payload),
    onMutate: ({ id }) => {
      setActionLoadingId(`reply-${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportQueries'] });
      showToast('Email response dispatched successfully!');
      setReplyModalQuery(null);
    },
    onError: (err) => {
      showToast(err.message || 'Failed to send reply', 'error');
    },
    onSettled: () => {
      setActionLoadingId('');
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────
  const formatStatusLabel = (st) => {
    if (st === 'resolved') return 'Resolved';
    if (st === 'in_progress') return 'In Progress';
    return 'Pending';
  };

  const handleOpenReply = (item) => {
    setReplyModalQuery(item);
    setReplySubject(`Re: ${item.subject || 'Support Request'}`);
    setReplyMessage(
      `Hello ${item.userName || 'User'},\n\nWe have reviewed your support query regarding "${item.subject || 'your request'}" and resolved the issue. Please let us know if you need any further assistance.\n\nBest regards,\nExpenso Support Team`
    );
    setReplyStatus('resolved');
  };

  const applyPreset = (type, item) => {
    const name = item?.userName || 'User';
    const subj = item?.subject || 'Query';
    if (type === 'resolved') {
      setReplySubject(`Re: ${subj} - Problem Resolved`);
      setReplyMessage(`Hello ${name},\n\nWe have reviewed your request regarding "${subj}" and resolved the issue. Please check in the app and let us know if you need any further help.\n\nBest regards,\nExpenso Support Team`);
      setReplyStatus('resolved');
    } else if (type === 'investigating') {
      setReplySubject(`Re: ${subj} - Under Investigation`);
      setReplyMessage(`Hello ${name},\n\nWe are actively investigating your issue regarding "${subj}". Our technical team is working on it and we will update you shortly.\n\nBest regards,\nExpenso Support Team`);
      setReplyStatus('in_progress');
    } else if (type === 'info') {
      setReplySubject(`Re: ${subj} - Details Needed`);
      setReplyMessage(`Hello ${name},\n\nThank you for contacting support regarding "${subj}". Could you please reply with additional details or a screenshot so we can assist you better?\n\nBest regards,\nExpenso Support Team`);
      setReplyStatus('pending');
    }
  };

  // ── Filter & Metrics Computations ────────────────────────────────────
  const pendingCount = queries.filter((q) => q.status === 'pending' || !q.status).length;
  const inProgressCount = queries.filter((q) => q.status === 'in_progress').length;
  const resolvedCount = queries.filter((q) => q.status === 'resolved').length;

  const filteredQueries = queries.filter((item) => {
    const name = item.userName || '';
    const email = item.userEmail || '';
    const phone = item.phoneNumber || '';
    const subject = item.subject || '';
    const message = item.message || '';
    const queryStr = search.toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(queryStr) ||
      email.toLowerCase().includes(queryStr) ||
      phone.toLowerCase().includes(queryStr) ||
      subject.toLowerCase().includes(queryStr) ||
      message.toLowerCase().includes(queryStr);

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'pending'
        ? item.status === 'pending' || !item.status
        : statusFilter === 'in_progress'
        ? item.status === 'in_progress'
        : statusFilter === 'resolved'
        ? item.status === 'resolved'
        : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border transition-all animate-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-500 text-white border-rose-600'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <HelpCircle className="text-primary" size={28} />
            Help & Support Queries
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage, respond to, and track support tickets submitted by mobile app users.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-secondary transition-all text-foreground shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={isLoading || isRefetching ? 'animate-spin text-primary' : ''} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:border-primary/50 ${
            statusFilter === 'All' ? 'ring-2 ring-primary/30 border-primary' : 'border-border'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Queries
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{queries.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:border-amber-500/50 ${
            statusFilter === 'pending' ? 'ring-2 ring-amber-500/30 border-amber-500' : 'border-border'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:border-sky-500/50 ${
            statusFilter === 'in_progress' ? 'ring-2 ring-sky-500/30 border-sky-500' : 'border-border'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              In Progress
            </p>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {inProgressCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        {/* Resolved */}
        <div
          onClick={() => setStatusFilter('resolved')}
          className={`bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:border-emerald-500/50 ${
            statusFilter === 'resolved' ? 'ring-2 ring-emerald-500/30 border-emerald-500' : 'border-border'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Resolved
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {resolvedCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, email, phone, subject, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'All', label: 'All', count: queries.length },
            { key: 'pending', label: 'Pending', count: pendingCount, color: 'text-amber-500' },
            { key: 'in_progress', label: 'In Progress', count: inProgressCount, color: 'text-sky-500' },
            { key: 'resolved', label: 'Resolved', count: resolvedCount, color: 'text-emerald-500' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === t.key
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : filteredQueries.length === 0 ? (
          <div className="p-16 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No support queries found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {search
                ? 'No tickets match your search filters. Try clearing search criteria.'
                : 'No support queries have been submitted in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQueries.map((item) => {
                  const queryId = item._id || item.id;
                  const isStatusUpdating = actionLoadingId === `status-${queryId}`;
                  const isDeleting = actionLoadingId === `delete-${queryId}`;
                  const isReplying = actionLoadingId === `reply-${queryId}`;

                  const dateStr = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={queryId}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                            {(item.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-foreground truncate">
                              {item.userName || 'User'}
                            </p>
                            <a
                              href={`mailto:${item.userEmail}`}
                              className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                              title="Click to Email"
                            >
                              <Mail size={12} />
                              {item.userEmail}
                            </a>
                            {item.phoneNumber ? (
                              <a
                                href={`tel:${item.countryCode || '+91'}${item.phoneNumber}`}
                                className="text-xs text-primary hover:underline truncate flex items-center gap-1 mt-0.5 font-medium"
                                title="Click to Call"
                              >
                                <Phone size={11} />
                                {item.countryCode || '+91'} {item.phoneNumber}
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <span className="line-clamp-1">{item.subject || 'Support Ticket'}</span>
                      </td>

                      {/* Query Message Preview */}
                      <td className="px-6 py-4 text-muted-foreground max-w-xs">
                        <p className="line-clamp-2 text-xs leading-relaxed">{item.message}</p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {dateStr}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            item.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : item.status === 'in_progress'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {item.status === 'resolved' ? (
                            <>
                              <CheckCircle2 size={13} />
                              Resolved
                            </>
                          ) : item.status === 'in_progress' ? (
                            <>
                              <Clock size={13} />
                              In Progress
                            </>
                          ) : (
                            <>
                              <AlertCircle size={13} />
                              Pending
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Status Select */}
                          <div className="relative">
                            <select
                              value={item.status || 'pending'}
                              disabled={isStatusUpdating}
                              onChange={(e) =>
                                updateStatusMutation.mutate({
                                  id: queryId,
                                  status: e.target.value,
                                })
                              }
                              className={`h-8 pl-2.5 pr-6 text-xs font-bold rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50 transition-all ${
                                item.status === 'resolved'
                                  ? 'border-emerald-500/30 text-emerald-600'
                                  : item.status === 'in_progress'
                                  ? 'border-sky-500/30 text-sky-600'
                                  : 'border-amber-500/30 text-amber-600'
                              }`}
                            >
                              <option value="pending">Pending 🟡</option>
                              <option value="in_progress">In Progress 🔵</option>
                              <option value="resolved">Resolved 🟢</option>
                            </select>
                            {isStatusUpdating && (
                              <RefreshCw
                                size={12}
                                className="animate-spin text-primary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                              />
                            )}
                          </div>

                          {/* Reply */}
                          <button
                            onClick={() => handleOpenReply(item)}
                            disabled={isReplying}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                            title="Send Email Response"
                          >
                            <Send size={13} />
                            Reply
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => setSelectedQuery(item)}
                            className="p-1.5 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all shadow-sm"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Delete Query */}
                          <button
                            onClick={() => setDeleteModalQuery(item)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/15 transition-all shadow-sm disabled:opacity-50"
                            title="Delete Support Ticket"
                          >
                            {isDeleting ? (
                              <RefreshCw size={16} className="animate-spin text-rose-500" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Query Detail Modal ─────────────────────────────────────────── */}
      {selectedQuery && (
        <Dialog
          isOpen={!!selectedQuery}
          onClose={() => setSelectedQuery(null)}
          title="Support Ticket Details"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20">
                  {(selectedQuery.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground">{selectedQuery.userName}</p>
                  <a href={`mailto:${selectedQuery.userEmail}`} className="text-xs text-primary hover:underline">
                    {selectedQuery.userEmail}
                  </a>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedQuery.status === 'resolved'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : selectedQuery.status === 'in_progress'
                    ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {formatStatusLabel(selectedQuery.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Contact Phone
                </label>
                {selectedQuery.phoneNumber ? (
                  <a
                    href={`tel:${selectedQuery.countryCode || '+91'}${selectedQuery.phoneNumber}`}
                    className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline mt-0.5"
                  >
                    <Phone size={14} />
                    {selectedQuery.countryCode || '+91'} {selectedQuery.phoneNumber}
                  </a>
                ) : (
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Not Provided</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Subject
                </label>
                <p className="font-semibold text-foreground text-sm mt-0.5">{selectedQuery.subject || 'Support Ticket'}</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                User Query Message
              </label>
              <div className="mt-1 p-3.5 bg-secondary/40 border border-border rounded-xl text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedQuery.message}
              </div>
            </div>

            {/* Past Admin Reply */}
            {selectedQuery.adminReply ? (
              <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span className="flex items-center gap-1.5"><Send size={12} /> Last Admin Response</span>
                  <span>{selectedQuery.repliedAt ? new Date(selectedQuery.repliedAt).toLocaleString('en-IN') : ''}</span>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap mt-1 leading-relaxed">{selectedQuery.adminReply}</p>
              </div>
            ) : null}

            <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
              <span>
                Submitted on:{' '}
                {selectedQuery.createdAt
                  ? new Date(selectedQuery.createdAt).toLocaleString('en-IN')
                  : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => {
                  const q = selectedQuery;
                  setSelectedQuery(null);
                  setDeleteModalQuery(q);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                Delete Ticket
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const q = selectedQuery;
                    setSelectedQuery(null);
                    handleOpenReply(q);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md transition-all"
                >
                  <Send size={13} />
                  Send Email Reply
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── Admin Email Reply Modal ──────────────────────────────────────── */}
      {replyModalQuery && (
        <Dialog
          isOpen={!!replyModalQuery}
          onClose={() => setReplyModalQuery(null)}
          title={`Reply to ${replyModalQuery.userName || 'User'}`}
        >
          <div className="space-y-4">
            {/* Recipient summary */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground">{replyModalQuery.userName}</p>
                  <p className="text-[11px] text-muted-foreground">{replyModalQuery.userEmail}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                Brevo Email Dispatch
              </span>
            </div>

            {/* Response Templates */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Quick Reply Templates
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('resolved', replyModalQuery)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                >
                  🟢 Problem Resolved
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('investigating', replyModalQuery)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-600 border border-sky-500/30 hover:bg-sky-500/20 transition-all"
                >
                  🔵 Under Investigation
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('info', replyModalQuery)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                >
                  🟡 More Info Needed
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Email Subject Line
              </label>
              <input
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-border text-xs bg-background text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Response Message
              </label>
              <textarea
                rows={5}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response to the user..."
                className="w-full p-3 rounded-xl border border-border text-xs bg-background text-foreground font-normal focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* Status Select & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Set Ticket Status:</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="h-8 rounded-xl border border-border text-xs bg-background text-foreground px-2.5 font-bold focus:outline-none"
                >
                  <option value="resolved">Resolved 🟢</option>
                  <option value="in_progress">In Progress 🔵</option>
                  <option value="pending">Pending 🟡</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setReplyModalQuery(null)}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  onClick={() => {
                    replyMutation.mutate({
                      id: replyModalQuery._id || replyModalQuery.id,
                      payload: {
                        subject: replySubject,
                        message: replyMessage,
                        status: replyStatus,
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {replyMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Send Response
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      {deleteModalQuery && (
        <Dialog
          isOpen={!!deleteModalQuery}
          onClose={() => setDeleteModalQuery(null)}
          title="Delete Support Ticket"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={15} />
                Are you sure you want to delete this ticket?
              </p>
              <p className="text-muted-foreground">
                This action is permanent and will remove the support query from your dashboard database.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-1 text-xs">
              <p className="font-bold text-foreground">
                User: <span className="font-normal">{deleteModalQuery.userName} ({deleteModalQuery.userEmail})</span>
              </p>
              <p className="font-bold text-foreground truncate">
                Subject: <span className="font-normal">{deleteModalQuery.subject || 'Support Ticket'}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteModalQuery(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteQueryMutation.isPending}
                onClick={() => {
                  deleteQueryMutation.mutate(deleteModalQuery._id || deleteModalQuery.id);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {deleteQueryMutation.isPending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

