const StatCard = ({
  title,
  value,
  subtitle = '',
  badge = '',
  cardClass = '',
  valueClass = '',
}) => {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-2xl ${cardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <h3 className={`mt-3 text-3xl font-bold ${valueClass || 'text-slate-900'}`}>
            {value}
          </h3>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          ) : null}
        </div>

        {badge ? (
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;