import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';

const API_BASE = 'http://localhost:8000/api/threads';

const AcademicCommunication = () => {
  const [threads, setThreads] = useState([]);
  const [savedThreadIds, setSavedThreadIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [postingThread, setPostingThread] = useState(false);
  const [replyingThreadId, setReplyingThreadId] = useState(null);
  const [deletingThreadId, setDeletingThreadId] = useState(null);
  const [deletingReplyId, setDeletingReplyId] = useState(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [savingThreadEdit, setSavingThreadEdit] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [savingReplyEditId, setSavingReplyEditId] = useState(null);
  const [savingThreadId, setSavingThreadId] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

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

  const [newThread, setNewThread] = useState({
    title: '',
    topic: 'General',
    content: '',
  });

  const [editThreadForm, setEditThreadForm] = useState({
    title: '',
    topic: 'General',
    content: '',
  });

  const [replyInputs, setReplyInputs] = useState({});
  const [editReplyInputs, setEditReplyInputs] = useState({});

  const topicOptions = ['All', 'General', 'Academics', 'Projects', 'Internships', 'Events'];

  const showToast = (type, message) => setToast({ show: true, type, message });
  const closeToast = () => setToast({ show: false, type: 'success', message: '' });

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

  const getCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        return {
          id: parsedUser._id || '',
          name: parsedUser.name || 'User',
          email: parsedUser.email || '',
          role: parsedUser.role || '',
        };
      }

      const token = localStorage.getItem('token');
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id || payload._id || '',
        name: payload.name || 'User',
        email: payload.email || '',
        role: payload.role || '',
      };
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchThreads();
    fetchSavedThreads();
  }, [page, selectedTopic, sortBy]);

  const fetchThreads = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: '6',
        sort: sortBy,
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedTopic && selectedTopic !== 'All') params.append('topic', selectedTopic);

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load discussion records');
      }

      setThreads(Array.isArray(data.threads) ? data.threads : []);
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          limit: 6,
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

  const fetchSavedThreads = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) return;

      setSavedThreadIds(Array.isArray(data) ? data.map((item) => item._id) : []);
    } catch {
      // silent
    }
  };

  const canModifyThread = (thread) => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || String(thread.authorId || '') === String(currentUser.id);
  };

  const canModifyReply = (reply) => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || String(reply.authorId || '') === String(currentUser.id);
  };

  const isSaved = (threadId) => savedThreadIds.includes(threadId);

  const handleToggleSaveThread = async (threadId) => {
    try {
      setSavingThreadId(threadId);

      const token = localStorage.getItem('token');
      if (!token) {
        showToast('error', 'Please sign in to continue');
        return;
      }

      const alreadySaved = isSaved(threadId);

      const response = await fetch(`${API_BASE}/${threadId}/save`, {
        method: alreadySaved ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update saved discussion status');
      }

      if (alreadySaved) {
        setSavedThreadIds((prev) => prev.filter((id) => id !== threadId));
        showToast('success', 'Discussion removed from saved items');
      } else {
        setSavedThreadIds((prev) => [...prev, threadId]);
        showToast('success', 'Discussion saved successfully');
      }
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSavingThreadId(null);
    }
  };

  const handleNewThreadChange = (e) => setNewThread({ ...newThread, [e.target.name]: e.target.value });

  const handleCreateThread = async (e) => {
    e.preventDefault();

    try {
      setPostingThread(true);

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(newThread),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to publish discussion');

      setNewThread({ title: '', topic: 'General', content: '' });
      setShowCreateForm(false);
      await fetchThreads();
      showToast('success', 'Discussion published successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setPostingThread(false);
    }
  };

  const openEditThread = (thread) => {
    setEditingThreadId(thread._id);
    setEditThreadForm({
      title: thread.title,
      topic: thread.topic,
      content: thread.content,
    });
  };

  const closeEditThread = () => {
    setEditingThreadId(null);
    setEditThreadForm({
      title: '',
      topic: 'General',
      content: '',
    });
  };

  const handleEditThreadChange = (e) => setEditThreadForm({ ...editThreadForm, [e.target.name]: e.target.value });

  const handleSaveThreadEdit = async (threadId) => {
    try {
      setSavingThreadEdit(true);

      const response = await fetch(`${API_BASE}/${threadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(editThreadForm),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to update discussion');

      closeEditThread();
      await fetchThreads();
      showToast('success', 'Discussion updated successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSavingThreadEdit(false);
    }
  };

  const handleReplyInputChange = (threadId, value) => {
    setReplyInputs((prev) => ({ ...prev, [threadId]: value }));
  };

  const handleAddReply = async (threadId) => {
    const replyText = replyInputs[threadId]?.trim();
    if (!replyText) return;

    try {
      setReplyingThreadId(threadId);

      const response = await fetch(`${API_BASE}/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text: replyText }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to post reply');

      setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
      await fetchThreads();
      showToast('success', 'Reply submitted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setReplyingThreadId(null);
    }
  };

  const openEditReply = (replyId, currentText) => {
    setEditingReplyId(replyId);
    setEditReplyInputs((prev) => ({ ...prev, [replyId]: currentText }));
  };

  const closeEditReply = () => setEditingReplyId(null);

  const handleEditReplyInputChange = (replyId, value) => {
    setEditReplyInputs((prev) => ({ ...prev, [replyId]: value }));
  };

  const handleSaveReplyEdit = async (threadId, replyId) => {
    const text = editReplyInputs[replyId]?.trim();
    if (!text) return;

    try {
      setSavingReplyEditId(replyId);

      const response = await fetch(`${API_BASE}/${threadId}/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to update reply');

      setEditingReplyId(null);
      await fetchThreads();
      showToast('success', 'Reply updated successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSavingReplyEditId(null);
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      setDeletingThreadId(threadId);

      const response = await fetch(`${API_BASE}/${threadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to delete discussion');

      await fetchThreads();
      await fetchSavedThreads();
      showToast('success', 'Discussion deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleDeleteReply = async (threadId, replyId) => {
    try {
      setDeletingReplyId(replyId);

      const response = await fetch(`${API_BASE}/${threadId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to delete reply');

      await fetchThreads();
      showToast('success', 'Reply deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setDeletingReplyId(null);
    }
  };

  const askDeleteThread = (threadId) => {
    setConfirmState({
      open: true,
      title: 'Delete Discussion',
      message: 'Are you sure you want to permanently remove this discussion record?',
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await handleDeleteThread(threadId);
      },
    });
  };

  const askDeleteReply = (threadId, replyId) => {
    setConfirmState({
      open: true,
      title: 'Delete Reply',
      message: 'Are you sure you want to permanently remove this reply?',
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await handleDeleteReply(threadId, replyId);
      },
    });
  };

  const topicBadgeStyle = (topic) => {
    if (topic === 'Projects') return 'bg-blue-50 text-blue-700 ring-blue-100';
    if (topic === 'Academics') return 'bg-green-50 text-green-700 ring-green-100';
    if (topic === 'Internships') return 'bg-purple-50 text-purple-700 ring-purple-100';
    if (topic === 'Events') return 'bg-orange-50 text-orange-700 ring-orange-100';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  const formatTimestamp = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const stats = [
    {
      title: 'Total Discussions',
      value: loading ? '...' : pagination.total,
      subtitle: 'Discussion records matching the current selection.',
      badge: 'Threads',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Saved Discussions',
      value: savedThreadIds.length,
      subtitle: 'Discussions retained for future reference.',
      badge: 'Saved',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Visible Records',
      value: loading ? '...' : threads.length,
      subtitle: 'Discussions currently shown on this page.',
      badge: 'View',
      cardClass: 'bg-slate-100 ring-1 ring-slate-200',
      valueClass: 'text-slate-900',
    },
  ];

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
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
          title="Academic Communication Hub"
          subtitle="Manage academic discussions, participate in structured conversations, and retain important records through a more professional communication workspace."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <PanelCard eyebrow="Discussion Workspace" title="Search, Filter, and Manage Discussions">
          <div className="mb-6 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Access topic-based academic conversations, respond to peers, sort discussion records by relevance,
              and retain important threads for later reference.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {showCreateForm ? 'Close Discussion Form' : 'Create New Discussion'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Search by title, content, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              <option value="latest">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="latest-activity">Latest Activity</option>
              <option value="most-replies">Most Replied</option>
            </select>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  fetchThreads();
                }}
                className="flex-1 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedTopic('All');
                  setSortBy('latest');
                  setPage(1);
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        </PanelCard>

        {showCreateForm && (
          <PanelCard eyebrow="Create Discussion" title="Publish a New Academic Discussion">
            <p className="text-sm text-slate-600">
              Provide a clear title, assign a relevant category, and publish a discussion topic for the UniHive community.
            </p>

            <form onSubmit={handleCreateThread} className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Discussion Title</label>
                <input
                  type="text"
                  name="title"
                  value={newThread.title}
                  onChange={handleNewThreadChange}
                  placeholder="Enter a clear discussion title"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Discussion Category</label>
                <select
                  name="topic"
                  value={newThread.topic}
                  onChange={handleNewThreadChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                >
                  {topicOptions.filter((topic) => topic !== 'All').map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Discussion Description</label>
                <textarea
                  name="content"
                  value={newThread.content}
                  onChange={handleNewThreadChange}
                  rows="5"
                  placeholder="Describe the academic topic, question, or issue to be discussed..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={postingThread} className="rounded-2xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70">
                  {postingThread ? 'Publishing...' : 'Publish Discussion'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </PanelCard>
        )}

        <div className="grid gap-5">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading discussions...
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No discussion records are available for the current criteria.
            </div>
          ) : (
            threads.map((thread) => (
              <div key={thread._id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${topicBadgeStyle(thread.topic)}`}>
                        {thread.topic}
                      </span>
                      <span className="text-sm text-slate-500">Author: {thread.author}</span>
                      <span className="text-sm text-slate-400">•</span>
                      <span className="text-sm text-slate-500">{formatTimestamp(thread.createdAt)}</span>
                    </div>

                    {editingThreadId === thread._id ? (
                      <div className="mt-4 space-y-4">
                        <input
                          type="text"
                          name="title"
                          value={editThreadForm.title}
                          onChange={handleEditThreadChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        <select
                          name="topic"
                          value={editThreadForm.topic}
                          onChange={handleEditThreadChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        >
                          {topicOptions.filter((topic) => topic !== 'All').map((topic) => (
                            <option key={topic} value={topic}>{topic}</option>
                          ))}
                        </select>
                        <textarea
                          name="content"
                          value={editThreadForm.content}
                          onChange={handleEditThreadChange}
                          rows="4"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        <div className="flex gap-3">
                          <button onClick={() => handleSaveThreadEdit(thread._id)} disabled={savingThreadEdit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                            {savingThreadEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button onClick={closeEditThread} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="mt-3 text-2xl font-bold text-slate-900">{thread.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{thread.content}</p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-100">
                      {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => handleToggleSaveThread(thread._id)}
                        disabled={savingThreadId === thread._id}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          isSaved(thread._id)
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {savingThreadId === thread._id
                          ? 'Please wait...'
                          : isSaved(thread._id)
                          ? 'Saved'
                          : 'Save'}
                      </button>

                      {canModifyThread(thread) && editingThreadId !== thread._id && (
                        <>
                          <button onClick={() => openEditThread(thread)} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                            Edit
                          </button>
                          <button
                            onClick={() => askDeleteThread(thread._id)}
                            disabled={deletingThreadId === thread._id}
                            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingThreadId === thread._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">Discussion Replies</p>

                  <div className="mt-4 grid gap-3">
                    {thread.replies.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500 ring-1 ring-slate-100">
                        No replies have been submitted yet. Be the first contributor to this discussion.
                      </div>
                    ) : (
                      thread.replies.map((reply) => (
                        <div key={reply._id || reply.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">{reply.author}</p>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{formatTimestamp(reply.createdAt)}</span>
                            </div>

                            {canModifyReply(reply) && editingReplyId !== reply._id && (
                              <div className="flex gap-2">
                                <button onClick={() => openEditReply(reply._id, reply.text)} className="rounded-lg bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200">
                                  Edit
                                </button>
                                <button
                                  onClick={() => askDeleteReply(thread._id, reply._id)}
                                  disabled={deletingReplyId === reply._id}
                                  className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {deletingReplyId === reply._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>

                          {editingReplyId === reply._id ? (
                            <div className="mt-3 space-y-3">
                              <textarea
                                rows="3"
                                value={editReplyInputs[reply._id] || ''}
                                onChange={(e) => handleEditReplyInputChange(reply._id, e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveReplyEdit(thread._id, reply._id)} disabled={savingReplyEditId === reply._id} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                                  {savingReplyEditId === reply._id ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button onClick={closeEditReply} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm leading-7 text-slate-600">{reply.text}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      placeholder="Write a professional reply..."
                      value={replyInputs[thread._id] || ''}
                      onChange={(e) => handleReplyInputChange(thread._id, e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => handleAddReply(thread._id)}
                      disabled={replyingThreadId === thread._id}
                      className="rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {replyingThreadId === thread._id ? 'Submitting...' : 'Submit Reply'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>
    </div>
  );
};

export default AcademicCommunication;