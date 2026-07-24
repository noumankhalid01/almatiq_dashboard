import { PhoneIcon, WhatsAppIcon } from './icons/ChannelIcons.jsx';

const SOURCE_COLORS = {
  'social media': 'bg-blue-500',
  referral: 'bg-orange-500',
  other: 'bg-gray-400'
};

const LeadsOverviewCard = ({
  totalLeads = 0,
  statusCounts = { new: 0, converted: 0, lost: 0 },
  conversionRate = 0,
  conversionRateDelta = 0,
  topChannel = { name: '—', count: 0 },
  sources = [],
  channels = { phone: 0, whatsapp: 0 }
}) => {
  const sourcesTotal = sources.reduce((sum, source) => sum + (source.count || 0), 0);

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Leads This Month</p>
        <span className="text-4xl font-semibold text-white">{totalLeads}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-amber-300/80">New</p>
              <p className="text-2xl font-semibold text-amber-300">{statusCounts.new}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-emerald-300/80">Converted</p>
              <p className="text-2xl font-semibold text-emerald-300">{statusCounts.converted}</p>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-rose-300/80">Lost</p>
              <p className="text-2xl font-semibold text-rose-300">{statusCounts.lost}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-semibold text-white">{conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-emerald-300">+{Math.abs(conversionRateDelta).toFixed(1)}% this month</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">Avg. Response</p>
              <p className="text-2xl font-semibold text-white">&lt; 30s</p>
              <p className="text-xs text-gray-400">Kaira never sleeps</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">Top Channels</p>
              <p className="text-2xl font-semibold text-white">{topChannel.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Lead Sources</p>
          <div className="space-y-2">
            {sources.map((source) => {
              const width = sourcesTotal ? Math.round((source.count / sourcesTotal) * 100) : 0;
              const colorClass = SOURCE_COLORS[source.name?.toLowerCase()] || SOURCE_COLORS.other;
              return (
                <div key={source.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-base text-gray-300">{source.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span className={`block h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right text-base font-semibold text-white">{source.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Channels</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
              <PhoneIcon />
            </span>
            <div>
              <p className="text-2xl font-semibold text-white">{channels.phone}</p>
              <p className="text-sm text-gray-400">Phone</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
              <WhatsAppIcon />
            </span>
            <div>
              <p className="text-2xl font-semibold text-white">{channels.whatsapp}</p>
              <p className="text-sm text-gray-400">WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsOverviewCard;
