import { useEffect, useState } from 'react';
import FloatingMessage from '../components/FloatingMessage.jsx';
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
    error: bookingsError,
    lastUpdated: bookingsLastUpdated,
    refresh: refreshBookings
  } = useSheetData(SHEET_NAMES.bookings);
  const {
    data: leads,
    loading: leadsLoading,
    error: leadsError,
    lastUpdated: leadsLastUpdated,
    refresh: refreshLeads
  } = useSheetData(SHEET_NAMES.leads);

  const loading = bookingsLoading || leadsLoading;
  const error = bookingsError || leadsError;
  const [flashError, setFlashError] = useState('');
  const overviewLastUpdated = [bookingsLastUpdated, leadsLastUpdated]
    .filter(Boolean)
    .sort()
    .at(-1);

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  const latestBookings = bookings.slice(-5).reverse();
  const handleRefresh = () => {
    refreshBookings();
    refreshLeads();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Overview of your bookings and performance."
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
          >
            Refresh
          </button>
        }
      />

      <FloatingMessage message={flashError} type="error" onClose={() => setFlashError('')} />

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
          {overviewLastUpdated ? (
            <span className="text-xs text-gray-400">Updated {formatDateTime(overviewLastUpdated)}</span>
          ) : null}
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
