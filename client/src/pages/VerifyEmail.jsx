import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const API_BASE = 'http://localhost:5000/api/auth';

const VerifyEmail = () => {
  const navigate = useNavigate();

  const [token, setToken] = useState('');
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

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to verify email address');
      }

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...parsedUser,
            emailVerified: true,
          })
        );
      }

      showToast('success', 'Email address verified successfully');

      setTimeout(() => {
        navigate('/login');
      }, 1000);
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
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700">
          Email Verification
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Verify Email Address</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Paste the verification token below to confirm ownership of your registered email address.
        </p>

        <form onSubmit={handleVerify} className="mt-6 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Verification Token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              rows="4"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Paste the verification token here"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Verifying...' : 'Verify Email Address'}
          </button>
        </form>

        <div className="mt-6">
          <Link to="/resend-verification" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Request a new verification token
          </Link>
        </div>

        <div className="mt-3">
          <Link to="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;