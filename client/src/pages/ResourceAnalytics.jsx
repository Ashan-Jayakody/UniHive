import { useEffect, useMemo, useState } from 'react';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';

const API_BASE = 'http://localhost:8000/api/resources/analytics';

const ResourceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const showToast = (type, message) => setToast({ show: true, type, message });
  const closeToast = () => setToast({ show: false, type: 'success', message: '' });

  const fetchAnalytics = async (selectedDays = days) => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}?days=${selectedDays}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to load resource analytics');
      }

      setData(result.data || null);
    } catch (error) {
      showToast('error', error.message || 'Failed to load resource analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const overview = data?.overview || {};
  const byCategory = data?.distribution?.byCategory || [];
  const topSubjects = data?.distribution?.topSubjects || [];
  const topUploaders = data?.topUploaders || [];
  const rejectionReasons = data?.moderation?.rejectionReasons || [];
  const pendingAging = data?.moderation?.pendingAging || {};
  const trend = data?.trend || [];

  const maxCategoryCount = useMemo(() => {
    if (!byCategory.length) return 1;
    return Math.max(...byCategory.map((x) => x.count), 1);
  }, [byCategory]);

  const maxTrendUploads = useMemo(() => {
    if (!trend.length) return 1;
    return Math.max(...trend.map((x) => x.uploads), 1);
  }, [trend]);

  const stats = [
    {
      title: 'Total Uploads',
      value: loading ? '...' : overview.totalUploads ?? 0,
      subtitle: 'All submitted resources.',
      badge: 'Uploads',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Approval Rate',
      value: loading ? '...' : `${overview.approvalRate ?? 0}%`,
      subtitle: 'Approved resources over total uploads.',
      badge: 'Quality',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Pending Queue',
      value: loading ? '...' : overview.pendingCount ?? 0,
      subtitle: 'Resources waiting for moderation.',
      badge: 'Queue',
      cardClass: 'bg-yellow-50 ring-1 ring-yellow-100',
      valueClass: 'text-yellow-700',
    },
    {
      title: 'Avg Review Time',
      value: loading ? '...' : `${overview.avgReviewHours ?? 0}h`,
      subtitle: 'Average moderation turnaround.',
      badge: 'SLA',
      cardClass: 'bg-indigo-50 ring-1 ring-indigo-100',
      valueClass: 'text-indigo-700',
    },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">UniHive Module</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Resource Sharing Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">Monitor uploads, moderation quality, and engagement patterns.</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              type="button"
              onClick={() => fetchAnalytics(days)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <PanelCard eyebrow="Trend" title="Uploads vs Approvals">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">Loading trend...</div>
            ) : trend.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">No trend data available.</div>
            ) : (
              <div className="space-y-2">
                {trend.map((item) => {
                  const width = `${(item.uploads / maxTrendUploads) * 100}%`;
                  return (
                    <div key={item.date} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{item.date}</span>
                        <span>Uploads {item.uploads} • Approved {item.approved}</span>
                      </div>
                      <div className="h-2 rounded bg-slate-100">
                        <div className="h-2 rounded bg-blue-500" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Distribution" title="Resource Categories">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">Loading categories...</div>
            ) : byCategory.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">No category data available.</div>
            ) : (
              <div className="space-y-3">
                {byCategory.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                      <span>{item.category}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded bg-slate-100">
                      <div
                        className="h-2 rounded bg-emerald-500"
                        style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <PanelCard eyebrow="Top Subjects" title="Most Uploaded Subjects">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : topSubjects.length === 0 ? (
              <p className="text-sm text-slate-500">No subject data available.</p>
            ) : (
              <div className="space-y-2">
                {topSubjects.map((item) => (
                  <div key={item.subject} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{item.subject}</p>
                    <p className="text-xs text-slate-500">{item.count} uploads</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Top Uploaders" title="Most Active Students">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : topUploaders.length === 0 ? (
              <p className="text-sm text-slate-500">No uploader data available.</p>
            ) : (
              <div className="space-y-2">
                {topUploaders.map((item) => (
                  <div key={item.uploaderId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.email || 'No email'} • {item.uploads} uploads</p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard eyebrow="Moderation" title="Rejection & Pending Health">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Pending less than 2 days</p>
                  <p className="text-xl font-bold text-green-700">{pendingAging.lessThan2Days ?? 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Pending 2 to 7 days</p>
                  <p className="text-xl font-bold text-yellow-700">{pendingAging.between2And7Days ?? 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Pending more than 7 days</p>
                  <p className="text-xl font-bold text-red-700">{pendingAging.moreThan7Days ?? 0}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Top Rejection Reasons</p>
                  {rejectionReasons.length === 0 ? (
                    <p className="text-xs text-slate-500">No rejection reasons available.</p>
                  ) : (
                    <div className="space-y-2">
                      {rejectionReasons.map((item) => (
                        <div key={item.reason} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <p className="text-xs text-slate-700">{item.reason}</p>
                          <p className="text-[11px] text-slate-500">{item.count} times</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </PanelCard>
        </div>
      </div>
    </div>
  );
};

export default ResourceAnalytics;