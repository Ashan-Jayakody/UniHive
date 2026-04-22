import { useState } from 'react';
import { Link } from 'react-router-dom';
import Toast from '../components/Toast';

const API_BASE = 'http://localhost:8000/api/auth';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

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

  const validateForm = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return 'Email address is required.';
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setLoading(true);
      setGeneratedToken('');

      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to generate reset token');
      }

      setGeneratedToken(data.resetToken || '');
      showToast('success', 'Password reset token generated successfully');
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
          Account Recovery
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Forgot Password</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Enter your registered email address to generate a password reset token for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trimStart())}
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
            {loading ? 'Generating...' : 'Generate Reset Token'}
          </button>
        </form>

        {generatedToken && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Reset Token for Development Testing</p>
            <p className="mt-2 break-all text-sm text-slate-700">{generatedToken}</p>
            <Link
              to="/reset-password"
              className="mt-4 inline-block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Proceed to Password Reset
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

export default ForgotPassword;