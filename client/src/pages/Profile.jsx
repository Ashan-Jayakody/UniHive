import { useEffect, useMemo, useState } from 'react';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';
import ExpertMatch from '../components/ExpertMatch';

const USER_API_BASE = 'http://localhost:8000/api/users';
const THREAD_API_BASE = 'http://localhost:8000/api/threads';
const PEER_TUTORING_API_BASE = 'http://localhost:8000/api/peer-tutoring';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [myThreads, setMyThreads] = useState([]);
  const [myRepliedThreads, setMyRepliedThreads] = useState([]);
  const [savedThreads, setSavedThreads] = useState([]);
  const [myPeerTutoringSessions, setMyPeerTutoringSessions] = useState([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const [threadsRes, repliedRes, savedRes, tutoringRes] = await Promise.all([
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
        fetch(`${PEER_TUTORING_API_BASE}/mine`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const threadsData = await threadsRes.json();
      const repliedData = await repliedRes.json();
      const savedData = await savedRes.json();
      const tutoringData = await tutoringRes.json();

      if (!threadsRes.ok) throw new Error(threadsData.message || 'Unable to load your published discussions');
      if (!repliedRes.ok) throw new Error(repliedData.message || 'Unable to load your participation history');
      if (!savedRes.ok) throw new Error(savedData.message || 'Unable to load saved discussions');
      if (!tutoringRes.ok) throw new Error(tutoringData.message || 'Unable to load your tutoring sessions');

      setMyThreads(Array.isArray(threadsData) ? threadsData : []);
      setMyRepliedThreads(Array.isArray(repliedData) ? repliedData : []);
      setSavedThreads(Array.isArray(savedData) ? savedData : []);
      setMyPeerTutoringSessions(Array.isArray(tutoringData.sessions) ? tutoringData.sessions : []);
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file');
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No login token found');
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        expertiseAreas: formData.expertiseAreas,
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

  const totalRepliesMade = useMemo(() => {
    return myRepliedThreads.reduce((sum, item) => sum + (item.myReplies?.length || 0), 0);
  }, [myRepliedThreads]);

  const statCards = [
    {
      title: 'Published Discussions',
      value: loadingActivity ? '...' : myThreads.length,
      subtitle: 'Discussion records created under your account.',
      badge: 'Created',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Replies Submitted',
      value: loadingActivity ? '...' : totalRepliesMade,
      subtitle: 'Total replies contributed across discussions.',
      badge: 'Participation',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Saved Discussions',
      value: loadingActivity ? '...' : savedThreads.length,
      subtitle: 'Discussion records retained for future reference.',
      badge: 'Saved',
      cardClass: 'bg-slate-100 ring-1 ring-slate-200',
      valueClass: 'text-slate-900',
    },
    {
      title: 'My Tutoring Sessions',
      value: loadingActivity ? '...' : myPeerTutoringSessions.length,
      subtitle: 'Sessions you have created or are managing.',
      badge: 'Tutoring',
      cardClass: 'bg-violet-50 ring-1 ring-violet-100',
      valueClass: 'text-violet-700',
    },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard eyebrow="Profile Summary" title="Account Summary">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading profile information...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Profile Image</p>
                  <div className="mt-3 flex items-center gap-4">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Profile avatar"
                        className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-3xl font-bold text-white">
                        {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <p className="text-sm text-slate-600">
                      This image is displayed across your personal profile and platform header.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(profile?.name)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Email Address</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(profile?.email)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(formatRole(profile?.role))}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Account Status</p>
                  <div className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(profile?.status || 'active')}`}>
                      {profile?.status || 'active'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Faculty</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(profile?.faculty)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Course</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(profile?.course)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Academic Year</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(profile?.academicYear)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Saved Discussions</p>
                  <p className="mt-1 font-semibold text-slate-900">{savedThreads.length}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
  <p className="text-sm text-slate-500">Expertise Areas</p>
  <p className="mt-1 font-semibold text-slate-900">
    {profile?.expertiseAreas?.length
      ? profile.expertiseAreas.join(', ')
      : '-'}
  </p>
</div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Helper Badge</p>
                  <div className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getYesNoBadge(profile?.helperBadge)}`}>
                      {profile?.helperBadge ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Email Verified</p>
                  <div className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getYesNoBadge(profile?.emailVerified)}`}>
                      {profile?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Phone Verified</p>
                  <div className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getYesNoBadge(profile?.phoneVerified)}`}>
                      {profile?.phoneVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Account Created</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDate(profile?.createdAt)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Last Updated</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDate(profile?.updatedAt)}</p>
                </div>
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Update Profile" title="Update Profile Information">
            <form onSubmit={handleUpdateProfile} className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Profile Image</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center gap-4">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-3xl font-bold text-white">
                        {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={saving || loading}
                        className="block text-sm text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={saving || loading}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Select a clear image suitable for display across your UniHive profile.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={saving || loading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={saving || loading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank if no password update is required"
                  disabled={saving || loading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Expertise Areas
  </label>
<input
  type="text"
  name="expertiseAreas"
  value={expertiseInput}
  onChange={(e) => {
    setExpertiseInput(e.target.value);
    setFormData((prev) => ({
      ...prev,
      expertiseAreas: e.target.value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== ''),
    }));
  }}
  placeholder="e.g. React, Node.js, Java"
  disabled={saving || loading}
  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
/>
</div>
              
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-700">Read-only account information</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Role, status, verification fields, and academic information are displayed from your current account record and are not edited from this section.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </PanelCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard eyebrow="Published Discussions" title="Your Published Discussions">
            {loadingActivity ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading discussion records...
              </div>
            ) : myThreads.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                No published discussions are currently associated with your account.
              </div>
            ) : (
              <div className="grid gap-4">
                {myThreads.map((thread) => (
                  <div key={thread._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {thread.topic}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {thread.replies?.length || 0} replies
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{thread.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{thread.content}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      Published: {formatDate(thread.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Participation History" title="Discussions You Participated In">
            {loadingActivity ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading participation records...
              </div>
            ) : myRepliedThreads.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                No participation records are currently available.
              </div>
            ) : (
              <div className="grid gap-4">
                {myRepliedThreads.map((thread) => (
                  <div key={thread._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        {thread.topic}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {thread.myReplies?.length || 0} of your replies
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{thread.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">Discussion author: {thread.author}</p>

                    <div className="mt-3 grid gap-2">
                      {(thread.myReplies || []).map((reply) => (
                        <div key={reply._id} className="rounded-xl bg-white px-3 py-3">
                          <p className="text-sm leading-7 text-slate-700">{reply.text}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Submitted: {formatDate(reply.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Latest activity: {formatDate(thread.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>

        <PanelCard eyebrow="Saved Discussions" title="Saved Discussions">
          {loadingActivity ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              Loading saved discussions...
            </div>
          ) : savedThreads.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              No saved discussions are currently available in your account.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedThreads.map((thread) => (
                <div key={thread._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {thread.topic}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {thread.replies?.length || 0} replies
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">{thread.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Discussion author: {thread.author}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{thread.content}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Latest activity: {formatDate(thread.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard eyebrow="Tutoring Sessions" title="My Tutoring Sessions">
          {loadingActivity ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              Loading tutoring sessions...
            </div>
          ) : myPeerTutoringSessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              You have not created any tutoring sessions yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {myPeerTutoringSessions.map((session) => (
                <div key={session._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                      {session.approvalStatus || 'pending'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {new Date(session.date).toLocaleDateString()} • {session.time}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{session.moduleName}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{session.description}</p>
                  <p className="mt-3 text-xs text-slate-500">Maximum students: {session.maxStudents}</p>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
};

export default Profile;