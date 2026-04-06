import { useEffect, useState } from 'react';
import { socket } from '../socket';

const API = 'http://localhost:5000/api/notifications';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    socket.on('notification:new', (n) => {
      setNotifications((prev) => [n, ...prev]);
    });

    socket.on('notification:updated', (p) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === p._id ? { ...n, read: true } : n
        )
      );
    });

    return () => {
      socket.off('notification:new');
      socket.off('notification:updated');
    };
  }, []);

  return (
    <div className="ml-56 mt-16 p-6">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>

      {notifications.length === 0 ? (
        <p>No notifications found</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            className={`p-4 mb-3 border rounded ${
              n.read ? 'bg-gray-100' : 'bg-blue-50'
            }`}
          >
            <h2 className="font-bold">{n.title}</h2>
            <p>{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;