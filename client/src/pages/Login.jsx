import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setSuccess('Login successful. Redirecting to dashboard...');

      setTimeout(() => {
        navigate('/dashboard');
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-2xl shadow-slate-200 backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12">
          <div className="max-w-md">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
              UniHive Access
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Welcome back to your academic workspace.
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-300">
              Sign in to access your account, continue with your role-based portal experience, and manage platform features through a secure professional interface.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                'Secure user authentication',
                'Role-based access control',
                'Streamlined portal experience',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <Link to="/" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                ← Back to Home
              </Link>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Sign In</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your university account details to continue.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Logging in...' : 'Login to UniHive'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don’t have an account?{' '}
              <Link to="/register" className="font-semibold text-green-700 hover:text-green-800">
                Create one now
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;