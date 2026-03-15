const PageHeader = ({ title, subtitle, actions, eyebrow = null }) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-gray-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
