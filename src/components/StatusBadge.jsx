import { toTitleCase } from '../utils/formatters.js';

const statusStyles = {
  accepted: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  confirmed: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  pending: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  new: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  canceled: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  default: 'bg-white/10 text-gray-200 border-white/15'
};

const StatusBadge = ({ status }) => {
  const key = status ? status.toLowerCase() : 'default';
  const className = statusStyles[key] || statusStyles.default;
  const label = status ? toTitleCase(status) : 'N/A';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
