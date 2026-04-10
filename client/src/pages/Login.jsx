import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

<<<<<<< HEAD
const API_BASE = 'http://localhost:5000/api/auth';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
=======
const API_BASE = 'http://localhost:8000/api/auth';
>>>>>>> feature-minoli

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const showToast = (type, message) => {
    setToast({
      show: true,
      type,
      message,
    });
  };

  const closeToast = () => {
    setToast({
      show: false,
      type: 'success',
      message: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'email' ? value.trimStart() : value,
    }));
  };

  const validateLoginForm = () => {
    const email = formData.email.trim();
    const password = formData.password;

    if (!email && !password) {
      return 'Please enter your email address and password.';
    }

    if (!email) {
      return 'Email address is required.';
    }

    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address.';
    }

    if (!password.trim()) {
      return 'Password is required.';
    }

    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const validationError = validateLoginForm();
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          faculty: data.faculty || '',
          course: data.course || '',
          academicYear: data.academicYear || '',
          status: data.status || 'active',
          points: data.points ?? 0,
          helperBadge: data.helperBadge ?? false,
          emailVerified: data.emailVerified ?? false,
          phoneVerified: data.phoneVerified ?? false,
          avatar: data.avatar || '',
        })
      );

      if (
        data.status === 'deactivated' ||
        data.status === 'suspended' ||
        data.status === 'banned'
      ) {
        localStorage.setItem('blockedStatus', data.status);
        showToast('warning', `Your account is currently ${data.status}. Redirecting...`);

        setTimeout(() => {
          navigate('/blocked-account');
        }, 1000);

        return;
      }

      showToast('success', 'Sign-in completed successfully');

      setTimeout(() => {
        navigate('/dashboard');
      }, 900);
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-8 sm:px-6 lg:px-8">
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />

      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl backdrop-blur-sm lg:min-h-[700px] lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              UniHive Platform
            </p>

            <h1 className="mt-5 max-w-xl text-5xl font-bold leading-[1.15]">
              Welcome back to your academic collaboration environment.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-50/95">
              Sign in to access your dashboard, account profile, communication
              workspace, saved discussions, live notifications, and
              administrative tools.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold">Centralised academic experience</p>
              <p className="mt-2 text-sm leading-7 text-blue-50/95">
                Access discussions, notifications, profile tools, and platform
                services through one integrated workspace.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold">Secure role-based access</p>
              <p className="mt-2 text-sm leading-7 text-blue-50/95">
                UniHive supports controlled access for students, faculty members,
                and administrators.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold">Real-time academic updates</p>
              <p className="mt-2 text-sm leading-7 text-blue-50/95">
                Stay informed with live notifications, platform alerts, and
                communication activity as it happens.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-white/80 p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Account Access
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">
              Sign In to UniHive
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Enter your registered email address and password to continue to the
              platform.
            </p>

            <form onSubmit={handleLogin} className="mt-8 grid gap-5" noValidate>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your registered email address"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  Forgot Password?
                </Link>

                <Link
                  to="/register"
                  className="text-sm font-semibold text-slate-600 transition hover:text-slate-800"
                >
                  Create Account
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Important Note</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Please use the same registered email address and password associated
                with your UniHive account. If you no longer remember your password,
                use the password recovery option above.
              </p>
            </div>

            <div className="mt-6">
              <Link
                to="/"
                className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;