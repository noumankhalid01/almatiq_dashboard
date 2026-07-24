import { useCallback, useEffect, useMemo, useState } from 'react';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import Pagination from '../components/Pagination.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import usePagination from '../hooks/usePagination.js';
import { apiPatch } from '../services/apiClient.js';
import { fetchFitnessLeads, getFitnessLeadsCache, setFitnessLeadsCache } from '../services/fitnessLeadsStore.js';
import { formatDateTime, toTitleCase } from '../utils/formatters.js';

const LEAD_STATUS_OPTIONS = ['pending', 'lost', 'converted'];

const statusSelectStyles = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  lost: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  converted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  default: 'bg-white/10 text-gray-200 border-white/15'
};

const LeadsFitness = () => {
  const { auth } = useAuth();
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');
  const cachedLeads = getFitnessLeadsCache(authKey);
  const [leads, setLeads] = useState(() => cachedLeads?.data || []);
  const [loading, setLoading] = useState(() => !cachedLeads);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [flashError, setFlashError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => cachedLeads?.lastUpdated || null);
  const [updatingLeadId, setUpdatingLeadId] = useState(null);

  const loadLeads = useCallback(
    async ({ force = false } = {}) => {
      const cached = !force && getFitnessLeadsCache(authKey);
      if (cached) {
        setLeads(cached.data);
        setLastUpdated(cached.lastUpdated);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const result = await fetchFitnessLeads(authKey, { force });
        setLeads(result.data);
        setLastUpdated(result.lastUpdated);
      } catch (err) {
        setLeads([]);
        setError(err?.message || 'Unable to fetch leads.');
      } finally {
        setLoading(false);
      }
    },
    [authKey]
  );

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStatusChange = useCallback(
    async (lead, nextStatus) => {
      if (!lead || nextStatus === lead.status) return;

      const previousStatus = lead.status;
      const applyStatus = (status) => {
        setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status } : item)));
        const cached = getFitnessLeadsCache(authKey);
        if (cached) {
          setFitnessLeadsCache(authKey, {
            ...cached,
            data: cached.data.map((item) => (item.id === lead.id ? { ...item, status } : item))
          });
        }
      };

      setUpdatingLeadId(lead.id);
      applyStatus(nextStatus);

      try {
        await apiPatch('/leads/fitness/update-status', { id: lead.id, status: nextStatus }, { auth: true });
      } catch (err) {
        applyStatus(previousStatus);
        setError(err?.message || 'Unable to update lead status.');
      } finally {
        setUpdatingLeadId(null);
      }
    },
    [authKey]
  );

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  const statuses = ['all', 'pending', 'lost', 'converted'];

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status?.toLowerCase() === statusFilter.toLowerCase();

      if (!normalizedQuery) {
        return matchesStatus;
      }

      const matchesQuery = lead.phone
        ? lead.phone.toString().toLowerCase().includes(normalizedQuery)
        : false;

      return matchesStatus && matchesQuery;
    });

    return filtered
      .slice()
      .sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === 'newest' ? -diff : diff;
      });
  }, [leads, query, statusFilter, sortOrder]);

  const { page, totalPages, setPage, paginatedItems } = usePagination(filteredLeads, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Review inbound fitness leads synced from WhatsApp and other channels."
        actions={
          <button
            type="button"
            onClick={() => loadLeads({ force: true })}
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
            {filteredLeads.length === 0 ? 0 : (page - 1) * 10 + 1} -{' '}
            {Math.min(page * 10, filteredLeads.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredLeads.length}</span> leads
        </span>
        {lastUpdated ? <span>Updated {formatDateTime(lastUpdated)}</span> : null}
      </div>

      <Table
        columns={[
          { key: 'name', label: 'Name', className: 'w-32', cellClassName: 'whitespace-nowrap truncate', align: 'center' },
          { key: 'phone', label: 'Phone', className: 'w-32', cellClassName: 'whitespace-nowrap', align: 'center' },
          {
            key: 'goals',
            label: 'Goals',
            className: 'w-48',
            cellClassName: 'max-w-[220px] whitespace-nowrap truncate',
            align: 'center'
          },
          {
            key: 'existing_gym_membership',
            label: 'Existing Gym Membership',
            className: 'w-24',
            cellClassName: 'whitespace-nowrap',
            align: 'center'
          },
          { key: 'source', label: 'Channel', className: 'w-24', cellClassName: 'whitespace-nowrap', align: 'center' },
          {
            key: 'discovery_source',
            label: 'Leads Source',
            className: 'w-32',
            cellClassName: 'whitespace-nowrap',
            align: 'center'
          },
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
                  disabled={updatingLeadId === row.id}
                  className={`appearance-none rounded-full border py-1 pl-3 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 ${
                    statusSelectStyles[statusKey] || statusSelectStyles.default
                  }`}
                >
                  {!row.status && (
                    <option value="" disabled>
                      Select status
                    </option>
                  )}
                  {LEAD_STATUS_OPTIONS.map((status) => (
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
          if (key === 'source' || key === 'discovery_source') {
            return row[key] ? toTitleCase(row[key]) : '—';
          }
          if (key === 'name' || key === 'goals') {
            return row[key] ? <Tooltip content={row[key]}>{row[key]}</Tooltip> : '—';
          }
          return row[key] ?? '—';
        }}
        emptyMessage={loading ? 'Loading leads...' : 'No leads found.'}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default LeadsFitness;
