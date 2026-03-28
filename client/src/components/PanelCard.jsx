const PanelCard = ({ eyebrow = '', title = '', children }) => {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur-sm sm:p-7">
      {(eyebrow || title) && (
        <div className="mb-5 border-b border-slate-200 pb-5">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          ) : null}
        </div>
      )}

      {children}
    </section>
  );
};

export default PanelCard;