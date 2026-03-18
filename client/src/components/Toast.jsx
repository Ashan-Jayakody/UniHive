import { useEffect } from 'react';

const Toast = ({ show, type = 'success', message = '', onClose }) => {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      if (typeof onClose === 'function') {
        onClose();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  const styles = {
    success: {
      container: 'border-green-200 bg-green-50 text-green-700',
      icon: '✓',
      label: 'Success',
    },
    error: {
      container: 'border-red-200 bg-red-50 text-red-700',
      icon: '✕',
      label: 'Error',
    },
    warning: {
      container: 'border-yellow-200 bg-yellow-50 text-yellow-700',
      icon: '!',
      label: 'Warning',
    },
    info: {
      container: 'border-blue-200 bg-blue-50 text-blue-700',
      icon: 'i',
      label: 'Information',
    },
  };

  const current = styles[type] || styles.success;

  return (
    <div className="fixed right-5 top-5 z-[9999] w-full max-w-md">
      <div
        className={`flex items-start justify-between gap-3 rounded-2xl border px-5 py-4 shadow-lg ${current.container}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg font-bold">
            {current.icon}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">
              {current.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof onClose === 'function') {
              onClose();
            }
          }}
          className="text-lg font-bold opacity-70 transition hover:opacity-100"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;