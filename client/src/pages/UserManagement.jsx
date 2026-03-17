import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api/users';

const UserManagement = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    faculty: '',
    course: '',
    academicYear: '',
    status: '',
    points: 0,
    helperBadge: false,
    emailVerified: false,
    phoneVerified: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setMessageType('error');
      setMessage('Please log in first.');
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

      if (!token) {
        throw new Error('No login token found. Please log in first.');
      }

      const response = await fetch(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const value = search.toLowerCase();
      return (
        user.name?.toLowerCase().includes(value) ||
        user.email?.toLowerCase().includes(value) ||
        user.role?.toLowerCase().includes(value) ||
        user.faculty?.toLowerCase().includes(value) ||
        user.course?.toLowerCase().includes(value) ||
        String(user.academicYear || '').toLowerCase().includes(value) ||
        String(user.status || '').toLowerCase().includes(value)
      );
    });
  }, [users, search]);

  const openViewModal = (user) => {
    setViewingUser(user);
  };

  const closeViewModal = () => {
    setViewingUser(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      faculty: user.faculty || '',
      course: user.course || '',
      academicYear: user.academicYear || '',
      status: user.status || 'active',
      points: user.points ?? 0,
      helperBadge: user.helperBadge || false,
      emailVerified: user.emailVerified || false,
      phoneVerified: user.phoneVerified || false,
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      name: '',
      email: '',
      role: '',
      faculty: '',
      course: '',
      academicYear: '',
      status: '',
      points: 0,
      helperBadge: false,
      emailVerified: false,
      phoneVerified: false,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    let updatedForm = {
      ...editForm,
      [name]: type === 'checkbox' ? checked : value,
    };

    if (name === 'role') {
      if (value === 'admin') {
        updatedForm = {
          ...updatedForm,
          faculty: '',
          course: '',
          academicYear: '',
        };
      } else if (value === 'faculty') {
        updatedForm = {
          ...updatedForm,
          course: '',
          academicYear: '',
        };
      }
    }

    if (name === 'faculty') {
      updatedForm.course = '';
    }

    setEditForm(updatedForm);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editingUser?._id) {
      setMessageType('error');
      setMessage('Invalid user selected');
      return;
    }

    try {
      setSavingUser(true);
      setMessage('');

      let payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
        points: editForm.points ? Number(editForm.points) : 0,
        helperBadge: editForm.helperBadge,
        emailVerified: editForm.emailVerified,
        phoneVerified: editForm.phoneVerified,
      };

      if (editForm.role === 'student') {
        payload = {
          ...payload,
          faculty: editForm.faculty,
          course: editForm.course,
          academicYear: editForm.academicYear ? Number(editForm.academicYear) : null,
        };
      } else if (editForm.role === 'faculty') {
        payload = {
          ...payload,
          faculty: editForm.faculty,
          course: '',
          academicYear: null,
        };
      } else if (editForm.role === 'admin') {
        payload = {
          ...payload,
          faculty: '',
          course: '',
          academicYear: null,
        };
      }

      const response = await fetch(`${API_BASE}/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setMessageType('success');
      setMessage('User updated successfully');
      closeEditModal();
      fetchUsers();
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      setDeletingUserId(id);
      setMessage('');

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setMessageType('success');
      setMessage(data.message || 'User deleted successfully');
      fetchUsers();
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, color: 'text-blue-700 bg-blue-50' },
    {
      label: 'Students',
      value: users.filter((u) => u.role === 'student').length,
      color: 'text-green-700 bg-green-50',
    },
    {
      label: 'Faculty/Admin',
      value: users.filter((u) => u.role === 'faculty' || u.role === 'admin').length,
      color: 'text-slate-700 bg-slate-100',
    },
  ];

  const inputStyle =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100';

  const getRoleBadge = (role) => {
    if (role === 'student') {
      return 'rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700';
    }
    if (role === 'faculty') {
      return 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700';
    }
    return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700';
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700';
    }
    if (status === 'deactivated') {
      return 'rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700';
    }
    if (status === 'suspended') {
      return 'rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700';
    }
    if (status === 'banned') {
      return 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700';
    }
    return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700';
  };

  const getYesNoBadge = (value) => {
    return value
      ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700'
      : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';
  };

  return (
    <div className="app-shell overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="glass-card rounded-[2rem] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-200/70 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                User Management
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                Manage Platform Users
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                View, search, edit, and delete users through a cleaner and more professional management interface.
              </p>
            </div>

            <div className="flex w-full max-w-md gap-3">
              <input
                type="text"
                placeholder="Search by name, email, role, faculty, course, or year..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputStyle}
              />
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {message && (
            <div
              className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                messageType === 'error'
                  ? 'border border-red-100 bg-red-50 text-red-600'
                  : 'border border-green-100 bg-green-50 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">{item.label}</p>
                <div className="mt-3 flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-900">{item.value}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.color}`}>
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold">Name</th>
                    <th className="px-5 py-4 text-sm font-semibold">Email</th>
                    <th className="px-5 py-4 text-sm font-semibold">Role</th>
                    <th className="px-5 py-4 text-sm font-semibold">Faculty</th>
                    <th className="px-5 py-4 text-sm font-semibold">Course</th>
                    <th className="px-5 py-4 text-sm font-semibold">Year</th>
                    <th className="px-5 py-4 text-sm font-semibold">Status</th>
                    <th className="px-5 py-4 text-sm font-semibold">Points</th>
                    <th className="px-5 py-4 text-sm font-semibold">Helper Badge</th>
                    <th className="px-5 py-4 text-sm font-semibold">Email Verified</th>
                    <th className="px-5 py-4 text-sm font-semibold">Phone Verified</th>
                    <th className="px-5 py-4 text-sm font-semibold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="12" className="px-5 py-8 text-center text-slate-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-5 py-8 text-center text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user._id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      >
                        <td className="px-5 py-4 font-medium text-slate-800">{user.name}</td>
                        <td className="px-5 py-4 text-slate-600">{user.email}</td>
                        <td className="px-5 py-4">
                          <span className={getRoleBadge(user.role)}>{user.role}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{user.faculty || '-'}</td>
                        <td className="px-5 py-4 text-slate-600">{user.course || '-'}</td>
                        <td className="px-5 py-4 text-slate-600">{user.academicYear || '-'}</td>
                        <td className="px-5 py-4">
                          <span className={getStatusBadge(user.status || 'active')}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{user.points ?? 0}</td>
                        <td className="px-5 py-4">
                          <span className={getYesNoBadge(user.helperBadge)}>
                            {user.helperBadge ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={getYesNoBadge(user.emailVerified)}>
                            {user.emailVerified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={getYesNoBadge(user.phoneVerified)}>
                            {user.phoneVerified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openViewModal(user)}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deletingUserId === user._id}
                              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                  View User
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">User Details</h2>
              </div>
              <button
                onClick={closeViewModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="mt-1 font-semibold text-slate-900">{viewingUser.name || '-'}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 font-semibold text-slate-900">{viewingUser.email || '-'}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Role</p>
                <div className="mt-2">
                  <span className={getRoleBadge(viewingUser.role)}>{viewingUser.role || '-'}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-2">
                  <span className={getStatusBadge(viewingUser.status || 'active')}>
                    {viewingUser.status || 'active'}
                  </span>
                </div>
              </div>

              {viewingUser.role !== 'admin' && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Faculty</p>
                  <p className="mt-1 font-semibold text-slate-900">{viewingUser.faculty || '-'}</p>
                </div>
              )}

              {viewingUser.role === 'student' && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Course</p>
                  <p className="mt-1 font-semibold text-slate-900">{viewingUser.course || '-'}</p>
                </div>
              )}

              {viewingUser.role === 'student' && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Academic Year</p>
                  <p className="mt-1 font-semibold text-slate-900">{viewingUser.academicYear || '-'}</p>
                </div>
              )}

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Points</p>
                <p className="mt-1 font-semibold text-slate-900">{viewingUser.points ?? 0}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Helper Badge</p>
                <div className="mt-2">
                  <span className={getYesNoBadge(viewingUser.helperBadge)}>
                    {viewingUser.helperBadge ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email Verified</p>
                <div className="mt-2">
                  <span className={getYesNoBadge(viewingUser.emailVerified)}>
                    {viewingUser.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">Phone Verified</p>
                <div className="mt-2">
                  <span className={getYesNoBadge(viewingUser.phoneVerified)}>
                    {viewingUser.phoneVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700">
                  Edit User
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Update User Details</h2>
              </div>
              <button
                onClick={closeEditModal}
                disabled={savingUser}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  disabled={savingUser}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  disabled={savingUser}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  disabled={savingUser}
                  className={inputStyle}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {editForm.role !== 'admin' && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Faculty</label>
                  <input
                    type="text"
                    name="faculty"
                    value={editForm.faculty}
                    onChange={handleEditChange}
                    disabled={savingUser}
                    className={inputStyle}
                  />
                </div>
              )}

              {editForm.role === 'student' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
                    <input
                      type="text"
                      name="course"
                      value={editForm.course}
                      onChange={handleEditChange}
                      disabled={savingUser}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Academic Year</label>
                    <input
                      type="number"
                      name="academicYear"
                      value={editForm.academicYear}
                      onChange={handleEditChange}
                      min="1"
                      max="4"
                      disabled={savingUser}
                      className={inputStyle}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  disabled={savingUser}
                  className={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Points</label>
                <input
                  type="number"
                  name="points"
                  value={editForm.points}
                  onChange={handleEditChange}
                  disabled={savingUser}
                  className={inputStyle}
                />
              </div>

              <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="helperBadge"
                    checked={editForm.helperBadge}
                    onChange={handleEditChange}
                    disabled={savingUser}
                  />
                  Helper Badge
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="emailVerified"
                    checked={editForm.emailVerified}
                    onChange={handleEditChange}
                    disabled={savingUser}
                  />
                  Email Verified
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="phoneVerified"
                    checked={editForm.phoneVerified}
                    onChange={handleEditChange}
                    disabled={savingUser}
                  />
                  Phone Verified
                </label>
              </div>

              <div className="md:col-span-2 mt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex-1 rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingUser}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;