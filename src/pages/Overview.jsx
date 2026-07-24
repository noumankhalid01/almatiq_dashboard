import { useCallback, useEffect, useMemo, useState } from 'react';
import ComplaintsOverviewCard from '../components/ComplaintsOverviewCard.jsx';
import FloatingMessage from '../components/FloatingMessage.jsx';
import LeadsOverviewCard from '../components/LeadsOverviewCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useSheetData from '../hooks/useSheetData.js';
import { SHEET_NAMES } from '../services/googleSheetsService.js';
import { fetchFitnessLeads, getFitnessLeadsCache, subscribeFitnessLeads } from '../services/fitnessLeadsStore.js';
import { fetchComplaints, getComplaintsCache, subscribeComplaints } from '../services/complaintsStore.js';
import { formatDate, formatDateTime, toTitleCase } from '../utils/formatters.js';

const classifyLeadSource = (value) => {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('referral') || normalized.includes('friend')) return 'Referral';
  if (
    normalized.includes('instagram') ||
    normalized.includes('facebook') ||
    normalized.includes('tiktok') ||
    normalized.includes('social')
  ) {
    return 'Social Media';
  }
  return 'Other';
};

const Overview = () => {
  const { auth } = useAuth();
  const isFitness = auth?.industry === 'Fitness';
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    lastUpdated: bookingsLastUpdated,
    refresh: refreshBookings
  } = useSheetData(SHEET_NAMES.bookings);
  const {
    data: sheetLeads,
    loading: sheetLeadsLoading,
    error: sheetLeadsError,
    lastUpdated: sheetLeadsLastUpdated,
    refresh: refreshSheetLeads
  } = useSheetData(SHEET_NAMES.leads);

  const cachedFitnessLeads = getFitnessLeadsCache(authKey);
  const [fitnessLeads, setFitnessLeads] = useState(() => cachedFitnessLeads?.data || []);
  const [fitnessLeadsLoading, setFitnessLeadsLoading] = useState(() => isFitness && !cachedFitnessLeads);
  const [fitnessLeadsError, setFitnessLeadsError] = useState('');
  const [fitnessLeadsUpdated, setFitnessLeadsUpdated] = useState(() => cachedFitnessLeads?.lastUpdated || null);

  const loadFitnessLeads = useCallback(
    async ({ force = false } = {}) => {
      setFitnessLeadsLoading(true);
      setFitnessLeadsError('');
      try {
        const result = await fetchFitnessLeads(authKey, { force });
        setFitnessLeads(result.data);
        setFitnessLeadsUpdated(result.lastUpdated);
      } catch (err) {
        setFitnessLeadsError(err?.message || 'Unable to fetch leads.');
      } finally {
        setFitnessLeadsLoading(false);
      }
    },
    [authKey]
  );

  useEffect(() => {
    if (!isFitness) return undefined;
    loadFitnessLeads();
    return subscribeFitnessLeads((key, value) => {
      if (key === authKey) {
        setFitnessLeads(value.data);
        setFitnessLeadsUpdated(value.lastUpdated);
      }
    });
  }, [isFitness, authKey, loadFitnessLeads]);

  const cachedComplaints = getComplaintsCache(authKey);
  const [complaints, setComplaints] = useState(() => cachedComplaints?.data || []);

  const loadComplaints = useCallback(
    async ({ force = false } = {}) => {
      try {
        const result = await fetchComplaints(authKey, { force });
        setComplaints(result.data);
      } catch {
        setComplaints([]);
      }
    },
    [authKey]
  );

  useEffect(() => {
    if (!isFitness) return undefined;
    loadComplaints();
    return subscribeComplaints((key, value) => {
      if (key === authKey) setComplaints(value.data);
    });
  }, [isFitness, authKey, loadComplaints]);

  const loading = isFitness ? fitnessLeadsLoading : bookingsLoading || sheetLeadsLoading;
  const error = isFitness ? fitnessLeadsError : bookingsError || sheetLeadsError;
  const [flashError, setFlashError] = useState('');
  const overviewLastUpdated = isFitness
    ? fitnessLeadsUpdated
    : [bookingsLastUpdated, sheetLeadsLastUpdated].filter(Boolean).sort().at(-1);

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  const latestBookings = bookings.slice(-5).reverse();
  const latestFitnessLeads = useMemo(
    () =>
      fitnessLeads
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [fitnessLeads]
  );

  const leadsOverviewData = useMemo(() => {
    const now = new Date();
    const monthKey = (value) => {
      const date = new Date(value);
      return `${date.getFullYear()}-${date.getMonth()}`;
    };
    const thisMonthKey = monthKey(now);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = monthKey(prevMonthDate);

    const thisMonthLeads = fitnessLeads.filter((lead) => lead.created_at && monthKey(lead.created_at) === thisMonthKey);
    const prevMonthLeads = fitnessLeads.filter((lead) => lead.created_at && monthKey(lead.created_at) === prevMonthKey);

    const countByStatus = (list, status) =>
      list.filter((lead) => lead.status?.toLowerCase() === status).length;

    const totalLeads = thisMonthLeads.length;
    const monthOverMonthChange = prevMonthLeads.length
      ? Math.round(((totalLeads - prevMonthLeads.length) / prevMonthLeads.length) * 100)
      : totalLeads > 0
        ? 100
        : 0;

    const statusCounts = {
      new: countByStatus(thisMonthLeads, 'pending'),
      converted: countByStatus(thisMonthLeads, 'converted'),
      lost: countByStatus(thisMonthLeads, 'lost')
    };

    const conversionRate = totalLeads ? (statusCounts.converted / totalLeads) * 100 : 0;
    const prevConversionRate = prevMonthLeads.length
      ? (countByStatus(prevMonthLeads, 'converted') / prevMonthLeads.length) * 100
      : 0;
    const conversionRateDelta = conversionRate - prevConversionRate;

    const channels = { phone: 0, whatsapp: 0 };
    thisMonthLeads.forEach((lead) => {
      const channel = (lead.source || '').toLowerCase();
      if (channel.includes('phone')) channels.phone += 1;
      else if (channel.includes('whatsapp')) channels.whatsapp += 1;
    });
    const topChannel =
      channels.phone === channels.whatsapp
        ? { name: 'Phone & WhatsApp', count: channels.phone + channels.whatsapp }
        : channels.whatsapp > channels.phone
          ? { name: 'WhatsApp', count: channels.whatsapp }
          : { name: 'Phone', count: channels.phone };

    const sourceBuckets = { 'Social Media': 0, Referral: 0, Other: 0 };
    thisMonthLeads.forEach((lead) => {
      sourceBuckets[classifyLeadSource(lead.discovery_source)] += 1;
    });
    const sources = Object.entries(sourceBuckets).map(([name, count]) => ({ name, count }));

    return { totalLeads, monthOverMonthChange, statusCounts, conversionRate, conversionRateDelta, topChannel, sources, channels };
  }, [fitnessLeads]);

  const complaintsOverviewData = useMemo(() => {
    const now = new Date();
    const monthKey = (value) => {
      const date = new Date(value);
      return `${date.getFullYear()}-${date.getMonth()}`;
    };
    const thisMonthKey = monthKey(now);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = monthKey(prevMonthDate);

    const thisMonthComplaints = complaints.filter(
      (complaint) => complaint.created_at && monthKey(complaint.created_at) === thisMonthKey
    );
    const prevMonthComplaints = complaints.filter(
      (complaint) => complaint.created_at && monthKey(complaint.created_at) === prevMonthKey
    );

    const countByStatus = (list, status) =>
      list.filter((complaint) => complaint.status?.toLowerCase() === status).length;

    const totalComplaints = thisMonthComplaints.length;
    const monthOverMonthChange = prevMonthComplaints.length
      ? Math.round(((totalComplaints - prevMonthComplaints.length) / prevMonthComplaints.length) * 100)
      : totalComplaints > 0
        ? 100
        : 0;

    const statusCounts = {
      open: countByStatus(thisMonthComplaints, 'open'),
      in_progress: countByStatus(thisMonthComplaints, 'in_progress'),
      resolved: countByStatus(thisMonthComplaints, 'resolved')
    };

    return { totalComplaints, monthOverMonthChange, statusCounts };
  }, [complaints]);

  const handleRefresh = () => {
    if (isFitness) {
      loadFitnessLeads({ force: true });
      loadComplaints({ force: true });
    } else {
      refreshBookings();
      refreshSheetLeads();
    }
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
        {isFitness ? (
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
            <LeadsOverviewCard
              totalLeads={leadsOverviewData.totalLeads}
              statusCounts={leadsOverviewData.statusCounts}
              conversionRate={leadsOverviewData.conversionRate}
              conversionRateDelta={leadsOverviewData.conversionRateDelta}
              topChannel={leadsOverviewData.topChannel}
              sources={leadsOverviewData.sources}
              channels={leadsOverviewData.channels}
            />
            <ComplaintsOverviewCard
              totalComplaints={complaintsOverviewData.totalComplaints}
              statusCounts={complaintsOverviewData.statusCounts}
            />
          </div>
        ) : (
          <>
            <StatCard
              label="Total Bookings"
              value={loading ? '—' : bookings.length}
              helper="All booking records"
              tone="default"
              className="w-full sm:w-[320px]"
            />
            <StatCard
              label="Total Leads"
              value={loading ? '—' : sheetLeads.length}
              helper="Inbound lead records"
              tone="default"
              className="w-full sm:w-[320px]"
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            {isFitness ? 'Latest Leads' : 'Latest Bookings'}
          </h2>
          {overviewLastUpdated ? (
            <span className="text-xs text-gray-400">Updated {formatDateTime(overviewLastUpdated)}</span>
          ) : null}
        </div>
        {isFitness ? (
          <Table
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'goals', label: 'Goals' },
              { key: 'phone', label: 'Phone' },
              { key: 'status', label: 'Status' },
              { key: 'source', label: 'Channel' }
            ]}
            rows={latestFitnessLeads}
            rowKey={(row) => row.id}
            renderCell={(row, key) => {
              if (key === 'status') return <StatusBadge status={row.status} />;
              if (key === 'source') return row.source ? toTitleCase(row.source) : '—';
              if (key === 'name' || key === 'goals') {
                return row[key] ? <Tooltip content={row[key]}>{row[key]}</Tooltip> : '—';
              }
              return row[key] ?? '—';
            }}
            emptyMessage={loading ? 'Loading leads...' : 'No leads yet.'}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Overview;
