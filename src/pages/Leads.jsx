import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import Pagination from '../components/Pagination.jsx';
import usePagination from '../hooks/usePagination.js';
import useSheetData from '../hooks/useSheetData.js';
import { SHEET_NAMES } from '../services/googleSheetsService.js';
import { formatDateTime } from '../utils/formatters.js';

const Leads = () => {
  const { data: leads, loading, error } = useSheetData(SHEET_NAMES.leads);
  const [query, setQuery] = useState('');

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return leads;

    return leads.filter((lead) =>
      Object.values(lead).some((value) =>
        value ? value.toString().toLowerCase().includes(normalizedQuery) : false
      )
    );
  }, [leads, query]);

  const { page, totalPages, setPage, paginatedItems } = usePagination(filteredLeads, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Review inbound customer inquiries and marketing leads synced from Google Sheets."
      />

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 shadow-soft">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-black/50 px-3">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads"
            className="h-full w-full bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none"
          />
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
        <span>Updated {formatDateTime(new Date())}</span>
      </div>

      <Table
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'channel', label: 'Channel' },
          { key: 'issue', label: 'Issue', cellClassName: 'max-w-[200px] truncate' },
          { key: 'suggestion', label: 'Suggestion', cellClassName: 'max-w-[200px] truncate' }
        ]}
        rows={paginatedItems}
        rowKey={(row) => row.id || row.email}
        renderCell={(row, key) => {
          return row[key] || '—';
        }}
        emptyMessage={loading ? 'Loading leads...' : 'No leads found.'}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Leads;
