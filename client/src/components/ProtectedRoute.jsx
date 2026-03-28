import { Navigate } from 'react-router-dom';

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      return JSON.parse(savedUser);
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
    };
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status && user.status !== 'active') {
    localStorage.setItem('blockedStatus', user.status);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/blocked-account" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export default ProtectedRoute;