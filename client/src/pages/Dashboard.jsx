import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api/users';

const Dashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage('');

      const token = localStorage.getItem('token');

      const response = await fetch(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load dashboard data');
      }

      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = users.length;
  const studentCount = users.filter((u) => u.role === 'student').length;
  const facultyCount = users.filter((u) => u.role === 'faculty').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => (u.status || 'active') === 'active').length;

  const summaryCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      subtitle: 'All registered accounts',
      badge: `${activeCount} active`,
      bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
      valueColor: '#1d4ed8',
    },
    {
      title: 'Students',
      value: studentCount,
      subtitle: 'Registered student accounts',
      badge: totalUsers ? `${Math.round((studentCount / totalUsers) * 100)}%` : '0%',
      bg: 'linear-gradient(135deg, #ecfeff, #dcfce7)',
      valueColor: '#15803d',
    },
    {
      title: 'Faculty Members',
      value: facultyCount,
      subtitle: 'Academic staff accounts',
      badge: totalUsers ? `${Math.round((facultyCount / totalUsers) * 100)}%` : '0%',
      bg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      valueColor: '#0f172a',
    },
    {
      title: 'Admins',
      value: adminCount,
      subtitle: 'Administrative access',
      badge: totalUsers ? `${Math.round((adminCount / totalUsers) * 100)}%` : '0%',
      bg: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
      valueColor: '#2563eb',
    },
  ];

  const recentUsers = useMemo(() => {
    return [...users].slice(0, 5);
  }, [users]);

  const roleStats = [
    {
      label: 'Students',
      value: totalUsers ? `${Math.round((studentCount / totalUsers) * 100)}%` : '0%',
    },
    {
      label: 'Faculty',
      value: totalUsers ? `${Math.round((facultyCount / totalUsers) * 100)}%` : '0%',
    },
    {
      label: 'Admins',
      value: totalUsers ? `${Math.round((adminCount / totalUsers) * 100)}%` : '0%',
    },
  ];

  const quickActions = [
    { label: 'Open User Management Portal', path: '/users' },
    { label: 'Manage User Accounts', path: '/users' },
    { label: 'Review Roles and Access', path: '/users' },
    { label: 'View User Records', path: '/users' },
  ];

  const getStatusStyle = (status) => {
    if (status === 'active') {
      return {
        background: '#dcfce7',
        color: '#15803d',
      };
    }
    if (status === 'verified') {
      return {
        background: '#dbeafe',
        color: '#1d4ed8',
      };
    }
    if (status === 'deactivated') {
      return {
        background: '#fef9c3',
        color: '#a16207',
      };
    }
    if (status === 'suspended') {
      return {
        background: '#ffedd5',
        color: '#c2410c',
      };
    }
    if (status === 'banned') {
      return {
        background: '#fee2e2',
        color: '#dc2626',
      };
    }
    return {
      background: '#e2e8f0',
      color: '#334155',
    };
  };

  const formatRole = (role) => {
    if (role === 'student') return 'Student';
    if (role === 'faculty') return 'Faculty';
    if (role === 'admin') return 'Admin';
    return role || '-';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(180deg, #f8fbff 0%, #eef7ff 48%, #f4fff8 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gap: '18px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.7)',
            borderRadius: '24px',
            padding: '22px',
            boxShadow: '0 10px 28px rgba(15,23,42,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '18px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ maxWidth: '720px' }}>
              <p
                style={{
                  margin: 0,
                  color: '#2563eb',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                Dashboard
              </p>

              <h1
                style={{
                  margin: '10px 0 8px 0',
                  fontSize: '38px',
                  lineHeight: '1.15',
                  color: '#0f172a',
                }}
              >
                User Management Dashboard
              </h1>

              <p
                style={{
                  margin: 0,
                  color: '#475569',
                  fontSize: '16px',
                  lineHeight: '1.65',
                }}
              >
                This dashboard provides a centralized view of registered users, role-based
                access, and account status, supporting efficient administration within the
                User Management Portal.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                to="/users"
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(37,99,235,0.16)',
                }}
              >
                Manage Users
              </Link>

              <Link
                to="/register"
                style={{
                  background: '#16a34a',
                  color: 'white',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(22,163,74,0.16)',
                }}
              >
                Add New User
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '16px',
              padding: '12px 16px',
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {summaryCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: card.bg,
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 8px 20px rgba(15,23,42,0.05)',
                border: '1px solid rgba(255,255,255,0.65)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {card.title}
                  </p>
                  <h2
                    style={{
                      margin: '8px 0 6px 0',
                      fontSize: '34px',
                      color: card.valueColor,
                    }}
                  >
                    {loading ? '...' : card.value}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: '#475569',
                      fontSize: '13px',
                    }}
                  >
                    {card.subtitle}
                  </p>
                </div>

                <span
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    color: '#334155',
                    padding: '7px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.45fr 0.85fr',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: '18px' }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '20px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '14px',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: '#16a34a',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Recent User Activity
                  </p>
                  <h3
                    style={{
                      margin: '8px 0 0 0',
                      color: '#0f172a',
                      fontSize: '24px',
                    }}
                  >
                    Latest registered accounts
                  </h3>
                </div>

                <Link
                  to="/users"
                  style={{
                    textDecoration: 'none',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  View all users →
                </Link>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {recentUsers.length === 0 ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px',
                      color: '#64748b',
                      textAlign: 'center',
                    }}
                  >
                    {loading ? 'Loading users...' : 'No recent users found.'}
                  </div>
                ) : (
                  recentUsers.map((user) => (
                    <Link
                      key={user._id}
                      to="/users"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 0.8fr 1fr auto',
                        gap: '12px',
                        alignItems: 'center',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        textDecoration: 'none',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '15px',
                          }}
                        >
                          {user.name}
                        </p>
                      </div>

                      <div
                        style={{
                          color: '#475569',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {formatRole(user.role)}
                      </div>

                      <div
                        style={{
                          color: '#475569',
                          fontSize: '13px',
                        }}
                      >
                        {user.faculty || '—'}
                      </div>

                      <span
                        style={{
                          ...getStatusStyle(user.status || 'active'),
                          padding: '7px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'capitalize',
                        }}
                      >
                        {user.status || 'active'}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a, #111827)',
                color: 'white',
                borderRadius: '24px',
                padding: '22px',
                boxShadow: '0 12px 28px rgba(15,23,42,0.14)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#93c5fd',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                System Overview
              </p>
              <h3
                style={{
                  margin: '12px 0 8px 0',
                  fontSize: '26px',
                  lineHeight: '1.2',
                }}
              >
                Centralized control for user accounts and access management.
              </h3>
              <p
                style={{
                  margin: 0,
                  color: '#cbd5e1',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  maxWidth: '760px',
                }}
              >
                This dashboard provides a unified view of registered users, role distribution,
                account activity, and administrative actions, helping the platform maintain
                organized and secure user management.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '20px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#16a34a',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Role Distribution
              </p>
              <h3
                style={{
                  margin: '10px 0 16px 0',
                  color: '#0f172a',
                  fontSize: '22px',
                }}
              >
                User breakdown
              </h3>

              <div style={{ display: 'grid', gap: '12px' }}>
                {roleStats.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: '#334155',
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        color: '#2563eb',
                        fontWeight: 800,
                        fontSize: '17px',
                      }}
                    >
                      {loading ? '...' : item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '20px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#2563eb',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Quick Actions
              </p>
              <h3
                style={{
                  margin: '10px 0 16px 0',
                  color: '#0f172a',
                  fontSize: '22px',
                }}
              >
                User management shortcuts
              </h3>

              <div style={{ display: 'grid', gap: '10px' }}>
                {quickActions.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '13px 14px',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;