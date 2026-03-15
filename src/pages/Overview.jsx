import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import useSheetData from '../hooks/useSheetData.js';
import { SHEET_NAMES } from '../services/googleSheetsService.js';
import { formatDate, formatDateTime } from '../utils/formatters.js';

const Overview = () => {
  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError
  } = useSheetData(SHEET_NAMES.bookings);
  const { data: leads, loading: leadsLoading, error: leadsError } = useSheetData(SHEET_NAMES.leads);

  const loading = bookingsLoading || leadsLoading;
  const error = bookingsError || leadsError;

  const toTimestamp = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const latestBookings = [...bookings]
    .sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Overview of your bookings and performance."
      />

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <StatCard
          label="Total Bookings"
          value={loading ? '—' : bookings.length}
          helper="All booking records"
          tone="default"
          className="w-full sm:w-[320px]"
        />
        <StatCard
          label="Total Leads"
          value={loading ? '—' : leads.length}
          helper="Inbound lead records"
          tone="default"
          className="w-full sm:w-[320px]"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">Latest Bookings</h2>
          <span className="text-xs text-gray-400">Updated {formatDateTime(new Date())}</span>
        </div>
        <Table
          columns={[
              { key: 'booking_id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'service', label: 'Service' },
            { key: 'visit_date', label: 'Visit Date' },
            { key: 'status', label: 'Status' }
          ]}
          rows={latestBookings}
          rowKey={(row) => row.booking_id || row.id}
          renderCell={(row, key) => {
            if (key === 'status') return <StatusBadge status={row.status} />;
            if (key === 'visit_date') return formatDate(row.visit_date);
            return row[key] || '—';
          }}
          emptyMessage={loading ? 'Loading bookings...' : 'No bookings yet.'}
        />
      </div>
    </div>
  );
};

export default Overview;
