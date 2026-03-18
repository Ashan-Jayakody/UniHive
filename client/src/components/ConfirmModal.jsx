const ConfirmModal = ({
  open,
  title = 'Confirm Action',
  message = 'Please confirm whether you would like to continue.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmType = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const confirmButtonClass =
    confirmType === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700';

  const statusLabel =
    confirmType === 'danger' ? 'Important Confirmation' : 'Confirmation Required';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
          {statusLabel}
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof onCancel === 'function') onCancel();
            }}
            disabled={loading}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof onConfirm === 'function') onConfirm();
            }}
            disabled={loading}
            className={`flex-1 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${confirmButtonClass}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;