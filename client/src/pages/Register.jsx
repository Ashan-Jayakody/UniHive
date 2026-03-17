import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import faculties from '../utils/faculties';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    faculty: '',
    course: '',
    academicYear: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedData = { ...formData, [name]: value };

    if (name === 'role') {
      if (value === 'admin') {
        updatedData = {
          ...updatedData,
          faculty: '',
          course: '',
          academicYear: '',
        };
      } else if (value === 'faculty') {
        updatedData = {
          ...updatedData,
          course: '',
          academicYear: '',
        };
      }
    }

    if (name === 'faculty') {
      updatedData.course = '';
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      let payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'student') {
        payload = {
          ...payload,
          faculty: formData.faculty,
          course: formData.course,
          academicYear: Number(formData.academicYear),
        };
      } else if (formData.role === 'faculty') {
        payload = {
          ...payload,
          faculty: formData.faculty,
        };
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Registration successful. Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const facultyOptions = Object.keys(faculties);
  const availableCourses = formData.faculty ? faculties[formData.faculty] : [];

  const inputStyle =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100';

  return (
    <div className="app-shell flex items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-2xl shadow-slate-200 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-green-600 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12">
          <div className="max-w-sm">
            <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              New Account Setup
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Join UniHive with a polished registration flow.
            </h1>
            <p className="mt-4 text-base leading-7 text-blue-50">
              Register students, faculty members, or admins with a cleaner form, better field hierarchy, and a professional academic look.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Role-based account creation',
                'Dynamic form fields by user role',
                'Structured registration experience',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/14 px-4 py-3 text-sm font-medium text-white/95 ring-1 ring-white/20"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link to="/" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                ← Back to Home
              </Link>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Create Account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete the form below to register for the platform.
              </p>
            </div>
            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Dynamic registration based on role
            </div>
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

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={inputStyle}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Academic Year</label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className={inputStyle}
                  >
                    <option value="" disabled>
                      Select academic year
                    </option>
                    {[1, 2, 3, 4].map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Faculty</label>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className={inputStyle}
                  >
                    <option value="" disabled>
                      Select faculty
                    </option>
                    {facultyOptions.map((faculty) => (
                      <option key={faculty} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    disabled={!formData.faculty || isSubmitting}
                    className={`${inputStyle} ${
                      !formData.faculty || isSubmitting ? 'text-slate-400' : ''
                    }`}
                  >
                    <option value="" disabled>
                      {formData.faculty ? 'Select course' : 'Select faculty first'}
                    </option>
                    {availableCourses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {formData.role === 'faculty' && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Faculty</label>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className={inputStyle}
                >
                  <option value="" disabled>
                    Select faculty
                  </option>
                  {facultyOptions.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Registering...' : 'Register Account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
              Sign in here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;