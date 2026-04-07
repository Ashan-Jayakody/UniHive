import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';

const API_BASE = 'http://localhost:5001/api/users';

const UserManagement = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmType: 'danger',
    onConfirm: null,
  });

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
    avatar: '',
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => {
    setToast({ show: false, type: 'success', message: '' });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      confirmType: 'danger',
      onConfirm: null,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [navigate, page, roleFilter, statusFilter, facultyFilter, sortBy]);

  const buildQueryParams = () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '8',
      sort: sortBy,
    });

    if (search.trim()) params.append('search', search.trim());
    if (roleFilter) params.append('role', roleFilter);
    if (statusFilter) params.append('status', statusFilter);
    if (facultyFilter) params.append('faculty', facultyFilter);

    return params.toString();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No login token found. Please sign in first.');

      const response = await fetch(`${API_BASE}?${buildQueryParams()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          limit: 8,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    setPage(1);
    fetchUsers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setFacultyFilter('');
    setSortBy('newest');
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No login token found');

      const response = await fetch(`${API_BASE}/export/csv?${buildQueryParams()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = 'Unable to export CSV file';
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'unihive-users.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('success', 'User records exported successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const openViewModal = (user) => setViewingUser(user);

  const closeViewModal = () => setViewingUser(null);

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
      avatar: user.avatar || '',
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
      avatar: '',
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
        updatedForm.faculty = '';
        updatedForm.course = '';
        updatedForm.academicYear = '';
      } else if (value === 'faculty') {
        updatedForm.course = '';
        updatedForm.academicYear = '';
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
      showToast('error', 'Invalid user record selected');
      return;
    }

    try {
      setSavingUser(true);

      let payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
        points: editForm.points ? Number(editForm.points) : 0,
        helperBadge: editForm.helperBadge,
        emailVerified: editForm.emailVerified,
        phoneVerified: editForm.phoneVerified,
        avatar: editForm.avatar,
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

      if (!response.ok) throw new Error(data.message || 'Unable to update user record');

      closeEditModal();
      fetchUsers();
      showToast('success', 'User record updated successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      setDeletingUserId(id);

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to delete user record');

      fetchUsers();
      showToast('success', data.message || 'User record deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const askDeleteUser = (id) => {
    setConfirmState({
      open: true,
      title: 'Delete User Account',
      message: 'Are you sure you want to permanently remove this user account? This action cannot be reversed.',
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await handleDeleteUser(id);
      },
    });
  };

  const stats = [
    {
      title: 'Total User Records',
      value: loading ? '...' : pagination.total,
      subtitle: 'All user records matching the current criteria.',
      badge: 'Users',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Current Page',
      value: loading ? '...' : pagination.page,
      subtitle: `Page ${pagination.page} of ${pagination.totalPages || 1}`,
      badge: 'Paging',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Visible Records',
      value: loading ? '...' : users.length,
      subtitle: 'User records currently displayed.',
      badge: 'View',
      cardClass: 'bg-slate-100 ring-1 ring-slate-200',
      valueClass: 'text-slate-900',
    },
  ];

  const inputStyle =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100';

  const getRoleBadge = (role) => {
    if (role === 'student') return 'rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700';
    if (role === 'faculty') return 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700';
    return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700';
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700';
    if (status === 'deactivated') return 'rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700';
    if (status === 'suspended') return 'rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700';
    if (status === 'banned') return 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700';
    return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700';
  };

  const getYesNoBadge = (value) =>
    value
      ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700'
      : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';

  return (
    <div className="app-shell overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={closeToast} />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmType={confirmState.confirmType}
        loading={false}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader
          title="User Administration"
          subtitle="Review user records, apply structured filters, update account details, manage platform access, and export institutional records through a professional administration workspace."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <PanelCard eyebrow="User Records" title="User Records and Access Control">
          <div className="mb-6 grid gap-4 border-b border-slate-200 pb-6 lg:grid-cols-5">
            <input
              type="text"
              placeholder="Search by name, email, role, or academic details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputStyle}
            />

            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className={inputStyle}>
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrator</option>
            </select>

            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputStyle}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>

            <input
              type="text"
              placeholder="Filter by faculty"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className={inputStyle}
            />

            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className={inputStyle}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>

          <div className="mb-5 flex flex-wrap gap-3">
            <button
              onClick={handleSearchSubmit}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply Filters
            </button>

            <button
              onClick={handleResetFilters}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>

            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {exportingCsv ? 'Exporting...' : 'Export CSV'}
            </button>

            <Link
              to="/dashboard"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Return to Dashboard
            </Link>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
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
                        Loading user records...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-5 py-8 text-center text-slate-500">
                        No user records match the current criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="px-5 py-4 font-medium text-slate-800">{user.name}</td>
                        <td className="px-5 py-4 text-slate-600">{user.email}</td>
                        <td className="px-5 py-4"><span className={getRoleBadge(user.role)}>{user.role}</span></td>
                        <td className="px-5 py-4 text-slate-600">{user.faculty || '-'}</td>
                        <td className="px-5 py-4 text-slate-600">{user.course || '-'}</td>
                        <td className="px-5 py-4 text-slate-600">{user.academicYear || '-'}</td>
                        <td className="px-5 py-4"><span className={getStatusBadge(user.status || 'active')}>{user.status || 'active'}</span></td>
                        <td className="px-5 py-4 text-slate-600">{user.points ?? 0}</td>
                        <td className="px-5 py-4"><span className={getYesNoBadge(user.helperBadge)}>{user.helperBadge ? 'Yes' : 'No'}</span></td>
                        <td className="px-5 py-4"><span className={getYesNoBadge(user.emailVerified)}>{user.emailVerified ? 'Yes' : 'No'}</span></td>
                        <td className="px-5 py-4"><span className={getYesNoBadge(user.phoneVerified)}>{user.phoneVerified ? 'Yes' : 'No'}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openViewModal(user)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                              View
                            </button>
                            <button onClick={() => openEditModal(user)} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                              Edit
                            </button>
                            <button
                              onClick={() => askDeleteUser(user._id)}
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages || 1}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Previous
              </button>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Next
              </button>
            </div>
          </div>
        </PanelCard>
      </div>

      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">User Overview</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">User Profile Summary</h2>
              </div>
              <button onClick={closeViewModal} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">Profile Image</p>
                <div className="mt-3">
                  {viewingUser.avatar ? (
                    <img src={viewingUser.avatar} alt="User avatar" className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-3xl font-bold text-white">
                      {viewingUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Full Name</p><p className="mt-1 font-semibold text-slate-900">{viewingUser.name || '-'}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Email Address</p><p className="mt-1 font-semibold text-slate-900">{viewingUser.email || '-'}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Role</p><div className="mt-2"><span className={getRoleBadge(viewingUser.role)}>{viewingUser.role || '-'}</span></div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Account Status</p><div className="mt-2"><span className={getStatusBadge(viewingUser.status || 'active')}>{viewingUser.status || 'active'}</span></div></div>
              {viewingUser.role !== 'admin' && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Faculty</p><p className="mt-1 font-semibold text-slate-900">{viewingUser.faculty || '-'}</p></div>}
              {viewingUser.role === 'student' && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Course</p><p className="mt-1 font-semibold text-slate-900">{viewingUser.course || '-'}</p></div>}
              {viewingUser.role === 'student' && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Academic Year</p><p className="mt-1 font-semibold text-slate-900">{viewingUser.academicYear || '-'}</p></div>}
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Points</p><p className="mt-1 font-semibold text-slate-900">{viewingUser.points ?? 0}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Helper Badge</p><div className="mt-2"><span className={getYesNoBadge(viewingUser.helperBadge)}>{viewingUser.helperBadge ? 'Yes' : 'No'}</span></div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Email Verified</p><div className="mt-2"><span className={getYesNoBadge(viewingUser.emailVerified)}>{viewingUser.emailVerified ? 'Yes' : 'No'}</span></div></div>
              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2"><p className="text-sm text-slate-500">Phone Verified</p><div className="mt-2"><span className={getYesNoBadge(viewingUser.phoneVerified)}>{viewingUser.phoneVerified ? 'Yes' : 'No'}</span></div></div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700">User Update</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Modify Account Details</h2>
              </div>
              <button onClick={closeEditModal} disabled={savingUser} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70">
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                <input type="text" name="name" value={editForm.name} onChange={handleEditChange} required disabled={savingUser} className={inputStyle} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required disabled={savingUser} className={inputStyle} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                <select name="role" value={editForm.role} onChange={handleEditChange} disabled={savingUser} className={inputStyle}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {editForm.role !== 'admin' && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Faculty</label>
                  <input type="text" name="faculty" value={editForm.faculty} onChange={handleEditChange} disabled={savingUser} className={inputStyle} />
                </div>
              )}

              {editForm.role === 'student' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
                    <input type="text" name="course" value={editForm.course} onChange={handleEditChange} disabled={savingUser} className={inputStyle} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Academic Year</label>
                    <input type="number" name="academicYear" value={editForm.academicYear} onChange={handleEditChange} min="1" max="4" disabled={savingUser} className={inputStyle} />
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Account Status</label>
                <select name="status" value={editForm.status} onChange={handleEditChange} disabled={savingUser} className={inputStyle}>
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Points</label>
                <input type="number" name="points" value={editForm.points} onChange={handleEditChange} disabled={savingUser} className={inputStyle} />
              </div>

              <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input type="checkbox" name="helperBadge" checked={editForm.helperBadge} onChange={handleEditChange} disabled={savingUser} />
                  Helper Badge
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input type="checkbox" name="emailVerified" checked={editForm.emailVerified} onChange={handleEditChange} disabled={savingUser} />
                  Email Verified
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input type="checkbox" name="phoneVerified" checked={editForm.phoneVerified} onChange={handleEditChange} disabled={savingUser} />
                  Phone Verified
                </label>
              </div>

              <div className="md:col-span-2 mt-2 flex gap-3">
                <button type="submit" disabled={savingUser} className="flex-1 rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeEditModal} disabled={savingUser} className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70">
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