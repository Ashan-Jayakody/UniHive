import { useEffect, useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import PanelCard from '../components/PanelCard';
import Toast from '../components/Toast';
import { socket } from '../socket';

const API_BASE = 'http://localhost:5000/api/notifications';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'success', label: 'Success' },
  { value: 'info', label: 'Information' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'read', label: 'Read' },
  { value: 'unread', label: 'Unread' },
];

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [workingId, setWorkingId] = useState('');

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

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const token = localStorage.getItem('token');

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast({ show: false, type: 'success', message: '' });
  };

  const getFieldError = (name, value) => {
    const cleanValue = sanitizeText(value);

    if (name === 'title') {
      if (!cleanValue) return 'Notification title is required.';
      if (cleanValue.length < 3) return 'Title must be at least 3 characters.';
      if (cleanValue.length > 120) return 'Title must be 120 characters or less.';
    }

    if (name === 'message') {
      if (!cleanValue) return 'Notification message is required.';
      if (cleanValue.length < 5) return 'Message must be at least 5 characters.';
      if (cleanValue.length > 1000) return 'Message must be 1000 characters or less.';
    }

    if (name === 'type') {
      if (!['success', 'info', 'warning', 'error'].includes(value)) {
        return 'Please select a valid notification type.';
      }
    }

    return '';
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load notifications');
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?._id) {
      socket.emit('join', user._id);
    }

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
      socket.off('notification:new', handleNew);
      socket.off('notification:updated', handleUpdated);
      socket.off('notification:all-read', handleAllRead);
      socket.off('notification:deleted', handleDeleted);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: getFieldError(name, value),
    }));
  };

  const validateForm = () => {
    const currentErrors = {
      title: getFieldError('title', formData.title),
      message: getFieldError('message', formData.message),
      type: getFieldError('type', formData.type),
    };

    setFormErrors(currentErrors);

    return !currentErrors.title && !currentErrors.message && !currentErrors.type;
  };

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('error', 'Please fix the notification form errors.');
      return;
    }

    try {
      setPublishing(true);

      const response = await fetch(API_BASE, {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to publish notification');
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
    } catch (error) {
      showToast('error', error.message);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to mark notification as read');
      }

      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
    } catch (error) {
      showToast('error', error.message);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to mark all notifications as read');
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      showToast('success', 'All notifications marked as read');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setMarkingAll(false);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete notification');
      }

      setNotifications((prev) => prev.filter((item) => item._id !== id));
      showToast('success', 'Notification deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setWorkingId('');
    }
  };

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

  const getTypeBadge = (type) => {
    if (type === 'success') return 'bg-green-50 text-green-700';
    if (type === 'warning') return 'bg-yellow-50 text-yellow-700';
    if (type === 'error') return 'bg-red-50 text-red-700';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader
          title="Notifications"
          subtitle="Publish notifications, search records, manage read status, and keep your UniHive workspace updated."
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <PanelCard eyebrow="Notification Publisher" title="Publish a New Notification">
            <form onSubmit={handlePublish} className="grid gap-5" noValidate>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notification Title
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter notification title"
                  className={`h-14 w-full rounded-2xl border px-4 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.title
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.title && (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notification Message
                </label>
                <textarea
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter notification message"
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.message
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {formErrors.message && (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notification Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`h-14 w-full rounded-2xl border px-4 text-slate-800 outline-none transition focus:ring-4 ${
                    formErrors.type
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                >
                  {TYPE_OPTIONS.filter((item) => item.value !== 'all').map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="mt-2 text-xs font-medium text-red-600">{formErrors.type}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="h-14 rounded-2xl bg-blue-600 px-5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {publishing ? 'Publishing...' : 'Publish Notification'}
              </button>
            </form>
          </PanelCard>

          <PanelCard eyebrow="Notification Centre" title="Search and Manage Notifications">
            <div className="grid gap-4 md:grid-cols-[1fr_140px_140px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or message..."
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="h-11 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {markingAll ? 'Updating...' : 'Mark All as Read'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>

              <p className="text-sm text-slate-500">
                {filteredNotifications.length} notifications found
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
                  No notifications found for the selected criteria.
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.read ? 'Read' : 'Unread'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(item._id)}
                            disabled={workingId === item._id}
                            className="h-10 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {workingId === item._id ? 'Working...' : 'Mark Read'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          disabled={workingId === item._id}
                          className="h-10 rounded-2xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {workingId === item._id ? 'Working...' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.message}</p>
                    <p className="mt-4 text-xs text-slate-500">
                      Issued: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
};

export default Notifications;