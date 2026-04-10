import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../socket';
import {
  Home,
  LayoutGrid,
  User,
  Folder,
  GraduationCap,
  LifeBuoy,
  BarChart2,
  Wrench,
  Bell,
  LogOut,
  MessageSquare,
} from 'lucide-react';

const NOTIFICATION_API = 'http://localhost:8000/api/notifications';

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return {
        ...parsed,
        _id: parsed._id || parsed.id || '',
        name: parsed.name || 'User',
        email: parsed.email || '',
        role: parsed.role || '',
        status: parsed.status || 'active',
        avatar: parsed.avatar || '',
      };
    }

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
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const isAdmin    = currentUser?.role === 'admin';
  const canViewResourceAnalytics = ['faculty', 'admin'].includes(currentUser?.role);


  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return {
      message: text || 'Server returned a non-JSON response',
    };
  };

  useEffect(() => {
    if (!currentUserId) return;

    const fetchNotifications = async () => {
      try {
        if (!currentUserId) return;
        setLoadingNotifications(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(NOTIFICATION_API, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await parseApiResponse(response);
        if (!response.ok) return;
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        // silent
      } finally {
        setLoadingNotifications(false);
      }
    };

    const joinUserRoom = () => {
      socket.emit('join-user-room', currentUserId);
    };

    joinUserRoom();
    socket.on('connect', joinUserRoom);
    fetchNotifications();

    return () => {
      socket.off('connect', joinUserRoom);
    };
  }, [currentUserId, location.pathname]);

  useEffect(() => {
    if (!currentUserId) return;

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
  }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const latestNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications]
  );

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

      const response = await fetch(`${NOTIFICATION_API}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, read: true } : item
          )
        );
      }
    } catch {
      // ignore request errors in quick action
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${NOTIFICATION_API}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      }
    } catch {
      // ignore request errors in quick action
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('blockedStatus');
    navigate('/login');
  };

  const initials = currentUser?.name?.charAt(0)?.toUpperCase() || 'U';
  const activePath = location.pathname;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-linear-to-br from-blue-700 via-blue-600 to-emerald-600
                         border border-white/10 shadow-2xl text-white">

        {/* Logo */}
        <div className="border-b border-white/20  px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
            UniHive Platform
          </p>
          <p className="mt-1 text-[15px] font-semibold text-white">UniHive</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="nav-section-label">Overview</p>

          {showBackHome && (
            <SidebarLink to="/" label="Back to Home" active={activePath === '/'}>
              <Home size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {currentUser && (
            <SidebarLink to="/dashboard" label="Dashboard" active={activePath === '/dashboard'}>
              <LayoutGrid size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {currentUser && <p className="nav-section-label mt-3">Modules</p>}

          {currentUser && (
            <SidebarLink to="/profile" label="Profile" active={activePath === '/profile'}>
              <User size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {currentUser && (
            <SidebarLink
              to="/resourceShare"
              label="Resource Sharing"
              active={activePath === '/resourceShare'}
            >
              <Folder size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {canViewResourceAnalytics && (
            <SidebarLink to="/resource-analytics" label="Resource Analytics" active={activePath === '/resource-analytics'}>
              <BarChart2 size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {currentUser && (
            <SidebarLink
              to="/peerTutoring"
              label="Peer Tutoring"
              active={activePath === '/peerTutoring'}
            >
              <GraduationCap size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {currentUser && (
            <SidebarLink
              to="/helpboard"
              label="Help Exchange"
              active={activePath === '/helpboard'}
              badge={unreadCount > 0 ? unreadCount : null}
            >
              <LifeBuoy size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {currentUser && (
            <SidebarLink
              to="/communication"
              label="Communication-Hub"
              active={activePath === '/communication'}
            >
              <MessageSquare size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {isAdmin && <p className="nav-section-label mt-3">Admin</p>}

          {isAdmin && (
            <SidebarLink
              to="/admin-analytics"
              label="Analytics"
              active={activePath === '/admin-analytics'}
            >
              <BarChart2 size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}

          {isAdmin && (
            <SidebarLink
              to="/users"
              label="User Administration"
              active={activePath === '/users'}
            >
              <Wrench size={15} strokeWidth={1.5} />
            </SidebarLink>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          {currentUser && (
            <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="User avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-semibold text-white">
                  {currentUser.name || 'User'}
                </p>
                <p className="text-[10px] text-white/40">{formatRole(currentUser.role)}</p>
              </div>
            </div>
          )}

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/40 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Sign in
            </Link>
          )}
        </div>
      </aside>

      <header className="fixed left-56 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <p className="text-[11px] text-slate-400">UniHive / {title}</p>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {subtitle ? <p className="text-[11px] text-slate-500">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser && (
            <div className="relative z-200" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <Bell size={15} strokeWidth={1.5} />
                {!loadingNotifications && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-99999 mt-2 w-92.5 rounded-2xl border border-slate-200 bg-white shadow-xl">

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent Notifications
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-90 overflow-y-auto">
                    {loadingNotifications ? (
                      <p className="py-6 text-center text-sm text-slate-400">
                        Loading notifications…
                      </p>
                    ) : latestNotifications.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-400">
                        No notifications are currently available.
                      </p>
                    ) : (
                      latestNotifications.map((item) => (
                        <div
                          key={item._id}
                          className={`border-b border-slate-100 px-4 py-3 last:border-0 ${
                            item.read ? 'bg-white' : 'bg-blue-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getTypeBadge(item.type)}`}
                                >
                                  {getTypeLabel(item.type)}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                    item.read
                                      ? 'border-slate-200 bg-slate-100 text-slate-500'
                                      : 'border-blue-200 bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {item.read ? 'Read' : 'Unread'}
                                </span>
                              </div>

                              <p className="truncate text-sm font-bold text-slate-900">
                                {item.title}
                              </p>
                              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                {item.message}
                              </p>
                              <p className="mt-1.5 text-[11px] text-slate-400">
                                Issued: {formatDate(item.createdAt)}
                              </p>
                            </div>

                            {!item.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(item._id)}
                                className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <Link
                      to="/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="block text-center text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                    >
                      Open Notification Centre →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="User avatar"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                  {initials}
                </div>
              )}
              <span className="text-xs font-medium text-slate-700">
                {currentUser.name || 'User'}
              </span>
            </div>
          )}
        </div>
      </header>

      <style>{`
        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.28);
          padding: 0 10px 6px;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
};

const SidebarLink = ({ to, label, active, badge, children }) => (
  <Link
    to={to}
    className={`group mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-white hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className={`shrink-0 ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`}>
      {children}
    </span>
    <span className="flex-1">{label}</span>
    {badge && (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </Link>
);

export default AppHeader;