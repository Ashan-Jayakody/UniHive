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
    };
  } catch {
    return null;
  }
};

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // ✅ FETCH NOTIFICATIONS
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(NOTIFICATION_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch {}
  };

  // ✅ JOIN SOCKET ROOM
  useEffect(() => {
    if (currentUser?._id) {
      socket.emit('join', currentUser._id);
      fetchNotifications();
    }
  }, [currentUser?._id, location.pathname]);

  // ✅ SOCKET LISTENERS
  useEffect(() => {
    const onNew = (n) => setNotifications((prev) => [n, ...prev]);
    const onUpdate = (p) =>
      setNotifications((prev) =>
        prev.map((n) => (n._id === p._id ? { ...n, read: p.read } : n))
      );
    const onDelete = (p) =>
      setNotifications((prev) => prev.filter((n) => n._id !== p._id));

    socket.on('notification:new', onNew);
    socket.on('notification:updated', onUpdate);
    socket.on('notification:deleted', onDelete);

    return () => {
      socket.off('notification:new', onNew);
      socket.off('notification:updated', onUpdate);
      socket.off('notification:deleted', onDelete);
    };
  }, []);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-blue-700 text-white p-4">
        <h2 className="font-bold mb-4">UniHive</h2>

        <Link to="/dashboard">Dashboard</Link><br />
        <Link to="/profile">Profile</Link><br />
        <Link to="/helpboard">HelpBoard</Link><br />
        <Link to="/communication">Communication</Link><br />
        <Link to="/notifications">Notifications</Link><br />

        <button onClick={handleLogout} className="mt-5">
          Logout
        </button>
      </aside>

      {/* TOPBAR */}
      <header className="fixed left-56 right-0 top-0 h-14 bg-white border flex items-center justify-end px-5">
        <div ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)}>
            🔔 {unread}
          </button>

          {dropdownOpen && (
            <div className="absolute right-5 mt-2 w-72 bg-white shadow-lg p-3">
              {notifications.length === 0 ? (
                <p>No notifications</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n._id} className="border-b py-2">
                    <p className="font-bold">{n.title}</p>
                    <p>{n.message}</p>
                  </div>
                ))
              )}

              <Link to="/notifications">View All</Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default AppHeader;