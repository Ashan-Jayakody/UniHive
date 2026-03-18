import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../socket';

const NOTIFICATION_API = 'http://localhost:5000/api/notifications';

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) return JSON.parse(savedUser);

    const token = localStorage.getItem('token');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      _id: payload.id || payload._id || '',
      name: payload.name || 'User',
      email: payload.email || '',
      role: payload.role || '',
      status: payload.status || 'active',
      avatar: payload.avatar || '',
    };
  } catch {
    return null;
  }
};

const formatRole = (role) => {
  if (role === 'student') return 'Student';
  if (role === 'faculty') return 'Faculty';
  if (role === 'admin') return 'Administrator';
  return role || '-';
};

const AppHeader = ({ title = 'UniHive', subtitle = '', showBackHome = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      if (!currentUser) return;

      setLoadingNotifications(true);

      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(NOTIFICATION_API, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) return;

      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      socket.emit('join-user-room', currentUser._id);
      fetchNotifications();
    }
  }, [currentUser?._id, location.pathname]);

  useEffect(() => {
    if (!currentUser?._id) return;

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
      socket.off('notification:new', onNew);
      socket.off('notification:updated', onUpdated);
      socket.off('notification:all-read', onAllRead);
      socket.off('notification:deleted', onDeleted);
    };
  }, [currentUser?._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.read).length;
  }, [notifications]);

  const latestNotifications = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const getTypeBadge = (type) => {
    if (type === 'success') return 'bg-green-100/70 text-green-700 border border-green-200/70';
    if (type === 'warning') return 'bg-yellow-100/70 text-yellow-700 border border-yellow-200/70';
    if (type === 'error') return 'bg-red-100/70 text-red-700 border border-red-200/70';
    return 'bg-blue-100/70 text-blue-700 border border-blue-200/70';
  };

  const getTypeLabel = (type) => {
    if (type === 'success') return 'Success';
    if (type === 'warning') return 'Warning';
    if (type === 'error') return 'Critical';
    return 'Information';
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${NOTIFICATION_API}/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${NOTIFICATION_API}/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('blockedStatus');
    navigate('/login');
  };

  const glassBase =
    'inline-flex items-center gap-3 rounded-[22px] border border-white/50 bg-white/40 px-5 py-4 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/60';
  const glassPrimary =
    'inline-flex items-center gap-3 rounded-[22px] border border-blue-300/30 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-300/30 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-xl';
  const glassPurple =
    'inline-flex items-center gap-3 rounded-[22px] border border-violet-300/30 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-300/30 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-xl';
  const glassPink =
    'inline-flex items-center gap-3 rounded-[22px] border border-fuchsia-300/30 bg-gradient-to-r from-fuchsia-600/90 to-purple-600/90 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-fuchsia-300/30 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-xl';
  const glassGreen =
    'inline-flex items-center gap-3 rounded-[22px] border border-emerald-300/30 bg-gradient-to-r from-emerald-600/90 to-green-600/90 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-300/30 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-xl';
  const glassRed =
    'inline-flex items-center gap-3 rounded-[22px] border border-red-200/70 bg-red-50/70 px-5 py-4 text-sm font-semibold text-red-700 shadow-lg shadow-red-100/30 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-red-100/80';

  return (
    <div className="relative z-50 overflow-visible rounded-[2rem] border border-white/60 bg-white/35 p-5 shadow-2xl shadow-slate-200/40 backdrop-blur-2xl sm:p-6">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/50 via-blue-50/40 to-emerald-50/30" />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              UniHive Platform
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>

            {subtitle ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                {subtitle}
              </p>
            ) : null}

            {currentUser && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/50 px-4 py-2.5 shadow-md backdrop-blur-xl">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="User avatar"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-sm font-bold text-white">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}

                <div className="leading-tight">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {currentUser.name || 'User'} {currentUser.role ? `• ${formatRole(currentUser.role)}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 overflow-visible">
          {showBackHome && (
            <Link to="/" className={glassBase}>
              <span className="text-lg">🏠</span>
              <span>Back to Home</span>
            </Link>
          )}

          {currentUser && (
            <Link to="/dashboard" className={glassBase}>
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </Link>
          )}

          {currentUser && (
            <Link to="/profile" className={glassBase}>
              <span className="text-lg">👤</span>
              <span>My Profile</span>
            </Link>
          )}

          {currentUser && (
            <Link to="/communication" className={glassPrimary}>
              <span className="text-lg">💬</span>
              <span>Communication Hub</span>
            </Link>
          )}

          {currentUser && (
            <div className="relative z-[200]" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={`${glassPurple} relative`}
              >
                <span className="text-lg">🔔</span>
                <span>Notifications</span>

                {!loadingNotifications && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full z-[99999] mt-3 w-[370px] rounded-[1.5rem] border border-white/60 bg-white/85 shadow-2xl backdrop-blur-2xl">
                  <div className="border-b border-slate-200/80 bg-white/50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        Loading notifications...
                      </div>
                    ) : latestNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        No notifications are currently available.
                      </div>
                    ) : (
                      latestNotifications.map((item) => (
                        <div
                          key={item._id}
                          className={`border-b border-slate-100/80 px-4 py-4 last:border-b-0 ${
                            item.read ? 'bg-white/40' : 'bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTypeBadge(item.type)}`}
                                >
                                  {getTypeLabel(item.type)}
                                </span>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    item.read
                                      ? 'bg-slate-100/80 text-slate-600 border border-slate-200'
                                      : 'bg-blue-100/80 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {item.read ? 'Read' : 'Unread'}
                                </span>
                              </div>

                              <p className="truncate text-sm font-bold text-slate-900">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs leading-6 text-slate-600">
                                {item.message}
                              </p>

                              <p className="mt-2 text-[11px] text-slate-500">
                                Issued: {formatDate(item.createdAt)}
                              </p>
                            </div>

                            {!item.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(item._id)}
                                className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-200/80 bg-white/50 px-4 py-3">
                    <Link
                      to="/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="block text-center text-sm font-semibold text-indigo-700 transition hover:text-indigo-800"
                    >
                      Open Notification Centre →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <Link to="/admin-analytics" className={glassPink}>
              <span className="text-lg">📈</span>
              <span>Administrative Analytics</span>
            </Link>
          )}

          {isAdmin && (
            <Link to="/users" className={glassGreen}>
              <span className="text-lg">🛠️</span>
              <span>User Administration</span>
            </Link>
          )}

          {currentUser ? (
            <button onClick={handleLogout} className={glassRed}>
              <span className="text-lg">🚪</span>
              <span>Sign Out</span>
            </button>
          ) : (
            <Link to="/login" className={glassPrimary}>
              <span className="text-lg">🔐</span>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppHeader;