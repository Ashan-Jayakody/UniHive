import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const API_BASE = 'http://localhost:8000/api/auth';

const ResetPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    token: '',
    password: '',
    confirmPassword: '',
  });

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('error', 'The passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: formData.token, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reset password');
      }

      showToast('success', 'Password updated successfully');

      setTimeout(() => {
        navigate('/login');
      }, 1200);
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
          Account Recovery
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Reset Password</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Enter the reset token and set a new password to restore access to your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Reset Token</label>
            <textarea
              name="token"
              value={formData.token}
              onChange={handleChange}
              required
              rows="3"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Paste the reset token here"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
              placeholder="Enter a new password"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
              placeholder="Re-enter the new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6">
          <Link to="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;