import { useState } from 'react';
import { Link } from 'react-router-dom';
import Toast from '../components/Toast';

const API_BASE = 'http://localhost:5001/api/auth';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast({ show: false, type: 'success', message: '' });
  };

  const handleResend = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setGeneratedToken('');

      const response = await fetch(`${API_BASE}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to generate verification token');
      }

      setGeneratedToken(data.emailVerificationToken || '');
      showToast('success', 'Verification token generated successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-green-50 px-4 py-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
          Email Verification
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Request a New Verification Token</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Enter your registered email address to generate a new email verification token.
        </p>

        <form onSubmit={handleResend} className="mt-6 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter your registered email address"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Generating...' : 'Generate Verification Token'}
          </button>
        </form>

        {generatedToken && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Verification Token for Development Testing</p>
            <p className="mt-2 break-all text-sm text-slate-700">{generatedToken}</p>

            <Link
              to="/verify-email"
              className="mt-4 inline-block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Proceed to Email Verification
            </Link>
          </div>
        )}

        <div className="mt-6">
          <Link to="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;