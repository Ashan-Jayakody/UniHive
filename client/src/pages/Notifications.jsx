import { useEffect, useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import PanelCard from '../components/PanelCard';
import Toast from '../components/Toast';
import { socket } from '../socket';

const API_BASE = 'http://localhost:8000/api/notifications';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'read', label: 'Read' },
  { value: 'unread', label: 'Unread' },
];

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return {
        ...parsed,
        _id: parsed._id || parsed.id || '',
      };
    }

    const token = localStorage.getItem('token');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      _id: payload._id || payload.id || '',
      name: payload.name || 'User',
      email: payload.email || '',
      role: payload.role || '',
    };
  } catch {
    return null;
  }
};

const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return { message: text || 'Server error' };
};

const sanitizeText = (text) => (typeof text === 'string' ? text.trim() : '');

const getFieldError = (name, value) => {
  if (!value || !value.trim()) return `${name} is required`;
  return '';
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
};

const Notifications = () => {
  const token = localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [workingId, setWorkingId] = useState('');

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const [formErrors, setFormErrors] = useState({
    title: '',
    message: '',
    type: '',
  });

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || '';
  const isAdmin = currentUser?.role === 'admin';

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast({ show: false, type: 'success', message: '' });
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);

        const response = await fetch(API_BASE, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load notifications');
        }

        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        showToast('error', err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadNotifications();
    } else {
      setLoading(false);
      showToast('error', 'Please log in again');
    }
  }, [token]);

  useEffect(() => {
    if (!currentUserId) return;

    const join = () => socket.emit('join-user-room', currentUserId);
    join();
    socket.on('connect', join);

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    const handleUpdated = (payload) => {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === payload._id ? { ...item, read: payload.read } : item
        )
      );
    };

    const handleAllRead = () => {
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    };

    const handleDeleted = (payload) => {
      setNotifications((prev) => prev.filter((item) => item._id !== payload._id));
    };

    socket.on('notification:new', handleNew);
    socket.on('notification:updated', handleUpdated);
    socket.on('notification:all-read', handleAllRead);
    socket.on('notification:deleted', handleDeleted);

    return () => {
      socket.off('connect', join);
      socket.off('notification:new', handleNew);
      socket.off('notification:updated', handleUpdated);
      socket.off('notification:all-read', handleAllRead);
      socket.off('notification:deleted', handleDeleted);
    };
  }, [currentUserId]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.message?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'all' || item.type === typeFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' && item.read) ||
        (statusFilter === 'unread' && !item.read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, search, typeFilter, statusFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const validateForm = () => {
    const errors = {
      title: getFieldError('Title', formData.title),
      message: getFieldError('Message', formData.message),
      type: '',
    };

    setFormErrors(errors);

    return !errors.title && !errors.message;
  };

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    try {
      setPublishing(true);

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: sanitizeText(formData.title),
          message: sanitizeText(formData.message),
          type: formData.type,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish notification');
      }

      setFormData({
        title: '',
        message: '',
        type: 'info',
      });

      setFormErrors({
        title: '',
        message: '',
        type: '',
      });

      showToast('success', 'Notification published successfully');
    } catch (err) {
      showToast('error', err.message || 'Failed to publish notification');
    } finally {
      setPublishing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      setWorkingId(id);

      const response = await fetch(`${API_BASE}/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to mark as read');
    } finally {
      setWorkingId('');
    }
  };

  const handleDelete = async (id) => {
    try {
      setWorkingId(id);

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete notification');
      }

      setNotifications((prev) => prev.filter((item) => item._id !== id));
      showToast('success', 'Notification deleted');
    } catch (err) {
      showToast('error', err.message || 'Failed to delete notification');
    } finally {
      setWorkingId('');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);

      const response = await fetch(`${API_BASE}/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark all as read');
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      showToast('success', 'All notifications marked as read');
    } catch (err) {
      showToast('error', err.message || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'success') return 'bg-green-100 text-green-700';
    if (type === 'warning') return 'bg-yellow-100 text-yellow-700';
    if (type === 'error') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader
          title="Notifications"
          subtitle="Manage announcements, alerts, and notification history from one place."
        />

        {isAdmin ? (
          <PanelCard eyebrow="Broadcast Center" title="Publish Notification">
            <form onSubmit={handlePublish} className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Enter notification title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.title
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.title ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.title}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  rows="5"
                  placeholder="Write notification message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.message
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.message ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {TYPE_OPTIONS.filter((item) => item.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={publishing}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {publishing ? 'Publishing...' : 'Publish Notification'}
                </button>
              </div>
            </form>
          </PanelCard>
        ) : null}

        <PanelCard eyebrow="Notification Center" title="Notifications">
          <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
            <input
              type="text"
              placeholder="Search notifications"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Total: {notifications.length}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
              Unread: {unreadCount}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Showing: {filteredNotifications.length}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500">
              No notifications found for the selected filters.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredNotifications.map((item) => (
                <div
                  key={item._id}
                  className={`rounded-2xl border p-5 shadow-sm transition ${
                    item.read
                      ? 'border-slate-200 bg-white'
                      : 'border-blue-200 bg-blue-50/40'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getTypeBadge(
                            item.type
                          )}`}
                        >
                          {item.type || 'info'}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.read
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.read ? 'Read' : 'Unread'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {item.title || 'Untitled notification'}
                      </h3>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {item.message || '-'}
                      </p>

                      <p className="mt-3 text-xs text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!item.read ? (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(item._id)}
                          disabled={workingId === item._id}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {workingId === item._id ? 'Working...' : 'Mark Read'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        disabled={workingId === item._id}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {workingId === item._id ? 'Working...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
};

export default Notifications;