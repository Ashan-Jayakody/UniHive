import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-green-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">
          Access Restricted
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">You do not have permission to access this page.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The requested page is available only to users with specific authorization levels.
          Please return to your dashboard or sign in with an account that has the required access.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/login"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;