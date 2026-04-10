import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

<<<<<<< HEAD
const API_BASE = 'http://localhost:5000/api/auth';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,99}$/;
=======
const API_BASE = 'http://localhost:8000/api/auth';
>>>>>>> feature-minoli

const facultyOptions = ['Computing', 'Engineering', 'Business', 'Humanities'];

const courseMap = {
  Computing: ['Software Engineering', 'Computer Science', 'Cyber Security', 'Data Science'],
  Engineering: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'],
  Business: ['Business Administration', 'Accounting', 'Finance', 'Marketing'],
  Humanities: ['Psychology', 'English', 'International Relations'],
};

const academicYearOptions = ['1', '2', '3', '4'];

const capitalizeName = (value) => {
  if (typeof value !== 'string') return '';

  return value
    .trimStart()
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split(/([-'])/)
        .map((part) =>
          part === '-' || part === "'"
            ? part
            : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join('')
    )
    .join(' ');
};

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

  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

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

  const availableCourses = formData.faculty ? courseMap[formData.faculty] || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updated = {
      ...formData,
      [name]:
        name === 'email'
          ? value.trimStart().toLowerCase()
          : name === 'name'
          ? capitalizeName(value)
          : value,
    };

    if (name === 'role') {
      if (value === 'admin') {
        updated.faculty = '';
        updated.course = '';
        updated.academicYear = '';
      } else if (value === 'faculty') {
        updated.course = '';
        updated.academicYear = '';
      }
    }

    if (name === 'faculty') {
      updated.course = '';
    }

    setFormData(updated);
  };

  const validateRegisterForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const role = formData.role;
    const faculty = formData.faculty;
    const course = formData.course;
    const academicYear = formData.academicYear;

    if (!name) {
      return 'Full name is required.';
    }

    if (!NAME_REGEX.test(name)) {
      return 'Please enter a valid full name using letters only.';
    }

    if (!email) {
      return 'Email address is required.';
    }

    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Password is required.';
    }

    if (!PASSWORD_REGEX.test(password)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
    }

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return 'Please select a valid role.';
    }

    if (role !== 'admin' && !faculty) {
      return 'Faculty is required.';
    }

    if (role !== 'admin' && faculty && !facultyOptions.includes(faculty)) {
      return 'Please select a valid faculty.';
    }

    if (role === 'student') {
      if (!academicYear) {
        return 'Academic year is required for students.';
      }

      if (!academicYearOptions.includes(String(academicYear))) {
        return 'Please select a valid academic year.';
      }

      if (!course) {
        return 'Course is required for students.';
      }

      const validCourses = courseMap[faculty] || [];
      if (!validCourses.includes(course)) {
        return 'Please select a valid course for the selected faculty.';
      }
    }

    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const validationError = validateRegisterForm();
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setLoading(true);
      setVerificationToken('');

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        faculty: formData.role === 'admin' ? '' : formData.faculty,
        course: formData.role === 'student' ? formData.course : '',
        academicYear: formData.role === 'student' ? formData.academicYear : '',
      };

      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create account');
      }

      setVerificationToken(data.emailVerificationToken || '');

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

      showToast('success', 'Account created successfully. Please verify your email address.');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-green-50 px-4 py-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl lg:grid lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-green-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              New Account Registration
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-tight">
              Create your UniHive account through a structured academic registration process.
            </h1>
            <p className="mt-6 text-base leading-8 text-blue-50">
              Register as a student, faculty member, or administrator using a role-based workflow
              designed for consistent academic identity management.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              Role-based academic registration
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              Structured faculty, course, and year selection
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              Integrated verification and account security
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <Link to="/" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Back to Home
          </Link>

          <h2 className="mt-6 text-3xl font-bold text-slate-900">Create Your UniHive Account</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Complete the registration form below to create your academic account and gain access to the platform.
          </p>

          <div className="mt-5 inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            Role-based registration workflow
          </div>

          <form onSubmit={handleRegister} className="mt-8 grid gap-5" noValidate>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputStyle}
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                  placeholder="Create a secure password"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use at least 8 characters with uppercase, lowercase, and a number.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className={inputStyle}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {formData.role !== 'admin' && (
              <div className={formData.role === 'student' ? 'grid gap-5 md:grid-cols-2' : 'grid gap-5'}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Faculty</label>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    className={inputStyle}
                    required={formData.role !== 'admin'}
                  >
                    <option value="">Select faculty</option>
                    {facultyOptions.map((faculty) => (
                      <option key={faculty} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.role === 'student' && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Academic Year</label>
                    <select
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleChange}
                      className={inputStyle}
                      required={formData.role === 'student'}
                    >
                      <option value="">Select academic year</option>
                      {academicYearOptions.map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {formData.role === 'student' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className={inputStyle}
                  required={formData.role === 'student'}
                  disabled={!formData.faculty}
                >
                  <option value="">
                    {formData.faculty ? 'Select course' : 'Select faculty first'}
                  </option>
                  {availableCourses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">Administrator account configuration</p>
                <p className="mt-2">
                  Administrator accounts do not require faculty, course, or academic year details during registration.
                </p>
              </div>
            )}

            {verificationToken && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
                <p className="font-semibold">Verification token generated successfully.</p>
                <p className="mt-2 break-all">
                  Token: <span className="font-mono">{verificationToken}</span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-500">Already have an account? </span>
            <Link to="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;