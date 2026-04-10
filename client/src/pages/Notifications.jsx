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

const sanitizeText = (text) => text.trim();

const getFieldError = (name, value) => {
  if (!value || !value.trim()) return `${name} is required`;
  return '';
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

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast({ show: false, type: 'success', message: '' });
  };

  // Fetch notifications
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

        if (!response.ok) throw new Error(data.message);

        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        showToast('error', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Socket
  useEffect(() => {
    if (!currentUserId) return;

    const join = () => socket.emit('join-user-room', currentUserId);
    join();
    socket.on('connect', join);

    const handleNew = (n) => setNotifications((prev) => [n, ...prev]);
    const handleUpdated = (p) =>
      setNotifications((prev) =>
        prev.map((i) => (i._id === p._id ? { ...i, read: p.read } : i))
      );
    const handleAllRead = () =>
      setNotifications((prev) => prev.map((i) => ({ ...i, read: true })));
    const handleDeleted = (p) =>
      setNotifications((prev) => prev.filter((i) => i._id !== p._id));

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

  // Filtering
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

  // Actions
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      showToast('error', 'Fill all fields');
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
      if (!res.ok) throw new Error(data.message);

      setFormData({ title: '', message: '', type: 'info' });
      showToast('success', 'Notification published');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      setWorkingId(id);
      await fetch(`${API_BASE}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      showToast('error', 'Failed');
    } finally {
      setWorkingId('');
    }
  };

  const handleDelete = async (id) => {
    try {
      setWorkingId(id);
      await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      showToast('error', 'Failed');
    } finally {
      setWorkingId('');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await fetch(`${API_BASE}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('success', 'All marked as read');
    } catch {
      showToast('error', 'Failed');
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
    <div className="p-6">
      <Toast {...toast} onClose={closeToast} />

      <AppHeader title="Notifications" subtitle="Manage notifications" />

      <PanelCard title="Publish Notification">
        <form onSubmit={handlePublish} className="space-y-4">
          <input
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <textarea
            placeholder="Message"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
          />
          <button disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </form>
      </PanelCard>

      <PanelCard title="Notifications">
        <button onClick={handleMarkAllRead}>Mark All Read</button>

        {loading ? (
          <p>Loading...</p>
        ) : (
          filteredNotifications.map((item) => (
            <div key={item._id}>
              <span className={getTypeBadge(item.type)}>{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.message}</p>

              {!item.read && (
                <button onClick={() => handleMarkRead(item._id)}>
                  Mark Read
                </button>
              )}

              <button onClick={() => handleDelete(item._id)}>Delete</button>
            </div>
          ))
        )}
      </PanelCard>
    </div>
  );
};

export default Notifications;