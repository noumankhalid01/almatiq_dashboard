const StatCard = ({ label, value, helper, icon, tone = 'default', className = '' }) => {
  const toneStyles = {
    default: 'bg-black/40 border-white/10',
    mint: 'bg-black/40 border-white/10',
    coral: 'bg-black/40 border-white/10'
  };

  return (
    <div
      className={[
        'flex flex-col gap-4 rounded-2xl border p-5 shadow-soft backdrop-blur',
        toneStyles[tone] || toneStyles.default,
        className
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{label}</p>
        {icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            {icon}
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-3xl font-semibold text-white">{value}</p>
        {helper ? <p className="mt-1 text-xs text-gray-400">{helper}</p> : null}
      </div>
    </div>
  );
};

export default StatCard;
