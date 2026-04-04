import { useEffect, useMemo, useState } from 'react';
import Toast from '../components/Toast';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';
import { socket } from '../socket';

const API_BASE = 'http://localhost:5000/api/notifications';

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

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.id || '';

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast({ show: false, type: 'success', message: '' });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const joinUserRoom = () => {
      socket.emit('join-user-room', currentUserId);
    };

    joinUserRoom();
    socket.on('connect', joinUserRoom);

    const onNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    const onUpdated = (payload) => {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === payload._id ? { ...item, read: payload.read } : item
        )
      );
    };

    const onAllRead = () => {
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    };

    const onDeleted = (payload) => {
      setNotifications((prev) => prev.filter((item) => item._id !== payload._id));
    };

    socket.on('notification:new', onNew);
    socket.on('notification:updated', onUpdated);
    socket.on('notification:all-read', onAllRead);
    socket.on('notification:deleted', onDeleted);

    return () => {
      socket.off('connect', joinUserRoom);
      socket.off('notification:new', onNew);
      socket.off('notification:updated', onUpdated);
      socket.off('notification:all-read', onAllRead);
      socket.off('notification:deleted', onDeleted);
    };
  }, [currentUserId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const response = await fetch(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || item.type === typeFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' && item.read) ||
        (statusFilter === 'unread' && !item.read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, typeFilter, statusFilter]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const filteredUnreadCount = useMemo(() => filteredNotifications.filter((item) => !item.read).length, [filteredNotifications]);

  const stats = [
    {
      title: 'Total Notifications',
      value: loading ? '...' : notifications.length,
      subtitle: 'All notification records available in your account.',
      badge: 'Inbox',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Unread Notifications',
      value: loading ? '...' : unreadCount,
      subtitle: 'Notifications that still require your attention.',
      badge: 'Pending',
      cardClass: 'bg-yellow-50 ring-1 ring-yellow-100',
      valueClass: 'text-yellow-700',
    },
    {
      title: 'Filtered Results',
      value: loading ? '...' : filteredNotifications.length,
      subtitle: `${filteredUnreadCount} unread notifications match the current filters.`,
      badge: 'Filter',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
  ];

  const getTypeBadge = (type) => {
    if (type === 'success') return 'bg-green-50 text-green-700';
    if (type === 'warning') return 'bg-yellow-50 text-yellow-700';
    if (type === 'error') return 'bg-red-50 text-red-700';
    return 'bg-blue-50 text-blue-700';
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      const token = localStorage.getItem('token');

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create notification');
      }

      setFormData({
        title: '',
        message: '',
        type: 'info',
      });

      showToast('success', 'Notification created successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update notification status');
      }

      showToast('success', 'Notification marked as read');
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);

      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update notifications');
      }

      showToast('success', 'All notifications have been marked as read');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');

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

      showToast('success', 'Notification deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <PanelCard eyebrow="Create Notification" title="Publish a New Notification">
            <form onSubmit={handleCreateNotification} className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notification Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter a clear notification title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notification Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Write the message content to be delivered"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notification Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                >
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Critical</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating ? 'Publishing...' : 'Publish Notification'}
              </button>
            </form>
          </PanelCard>

          <PanelCard eyebrow="Notification Records" title="Search and Manage Notifications">
            <div className="mb-5 grid gap-4 border-b border-slate-200 pb-5 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Search by title or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:col-span-2"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
              >
                <option value="all">All Types</option>
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
              >
                <option value="all">All Statuses</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>

            <div className="mb-4 flex flex-wrap justify-between gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll || unreadCount === 0}
                  className="rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {markingAll ? 'Updating...' : 'Mark All as Read'}
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>

              <p className="self-center text-sm text-slate-500">
                {filteredNotifications.length} notification{filteredNotifications.length === 1 ? '' : 's'} found
              </p>
            </div>

            <div className="grid gap-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                  No notifications match the current search and filter criteria.
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      item.read ? 'border-slate-200 bg-slate-50' : 'border-blue-200 bg-blue-50/50'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadge(item.type)}`}>
                            {item.type}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.read ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.read ? 'Read' : 'Unread'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.message}</p>
                        <p className="mt-3 text-xs text-slate-500">Issued: {formatDate(item.createdAt)}</p>
                      </div>

                      <div className="flex gap-2">
                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(item._id)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Mark as Read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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