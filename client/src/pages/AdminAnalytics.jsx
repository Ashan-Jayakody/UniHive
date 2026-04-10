import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';

const API_BASE = 'http://localhost:5000/api/admin/analytics';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response. Preview: ${text.slice(0, 120)}`);
      }

      const result = JSON.parse(text);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load administrative analytics');
      }

      setData(result);
    } catch (error) {
      console.error('Admin analytics fetch error:', error);
      showToast('error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const overview = data?.overview || {};
  const latestUsers = data?.latestUsers || [];
  const latestThreads = data?.latestThreads || [];

  const stats = [
    {
      title: 'Total Users',
      value: loading ? '...' : overview.totalUsers ?? 0,
      subtitle: 'Registered user accounts across the platform.',
      badge: 'Users',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Total Threads',
      value: loading ? '...' : overview.totalThreads ?? 0,
      subtitle: 'Academic discussions created by users.',
      badge: 'Threads',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Total Replies',
      value: loading ? '...' : overview.totalReplies ?? 0,
      subtitle: 'Community response activity across discussions.',
      badge: 'Replies',
      cardClass: 'bg-slate-100 ring-1 ring-slate-200',
      valueClass: 'text-slate-900',
    },
    {
      title: 'Saved Discussions',
      value: loading ? '...' : overview.totalSavedThreads ?? 0,
      subtitle: 'Bookmarked discussion references by users.',
      badge: 'Saved',
      cardClass: 'bg-indigo-50 ring-1 ring-indigo-100',
      valueClass: 'text-indigo-700',
    },
  ];

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
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

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader
          title="Administrative Analytics"
          subtitle="Review platform-wide engagement, account distribution, activity patterns, and recent operational records through a consolidated analytics workspace."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard eyebrow="User Analytics" title="Account and Role Distribution">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading analytics...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Students</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">{overview.totalStudents ?? 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Faculty Members</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">{overview.totalFaculty ?? 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Administrators</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{overview.totalAdmins ?? 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Active Accounts</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">{overview.activeUsers ?? 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Deactivated</p>
                  <p className="mt-2 text-3xl font-bold text-yellow-700">{overview.deactivatedUsers ?? 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Suspended</p>
                  <p className="mt-2 text-3xl font-bold text-orange-700">{overview.suspendedUsers ?? 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm text-slate-500">Banned Accounts</p>
                  <p className="mt-2 text-3xl font-bold text-red-700">{overview.bannedUsers ?? 0}</p>
                </div>
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Platform Insights" title="Engagement Overview">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading insights...
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Most Active Discussion Topic</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-700">{overview.mostActiveTopic || 'N/A'}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Total threads in this topic: {overview.mostActiveTopicCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Reply-to-Thread Ratio</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {overview.totalThreads
                      ? `${((overview.totalReplies || 0) / overview.totalThreads).toFixed(2)} replies per thread`
                      : '0.00 replies per thread'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Saved Discussion Usage</p>
                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {overview.totalSavedThreads ?? 0} total saves
                  </p>
                </div>
              </div>
            )}
          </PanelCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard eyebrow="Recent Users" title="Recently Registered Accounts">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading recent users...
              </div>
            ) : latestUsers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                No recent user records are available.
              </div>
            ) : (
              <div className="grid gap-4">
                {latestUsers.map((user) => (
                  <div key={user._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-slate-900">{user.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(user.status || 'active')}`}>
                        {user.status || 'active'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {user.role}
                      </span>

                      {user.faculty ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {user.faculty}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-xs text-slate-500">Registered: {formatDate(user.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Recent Discussions" title="Latest Communication Records">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                Loading recent discussions...
              </div>
            ) : latestThreads.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                No discussion records are available.
              </div>
            ) : (
              <div className="grid gap-4">
                {latestThreads.map((thread) => (
                  <div key={thread._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {thread.topic}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {(thread.replies || []).length} replies
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{thread.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">Created by {thread.author}</p>
                    <p className="mt-3 text-xs text-slate-500">Posted: {formatDate(thread.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;