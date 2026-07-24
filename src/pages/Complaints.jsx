import { useCallback, useEffect, useMemo, useState } from 'react';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import Pagination from '../components/Pagination.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import usePagination from '../hooks/usePagination.js';
import { apiPatch } from '../services/apiClient.js';
import { fetchComplaints, getComplaintsCache, setComplaintsCache } from '../services/complaintsStore.js';
import { formatDateTime, toTitleCase } from '../utils/formatters.js';

const COMPLAINT_STATUS_OPTIONS = ['open', 'in_progress', 'resolved'];

const statusSelectStyles = {
  open: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  default: 'bg-white/10 text-gray-200 border-white/15'
};

const Complaints = () => {
  const { auth } = useAuth();
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');
  const cachedComplaints = getComplaintsCache(authKey);
  const [complaints, setComplaints] = useState(() => cachedComplaints?.data || []);
  const [loading, setLoading] = useState(() => !cachedComplaints);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [flashError, setFlashError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => cachedComplaints?.lastUpdated || null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState(null);

  const loadComplaints = useCallback(
    async ({ force = false } = {}) => {
      const cached = !force && getComplaintsCache(authKey);
      if (cached) {
        setComplaints(cached.data);
        setLastUpdated(cached.lastUpdated);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const result = await fetchComplaints(authKey, { force });
        setComplaints(result.data);
        setLastUpdated(result.lastUpdated);
      } catch (err) {
        setComplaints([]);
        setError(err?.message || 'Unable to fetch complaints.');
      } finally {
        setLoading(false);
      }
    },
    [authKey]
  );

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleStatusChange = useCallback(
    async (complaint, nextStatus) => {
      if (!complaint || nextStatus === complaint.status) return;

      const previousStatus = complaint.status;
      const applyStatus = (status) => {
        setComplaints((prev) => prev.map((item) => (item.id === complaint.id ? { ...item, status } : item)));
        const cached = getComplaintsCache(authKey);
        if (cached) {
          setComplaintsCache(authKey, {
            ...cached,
            data: cached.data.map((item) => (item.id === complaint.id ? { ...item, status } : item))
          });
        }
      };

      setUpdatingComplaintId(complaint.id);
      applyStatus(nextStatus);

      try {
        await apiPatch('/complaints/update-status', { id: complaint.id, status: nextStatus }, { auth: true });
      } catch (err) {
        applyStatus(previousStatus);
        setError(err?.message || 'Unable to update complaint status.');
      } finally {
        setUpdatingComplaintId(null);
      }
    },
    [authKey]
  );

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  const statuses = ['all', 'open', 'in_progress', 'resolved'];

  const filteredComplaints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = complaints.filter((complaint) => {
      const matchesStatus =
        statusFilter === 'all' || complaint.status?.toLowerCase() === statusFilter.toLowerCase();

      if (!normalizedQuery) {
        return matchesStatus;
      }

      const matchesQuery = complaint.phone
        ? complaint.phone.toString().toLowerCase().includes(normalizedQuery)
        : false;

      return matchesStatus && matchesQuery;
    });

    return filtered
      .slice()
      .sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === 'newest' ? -diff : diff;
      });
  }, [complaints, query, statusFilter, sortOrder]);

  const { page, totalPages, setPage, paginatedItems } = usePagination(filteredComplaints, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        subtitle="Review inbound complaints synced from WhatsApp, phone calls, and other channels."
        actions={
          <button
            type="button"
            onClick={() => loadComplaints({ force: true })}
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
            placeholder="Search by phone number"
            className="h-full w-full bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="relative flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-gray-300">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-white focus:outline-none"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {toTitleCase(status)}
              </option>
            ))}
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
        <div className="relative flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-gray-300">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Sort</span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-white focus:outline-none"
          >
            <option value="oldest">Oldest</option>
            <option value="newest">Newest</option>
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
            {filteredComplaints.length === 0 ? 0 : (page - 1) * 10 + 1} -{' '}
            {Math.min(page * 10, filteredComplaints.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredComplaints.length}</span> complaints
        </span>
        {lastUpdated ? <span>Updated {formatDateTime(lastUpdated)}</span> : null}
      </div>

      <Table
        columns={[
          { key: 'name', label: 'Name', className: 'w-32', cellClassName: 'whitespace-nowrap truncate', align: 'center' },
          { key: 'phone', label: 'Phone', className: 'w-32', cellClassName: 'whitespace-nowrap', align: 'center' },
          {
            key: 'description',
            label: 'Description',
            className: 'w-48',
            cellClassName: 'max-w-[220px] whitespace-nowrap truncate',
            align: 'center'
          },
          { key: 'channel', label: 'Channel', className: 'w-24', cellClassName: 'whitespace-nowrap', align: 'center' },
          { key: 'status', label: 'Status', className: 'w-24', cellClassName: 'whitespace-nowrap', align: 'center' },
          {
            key: 'updated_at',
            label: 'Updated At',
            className: 'w-36',
            cellClassName: 'whitespace-nowrap',
            align: 'center'
          },
          {
            key: 'created_at',
            label: 'Created At',
            className: 'w-36',
            cellClassName: 'whitespace-nowrap',
            align: 'center'
          }
        ]}
        tableClassName="table-fixed"
        rows={paginatedItems}
        rowKey={(row) => row.id}
        renderCell={(row, key) => {
          if (key === 'status') {
            const statusKey = row.status ? row.status.toLowerCase() : 'default';
            return (
              <span className="relative inline-flex items-center">
                <select
                  value={row.status || ''}
                  onChange={(event) => handleStatusChange(row, event.target.value)}
                  disabled={updatingComplaintId === row.id}
                  className={`appearance-none rounded-full border py-1 pl-3 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 ${
                    statusSelectStyles[statusKey] || statusSelectStyles.default
                  }`}
                >
                  {!row.status && (
                    <option value="" disabled>
                      Select status
                    </option>
                  )}
                  {COMPLAINT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-black text-white">
                      {toTitleCase(status)}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-2 h-3 w-3 text-current"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            );
          }
          if (key === 'created_at' || key === 'updated_at') return formatDateTime(row[key]);
          if (key === 'channel') return row.channel ? toTitleCase(row.channel) : '—';
          if (key === 'name' || key === 'description') {
            return row[key] ? <Tooltip content={row[key]}>{row[key]}</Tooltip> : '—';
          }
          return row[key] ?? '—';
        }}
        emptyMessage={loading ? 'Loading complaints...' : 'No complaints found.'}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Complaints;
