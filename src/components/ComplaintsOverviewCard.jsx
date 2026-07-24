const STATUS_META = {
  open: {
    label: 'Open',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    )
  },
  in_progress: {
    label: 'In Progress',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    )
  },
  resolved: {
    label: 'Resolved',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
};

const RATE_TONES = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  fair: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  poor: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
};

const ComplaintsOverviewCard = ({
  totalComplaints = 0,
  statusCounts = { open: 0, in_progress: 0, resolved: 0 }
}) => {
  const trackedTotal = statusCounts.open + statusCounts.in_progress + statusCounts.resolved;
  const resolutionRate = trackedTotal ? Math.round((statusCounts.resolved / trackedTotal) * 100) : 0;
  const rateTone = resolutionRate >= 70 ? 'good' : resolutionRate >= 40 ? 'fair' : 'poor';

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Complaints This Month</p>
        <span className="text-4xl font-semibold text-white">{totalComplaints}</span>
      </div>

      <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${RATE_TONES[rateTone]}`}>
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">Resolution Rate</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {statusCounts.resolved} of {trackedTotal} resolved this month
          </p>
        </div>
        <span className="text-3xl font-semibold">{resolutionRate}%</span>
      </div>

      <div className="space-y-2">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const count = statusCounts[key] || 0;
          return (
            <div
              key={key}
              className={`flex items-center justify-between rounded-xl border ${meta.border} ${meta.bg} px-3 py-2`}
            >
              <span className={`flex items-center gap-2 text-xs uppercase tracking-wide ${meta.text}/80`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-black/20 ${meta.text}`}>
                  {meta.icon}
                </span>
                {meta.label}
              </span>
              <span className={`text-2xl font-semibold ${meta.text}`}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintsOverviewCard;
