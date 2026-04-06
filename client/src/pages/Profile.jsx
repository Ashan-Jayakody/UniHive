import { useEffect, useMemo, useState } from 'react';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';
import ExpertMatch from '../components/ExpertMatch';

const USER_API_BASE = 'http://localhost:5000/api/users';
const THREAD_API_BASE = 'http://localhost:5000/api/threads';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,99}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const parseExpertiseAreas = (value) => {
  if (!value) return [];

  const cleaned = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);

  return cleaned.slice(0, 10);
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [myThreads, setMyThreads] = useState([]);
  const [myRepliedThreads, setMyRepliedThreads] = useState([]);
  const [savedThreads, setSavedThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    avatar: '',
    expertiseAreas: [],
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    expertiseAreas: '',
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

  useEffect(() => {
    fetchProfile();
    fetchActivity();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No login token found');
      }

      const response = await fetch(`${USER_API_BASE}/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load profile information');
      }

      setProfile(data);
      setAvatarPreview(data.avatar || '');
      setFormData({
        name: data.name || '',
        email: data.email || '',
        password: '',
        avatar: data.avatar || '',
        expertiseAreas: Array.isArray(data.expertiseAreas) ? data.expertiseAreas : [],
      });
      setExpertiseInput(Array.isArray(data.expertiseAreas) ? data.expertiseAreas.join(', ') : '');
      setFormErrors({
        name: '',
        email: '',
        password: '',
        expertiseAreas: '',
      });
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setLoadingActivity(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No login token found');
      }

      const [threadsRes, repliedRes, savedRes] = await Promise.all([
        fetch(`${THREAD_API_BASE}/mine`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${THREAD_API_BASE}/replied`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${THREAD_API_BASE}/saved`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const threadsData = await threadsRes.json();
      const repliedData = await repliedRes.json();
      const savedData = await savedRes.json();

      if (!threadsRes.ok) throw new Error(threadsData.message || 'Unable to load your published discussions');
      if (!repliedRes.ok) throw new Error(repliedData.message || 'Unable to load your participation history');
      if (!savedRes.ok) throw new Error(savedData.message || 'Unable to load saved discussions');

      setMyThreads(Array.isArray(threadsData) ? threadsData : []);
      setMyRepliedThreads(Array.isArray(repliedData) ? repliedData : []);
      setSavedThreads(Array.isArray(savedData) ? savedData : []);
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoadingActivity(false);
    }
  };

  const getNameError = (value) => {
    const cleanValue = sanitizeText(value);

    if (!cleanValue) return 'Full name is required.';
    if (!NAME_REGEX.test(cleanValue)) return 'Please enter a valid full name.';
    return '';
  };

  const getEmailError = (value) => {
    const cleanValue = sanitizeText(value).toLowerCase();

    if (!cleanValue) return 'Email address is required.';
    if (!EMAIL_REGEX.test(cleanValue)) return 'Please enter a valid email address.';
    return '';
  };

  const getPasswordError = (value) => {
    if (!value) return '';
    if (!PASSWORD_REGEX.test(value)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
    }
    return '';
  };

  const getExpertiseError = (value) => {
    const expertiseAreas = parseExpertiseAreas(value);
    if (expertiseAreas.some((item) => item.length > 40)) {
      return 'Each expertise area must be 40 characters or less.';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const normalizedValue = name === 'email' ? value.trimStart() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));

    if (name === 'name') {
      setFormErrors((prev) => ({ ...prev, name: getNameError(normalizedValue) }));
    }

    if (name === 'email') {
      setFormErrors((prev) => ({ ...prev, email: getEmailError(normalizedValue) }));
    }

    if (name === 'password') {
      setFormErrors((prev) => ({ ...prev, password: getPasswordError(normalizedValue) }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      showToast('error', 'Image size must be 2 MB or less');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      setFormData((prev) => ({
        ...prev,
        avatar: base64String,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setFormData((prev) => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleExpertiseChange = (e) => {
    const value = e.target.value;

    setExpertiseInput(value);
    setFormData((prev) => ({
      ...prev,
      expertiseAreas: parseExpertiseAreas(value),
    }));
    setFormErrors((prev) => ({
      ...prev,
      expertiseAreas: getExpertiseError(value),
    }));
  };

  const validateProfileForm = () => {
    const currentErrors = {
      name: getNameError(formData.name),
      email: getEmailError(formData.email),
      password: getPasswordError(formData.password),
      expertiseAreas: getExpertiseError(expertiseInput),
    };

    setFormErrors(currentErrors);

    if (
      currentErrors.name ||
      currentErrors.email ||
      currentErrors.password ||
      currentErrors.expertiseAreas
    ) {
      return 'Please fix the highlighted profile form errors.';
    }

    return null;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const validationError = validateProfileForm();
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No login token found');
      }

      const payload = {
        name: sanitizeText(formData.name),
        email: sanitizeText(formData.email).toLowerCase(),
        avatar: formData.avatar,
        expertiseAreas: parseExpertiseAreas(expertiseInput),
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const response = await fetch(`${USER_API_BASE}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile information');
      }

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...parsedUser,
            name: data.name,
            email: data.email,
            role: data.role || parsedUser.role,
            status: data.status || parsedUser.status || 'active',
            avatar: data.avatar || '',
            emailVerified: data.emailVerified ?? parsedUser.emailVerified,
            phoneVerified: data.phoneVerified ?? parsedUser.phoneVerified,
          })
        );
      }

      setFormData((prev) => ({
        ...prev,
        password: '',
        expertiseAreas: parseExpertiseAreas(expertiseInput),
      }));
      setFormErrors((prev) => ({
        ...prev,
        password: '',
      }));

      await fetchProfile();
      showToast('success', 'Profile information updated successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatRole = (role) => {
    if (role === 'student') return 'Student';
    if (role === 'faculty') return 'Faculty';
    if (role === 'admin') return 'Administrator';
    return role || '-';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-green-50 text-green-700';
    if (status === 'deactivated') return 'bg-yellow-50 text-yellow-700';
    if (status === 'suspended') return 'bg-orange-50 text-orange-700';
    if (status === 'banned') return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getYesNoBadge = (value) => {
    return value ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600';
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return value;
  };

  const activityStats = useMemo(
    () => [
      {
        title: 'Published Discussions',
        value: myThreads.length,
        subtitle: 'Topics you have created within the academic communication module.',
        badge: 'Threads',
        cardClass: 'bg-blue-50 ring-1 ring-blue-100',
        valueClass: 'text-blue-700',
      },
      {
        title: 'Participated Discussions',
        value: myRepliedThreads.length,
        subtitle: 'Discussion threads where you contributed replies.',
        badge: 'Replies',
        cardClass: 'bg-green-50 ring-1 ring-green-100',
        valueClass: 'text-green-700',
      },
      {
        title: 'Saved Discussions',
        value: savedThreads.length,
        subtitle: 'Threads you bookmarked for later reference.',
        badge: 'Saved',
        cardClass: 'bg-purple-50 ring-1 ring-purple-100',
        valueClass: 'text-purple-700',
      },
    ],
    [myThreads.length, myRepliedThreads.length, savedThreads.length]
  );

  if (loading) {
    return (
      <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg">
            <p className="text-base font-semibold text-slate-700">Loading profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                Profile Workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                Personal Profile and Academic Identity
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Review your account status, maintain profile information, manage your avatar, and
                track your academic communication activity from one place.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Account Snapshot
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">{profile?.name || '-'}</p>
              <p className="mt-1 text-sm text-slate-600">{profile?.email || '-'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {activityStats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <PanelCard eyebrow="Account Summary" title="Profile Overview">
            <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile avatar"
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-4xl font-bold text-white shadow-lg">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}

                  <p className="mt-4 text-lg font-bold text-slate-900">{displayValue(profile?.name)}</p>
                  <p className="mt-1 text-sm text-slate-600">{displayValue(profile?.email)}</p>
                  <p className="mt-3 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {formatRole(profile?.role)}
                  </p>

                  <div className="mt-5 grid w-full gap-3">
                    <label className="cursor-pointer rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                      Upload New Avatar
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>

                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Remove Avatar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Account Status
                  </p>
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(profile?.status)}`}>
                      {displayValue(profile?.status)}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Helper Badge
                  </p>
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getYesNoBadge(profile?.helperBadge)}`}>
                      {profile?.helperBadge ? 'Enabled' : 'Not Available'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Email Verification
                  </p>
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getYesNoBadge(profile?.emailVerified)}`}>
                      {profile?.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Phone Verification
                  </p>
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getYesNoBadge(profile?.phoneVerified)}`}>
                      {profile?.phoneVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Faculty
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{displayValue(profile?.faculty)}</p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Course
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{displayValue(profile?.course)}</p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Academic Year
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{displayValue(profile?.academicYear)}</p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Reward Points
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{displayValue(profile?.points)}</p>
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard eyebrow="Profile Maintenance" title="Update Profile Information">
            <form onSubmit={handleUpdateProfile} className="grid gap-5" noValidate>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.name
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.email
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep your current password"
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.password
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.password ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.password}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Enter a new password only if you want to update it.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Areas of Expertise
                </label>
                <input
                  name="expertiseAreas"
                  value={expertiseInput}
                  onChange={handleExpertiseChange}
                  placeholder="Example: Web Development, React, Node.js"
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.expertiseAreas
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.expertiseAreas ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.expertiseAreas}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Separate multiple expertise areas with commas.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </PanelCard>
        </div>

        <PanelCard eyebrow="Expert Discovery" title="Expert Matching and Suggested Collaborators">
          <ExpertMatch />
        </PanelCard>

        <div className="grid gap-6 xl:grid-cols-3">
          <PanelCard eyebrow="Personal Activity" title="Published Discussions">
            {loadingActivity ? (
              <p className="text-sm text-slate-600">Loading discussion history...</p>
            ) : myThreads.length === 0 ? (
              <p className="text-sm text-slate-600">You have not published any discussions yet.</p>
            ) : (
              <div className="space-y-4">
                {myThreads.slice(0, 5).map((thread) => (
                  <div key={thread._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <p className="text-base font-semibold text-slate-900">{thread.title}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                      {thread.topic}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{thread.content}</p>
                    <p className="mt-3 text-xs text-slate-500">Created: {formatDate(thread.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Participation" title="Discussions with Your Replies">
            {loadingActivity ? (
              <p className="text-sm text-slate-600">Loading participation history...</p>
            ) : myRepliedThreads.length === 0 ? (
              <p className="text-sm text-slate-600">You have not replied to any discussions yet.</p>
            ) : (
              <div className="space-y-4">
                {myRepliedThreads.slice(0, 5).map((thread) => (
                  <div key={thread._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <p className="text-base font-semibold text-slate-900">{thread.title}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                      {thread.topic}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{thread.content}</p>
                    <p className="mt-3 text-xs text-slate-500">Latest update: {formatDate(thread.updatedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Saved Content" title="Bookmarked Discussions">
            {loadingActivity ? (
              <p className="text-sm text-slate-600">Loading saved discussions...</p>
            ) : savedThreads.length === 0 ? (
              <p className="text-sm text-slate-600">You do not have any saved discussions yet.</p>
            ) : (
              <div className="space-y-4">
                {savedThreads.slice(0, 5).map((thread) => (
                  <div key={thread._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <p className="text-base font-semibold text-slate-900">{thread.title}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
                      {thread.topic}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{thread.content}</p>
                    <p className="mt-3 text-xs text-slate-500">Saved item created: {formatDate(thread.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>

        <PanelCard eyebrow="Security and Access Records" title="Recent Login History">
          {Array.isArray(profile?.loginHistory) && profile.loginHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse overflow-hidden rounded-[1.5rem]">
                <thead>
                  <tr className="bg-slate-100 text-left text-sm font-semibold text-slate-700">
                    <th className="px-4 py-3">Login Time</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.loginHistory.slice(0, 10).map((entry, index) => (
                    <tr key={index} className="border-b border-slate-100 bg-white text-sm text-slate-600 last:border-b-0">
                      <td className="px-4 py-3">{formatDate(entry.loginAt)}</td>
                      <td className="px-4 py-3">{displayValue(entry.device)}</td>
                      <td className="px-4 py-3">{displayValue(entry.ipAddress)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No login history is currently available.</p>
          )}
        </PanelCard>
      </div>
    </div>
  );
};

export default Profile;