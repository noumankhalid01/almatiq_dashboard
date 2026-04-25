import { useCallback, useEffect, useMemo, useState } from 'react';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import usePagination from '../hooks/usePagination.js';
import { apiGet } from '../services/apiClient.js';
import { formatDateTime, toTitleCase } from '../utils/formatters.js';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const billingHistoryCache = new Map();
const billingHistoryInFlight = new Map();

const BillingHistory = () => {
  const { auth } = useAuth();
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');
  const cachedHistory = billingHistoryCache.get(authKey);
  const [history, setHistory] = useState(() => cachedHistory?.data || []);
  const [loading, setLoading] = useState(() => !cachedHistory);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [flashError, setFlashError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => cachedHistory?.lastUpdated || null);

  const loadPaymentHistory = useCallback(
    async ({ force = false } = {}) => {
      if (!force) {
        const cached = billingHistoryCache.get(authKey);
        if (cached) {
          setHistory(cached.data);
          setLastUpdated(cached.lastUpdated);
          setLoading(false);
          setError('');
          return;
        }

        const inFlight = billingHistoryInFlight.get(authKey);
        if (inFlight) {
          setLoading(true);
          setError('');
          try {
            const cachedResult = await inFlight;
            setHistory(cachedResult.data);
            setLastUpdated(cachedResult.lastUpdated);
          } catch (err) {
            setHistory([]);
            setError(err?.message || 'Unable to fetch billing history.');
          } finally {
            setLoading(false);
          }
          return;
        }
      }

      setLoading(true);
      setError('');
      const request = apiGet('/payments/payment_history', { auth: true }).then((response) => {
        const nextHistory = Array.isArray(response) ? response : [];
        const updatedAt = new Date().toISOString();
        const nextValue = { data: nextHistory, lastUpdated: updatedAt };
        billingHistoryCache.set(authKey, nextValue);
        return nextValue;
      });

      billingHistoryInFlight.set(authKey, request);

      try {
        const result = await request;
        setHistory(result.data);
        setLastUpdated(result.lastUpdated);
      } catch (err) {
        setHistory([]);
        setError(err?.message || 'Unable to fetch billing history.');
      } finally {
        billingHistoryInFlight.delete(authKey);
        setLoading(false);
      }
    },
    [authKey]
  );

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = history.filter((record) => {
      if (!normalizedQuery) return true;
      return (record.stripe_invoice_id || '').toString().toLowerCase().includes(normalizedQuery);
    });

    return sortOrder === 'newest'
      ? filtered
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : filtered
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [history, query, sortOrder]);

  const { page, totalPages, setPage, paginatedItems } = usePagination(filteredHistory, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing History"
        subtitle="Track invoices and billing activity for your plan."
        actions={
          <button
            type="button"
            onClick={() => loadPaymentHistory({ force: true })}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
          >
            Refresh
          </button>
        }
      />

      <FloatingMessage message={flashError} type="error" onClose={() => setFlashError('')} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 shadow-soft">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-black/50 px-3">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by invoice ID"
            className="h-full w-full bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="relative flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-gray-300">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Sort</span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-white focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Showing{' '}
          <span className="font-semibold text-white">
            {filteredHistory.length === 0 ? 0 : (page - 1) * 10 + 1} -{' '}
            {Math.min(page * 10, filteredHistory.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredHistory.length}</span> invoices
        </span>
        {lastUpdated ? <span>Updated {formatDateTime(lastUpdated)}</span> : null}
      </div>

      <Table
        columns={[
          { key: 'stripe_invoice_id', label: 'Invoice ID' },
          { key: 'amount', label: 'Amount' },
          { key: 'payment_type', label: 'Payment Type' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Billed At' }
        ]}
        rows={paginatedItems}
        rowKey={(row) => row.id}
        renderCell={(row, key) => {
          if (key === 'amount') return formatCurrency(row.amount);
          if (key === 'status') return <StatusBadge status={row.status} />;
          if (key === 'payment_type') return toTitleCase(row.payment_type);
          if (key === 'created_at') return formatDateTime(row.created_at);
          return row[key] ?? '—';
        }}
        emptyMessage={loading ? 'Loading billing history...' : 'No billing history found.'}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default BillingHistory;
