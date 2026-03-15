import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import usePagination from '../hooks/usePagination.js';
import useSheetData from '../hooks/useSheetData.js';
import { SHEET_NAMES } from '../services/googleSheetsService.js';
import { formatDate, formatDateTime, formatTime, toTitleCase } from '../utils/formatters.js';

const Bookings = () => {
  const { data: bookings, loading, error } = useSheetData(SHEET_NAMES.bookings);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const statuses = useMemo(() => {
    const unique = new Set();
    bookings.forEach((booking) => {
      if (booking.status) {
        unique.add(booking.status.toLowerCase());
      }
    });
    return ['all', ...Array.from(unique)];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === 'all' || booking.status?.toLowerCase() === statusFilter.toLowerCase();

      if (!normalizedQuery) {
        return matchesStatus;
      }

      const matchesQuery = Object.values(booking).some((value) =>
        value ? value.toString().toLowerCase().includes(normalizedQuery) : false
      );

      return matchesStatus && matchesQuery;
    });

    const toTimestamp = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    return filtered.sort((a, b) => {
      const diff = toTimestamp(a.created_at) - toTimestamp(b.created_at);
      return sortOrder === 'oldest' ? diff : -diff;
    });
  }, [bookings, query, statusFilter, sortOrder]);

  const { page, totalPages, setPage, paginatedItems } = usePagination(filteredBookings, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        subtitle="Manage booking requests and stay on top of upcoming visits."
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
            placeholder="Search bookings"
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
            {filteredBookings.length === 0 ? 0 : (page - 1) * 10 + 1} -{' '}
            {Math.min(page * 10, filteredBookings.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredBookings.length}</span> bookings
        </span>
        <span>Updated {formatDateTime(new Date())}</span>
      </div>

      <Table
        columns={[
          { key: 'booking_id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'service', label: 'Service' },
          { key: 'visit_date', label: 'Visit Date' },
          { key: 'visit_time', label: 'Visit Time' },
          { key: 'status', label: 'Status' },
          { key: 'channel', label: 'Channel' }
        ]}
        rows={paginatedItems}
        rowKey={(row) => row.booking_id || row.id}
        renderCell={(row, key) => {
          if (key === 'status') return <StatusBadge status={row.status} />;
          if (key === 'visit_date') return formatDate(row.visit_date);
          if (key === 'visit_time') return formatTime(row.visit_time);
          return row[key] || '—';
        }}
        emptyMessage={loading ? 'Loading bookings...' : 'No bookings found.'}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Bookings;
