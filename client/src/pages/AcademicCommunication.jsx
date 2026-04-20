import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import PanelCard from '../components/PanelCard';

const API_BASE = 'http://localhost:5000/api/threads';

const THREAD_TITLE_MIN = 5;
const THREAD_TITLE_MAX = 120;
const THREAD_CONTENT_MIN = 10;
const THREAD_CONTENT_MAX = 2000;
const REPLY_MIN = 2;
const REPLY_MAX = 1000;

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const validateThreadForm = (thread) => {
  const title = sanitizeText(thread.title);
  const topic = sanitizeText(thread.topic);
  const content = sanitizeText(thread.content);

  if (!title) return 'Discussion title is required.';
  if (title.length < THREAD_TITLE_MIN) {
    return `Discussion title must be at least ${THREAD_TITLE_MIN} characters long.`;
  }
  if (title.length > THREAD_TITLE_MAX) {
    return `Discussion title must be ${THREAD_TITLE_MAX} characters or less.`;
  }

  if (!topic) return 'Please select a discussion topic.';

  if (!content) return 'Discussion content is required.';
  if (content.length < THREAD_CONTENT_MIN) {
    return `Discussion content must be at least ${THREAD_CONTENT_MIN} characters long.`;
  }
  if (content.length > THREAD_CONTENT_MAX) {
    return `Discussion content must be ${THREAD_CONTENT_MAX} characters or less.`;
  }

  return null;
};

const validateReplyText = (text) => {
  const cleanText = sanitizeText(text);

  if (!cleanText) return 'Reply text is required.';
  if (cleanText.length < REPLY_MIN) {
    return `Reply must be at least ${REPLY_MIN} characters long.`;
  }
  if (cleanText.length > REPLY_MAX) {
    return `Reply must be ${REPLY_MAX} characters or less.`;
  }

  return null;
};

const getThreadFieldError = (name, value) => {
  const cleanValue = sanitizeText(value);

  if (name === 'title') {
    if (!cleanValue) return 'Discussion title is required.';
    if (cleanValue.length < THREAD_TITLE_MIN) {
      return `Title must be at least ${THREAD_TITLE_MIN} characters.`;
    }
    if (cleanValue.length > THREAD_TITLE_MAX) {
      return `Title must be ${THREAD_TITLE_MAX} characters or less.`;
    }
  }

  if (name === 'topic') {
    if (!cleanValue) return 'Topic is required.';
  }

  if (name === 'content') {
    if (!cleanValue) return 'Discussion content is required.';
    if (cleanValue.length < THREAD_CONTENT_MIN) {
      return `Content must be at least ${THREAD_CONTENT_MIN} characters.`;
    }
    if (cleanValue.length > THREAD_CONTENT_MAX) {
      return `Content must be ${THREAD_CONTENT_MAX} characters or less.`;
    }
  }

  return '';
};

const getReplyFieldError = (value) => {
  const cleanValue = sanitizeText(value);

  if (!cleanValue) return 'Reply is required.';
  if (cleanValue.length < REPLY_MIN) {
    return `Reply must be at least ${REPLY_MIN} characters.`;
  }
  if (cleanValue.length > REPLY_MAX) {
    return `Reply must be ${REPLY_MAX} characters or less.`;
  }

  return '';
};

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

  const [threadErrors, setThreadErrors] = useState({
    title: '',
    topic: '',
    content: '',
  });

  const [replyErrors, setReplyErrors] = useState({});
  const [editReplyErrors, setEditReplyErrors] = useState({});
  const [editThreadErrors, setEditThreadErrors] = useState({
    title: '',
    topic: '',
    content: '',
  });

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

  const handleNewThreadChange = (e) => {
    const { name, value } = e.target;

    setNewThread((prev) => ({
      ...prev,
      [name]: value,
    }));

    setThreadErrors((prev) => ({
      ...prev,
      [name]: getThreadFieldError(name, value),
    }));
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();

    const currentErrors = {
      title: getThreadFieldError('title', newThread.title),
      topic: getThreadFieldError('topic', newThread.topic),
      content: getThreadFieldError('content', newThread.content),
    };

    setThreadErrors(currentErrors);

    if (currentErrors.title || currentErrors.topic || currentErrors.content) {
      showToast('error', 'Please fix the discussion form errors before submitting.');
      return;
    }

    const validationError = validateThreadForm(newThread);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setPostingThread(true);

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          title: sanitizeText(newThread.title),
          topic: sanitizeText(newThread.topic),
          content: sanitizeText(newThread.content),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to publish discussion');

      setNewThread({ title: '', topic: 'General', content: '' });
      setThreadErrors({ title: '', topic: '', content: '' });
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
    setEditThreadErrors({
      title: '',
      topic: '',
      content: '',
    });
  };

  const closeEditThread = () => {
    setEditingThreadId(null);
    setEditThreadForm({
      title: '',
      topic: 'General',
      content: '',
    });
    setEditThreadErrors({
      title: '',
      topic: '',
      content: '',
    });
  };

  const handleEditThreadChange = (e) => {
    const { name, value } = e.target;

    setEditThreadForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setEditThreadErrors((prev) => ({
      ...prev,
      [name]: getThreadFieldError(name, value),
    }));
  };

  const handleSaveThreadEdit = async (threadId) => {
    const currentErrors = {
      title: getThreadFieldError('title', editThreadForm.title),
      topic: getThreadFieldError('topic', editThreadForm.topic),
      content: getThreadFieldError('content', editThreadForm.content),
    };

    setEditThreadErrors(currentErrors);

    if (currentErrors.title || currentErrors.topic || currentErrors.content) {
      showToast('error', 'Please fix the discussion edit errors before saving.');
      return;
    }

    const validationError = validateThreadForm(editThreadForm);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setSavingThreadEdit(true);

      const response = await fetch(`${API_BASE}/${threadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          title: sanitizeText(editThreadForm.title),
          topic: sanitizeText(editThreadForm.topic),
          content: sanitizeText(editThreadForm.content),
        }),
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

  const openDeleteThreadConfirm = (threadId) => {
    setConfirmState({
      open: true,
      title: 'Delete Discussion',
      message:
        'This discussion and all associated replies will be permanently removed. Do you want to continue?',
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await handleDeleteThread(threadId);
      },
    });
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

      if (editingThreadId === threadId) {
        closeEditThread();
      }

      await fetchThreads();
      showToast('success', 'Discussion deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleReplyInputChange = (threadId, value) => {
    setReplyInputs((prev) => ({ ...prev, [threadId]: value }));

    setReplyErrors((prev) => ({
      ...prev,
      [threadId]: getReplyFieldError(value),
    }));
  };

  const handleAddReply = async (threadId) => {
    const replyText = replyInputs[threadId] || '';
    const currentError = getReplyFieldError(replyText);

    setReplyErrors((prev) => ({
      ...prev,
      [threadId]: currentError,
    }));

    if (currentError) {
      showToast('error', currentError);
      return;
    }

    const validationError = validateReplyText(replyText);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setReplyingThreadId(threadId);

      const response = await fetch(`${API_BASE}/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text: sanitizeText(replyText) }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to post reply');

      setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
      setReplyErrors((prev) => ({ ...prev, [threadId]: '' }));
      await fetchThreads();
      showToast('success', 'Reply submitted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setReplyingThreadId(null);
    }
  };

  const openEditReply = (reply) => {
    setEditingReplyId(reply._id);
    setEditReplyInputs((prev) => ({
      ...prev,
      [reply._id]: reply.text,
    }));
    setEditReplyErrors((prev) => ({
      ...prev,
      [reply._id]: '',
    }));
  };

  const closeEditReply = () => {
    setEditingReplyId(null);
  };

  const handleEditReplyInputChange = (replyId, value) => {
    setEditReplyInputs((prev) => ({ ...prev, [replyId]: value }));

    setEditReplyErrors((prev) => ({
      ...prev,
      [replyId]: getReplyFieldError(value),
    }));
  };

  const handleSaveReplyEdit = async (threadId, replyId) => {
    const text = editReplyInputs[replyId] || '';
    const currentError = getReplyFieldError(text);

    setEditReplyErrors((prev) => ({
      ...prev,
      [replyId]: currentError,
    }));

    if (currentError) {
      showToast('error', currentError);
      return;
    }

    const validationError = validateReplyText(text);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setSavingReplyEditId(replyId);

      const response = await fetch(`${API_BASE}/${threadId}/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text: sanitizeText(text) }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to update reply');

      setEditingReplyId(null);
      setEditReplyInputs((prev) => ({ ...prev, [replyId]: '' }));
      setEditReplyErrors((prev) => ({ ...prev, [replyId]: '' }));
      await fetchThreads();
      showToast('success', 'Reply updated successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSavingReplyEditId(null);
    }
  };

  const openDeleteReplyConfirm = (threadId, replyId) => {
    setConfirmState({
      open: true,
      title: 'Delete Reply',
      message: 'This reply will be permanently removed. Do you want to continue?',
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await handleDeleteReply(threadId, replyId);
      },
    });
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

      if (editingReplyId === replyId) {
        closeEditReply();
      }

      await fetchThreads();
      showToast('success', 'Reply deleted successfully');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setDeletingReplyId(null);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setPage(1);
    await fetchThreads();
  };

  const stats = [
    {
      title: 'Visible Discussions',
      value: pagination.total || threads.length,
      subtitle: 'Discussion records currently available in the academic communication module.',
      badge: 'Threads',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Saved Discussions',
      value: savedThreadIds.length,
      subtitle: 'Threads that you bookmarked for later academic reference.',
      badge: 'Saved',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Current Page',
      value: pagination.page,
      subtitle: 'Pagination position within the discussion board.',
      badge: 'Page',
      cardClass: 'bg-purple-50 ring-1 ring-purple-100',
      valueClass: 'text-purple-700',
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
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader
          title="Academic Communication"
          subtitle="Create, manage, search, filter, reply to, save, and review structured academic discussions through one collaborative communication hub."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <PanelCard eyebrow="Discussion Controls" title="Search, Filter, and Create Discussions">
          <div className="grid gap-5 xl:grid-cols-[1.5fr_0.75fr]">
            <form
              onSubmit={handleSearchSubmit}
              className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_110px]"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discussions..."
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="latest-activity">Activity</option>
                <option value="most-replies">Replies</option>
              </select>

              <button
                type="submit"
                className="h-12 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply
              </button>
            </form>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Discussion Publishing
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                Start a New Academic Discussion
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Publish a structured topic or ask a question.
              </p>

              <button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="mt-4 h-11 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                {showCreateForm ? 'Close Form' : 'Create Discussion'}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateThread}
              className="mt-5 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Discussion Title</label>
                  <input
                    name="title"
                    maxLength={THREAD_TITLE_MAX}
                    value={newThread.title}
                    onChange={handleNewThreadChange}
                    placeholder="Enter a clear discussion title"
                    className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                      threadErrors.title
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                        : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  />
                  {threadErrors.title && (
                    <p className="mt-2 text-xs font-medium text-red-600">{threadErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Topic</label>
                  <select
                    name="topic"
                    value={newThread.topic}
                    onChange={handleNewThreadChange}
                    className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                      threadErrors.topic
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                        : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  >
                    {topicOptions
                      .filter((item) => item !== 'All')
                      .map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                  </select>
                  {threadErrors.topic && (
                    <p className="mt-2 text-xs font-medium text-red-600">{threadErrors.topic}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Discussion Content</label>
                <textarea
                  name="content"
                  maxLength={THREAD_CONTENT_MAX}
                  value={newThread.content}
                  onChange={handleNewThreadChange}
                  rows="5"
                  placeholder="Write the discussion content here"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                    threadErrors.content
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {threadErrors.content && (
                  <p className="mt-2 text-xs font-medium text-red-600">{threadErrors.content}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postingThread}
                  className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {postingThread ? 'Publishing...' : 'Publish Discussion'}
                </button>
              </div>
            </form>
          )}
        </PanelCard>

        <PanelCard eyebrow="Discussion Board" title="Available Academic Discussions">
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
              Loading academic communication records...
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
              No discussion records are currently available for the selected criteria.
            </div>
          ) : (
            <div className="space-y-5">
              {threads.map((thread) => (
                <div
                  key={thread._id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  {editingThreadId === thread._id ? (
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Discussion Title
                          </label>
                          <input
                            name="title"
                            maxLength={THREAD_TITLE_MAX}
                            value={editThreadForm.title}
                            onChange={handleEditThreadChange}
                            className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                              editThreadErrors.title
                                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                            }`}
                          />
                          {editThreadErrors.title && (
                            <p className="mt-2 text-xs font-medium text-red-600">
                              {editThreadErrors.title}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Topic</label>
                          <select
                            name="topic"
                            value={editThreadForm.topic}
                            onChange={handleEditThreadChange}
                            className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                              editThreadErrors.topic
                                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                            }`}
                          >
                            {topicOptions
                              .filter((item) => item !== 'All')
                              .map((topic) => (
                                <option key={topic} value={topic}>
                                  {topic}
                                </option>
                              ))}
                          </select>
                          {editThreadErrors.topic && (
                            <p className="mt-2 text-xs font-medium text-red-600">
                              {editThreadErrors.topic}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Discussion Content
                        </label>
                        <textarea
                          name="content"
                          maxLength={THREAD_CONTENT_MAX}
                          value={editThreadForm.content}
                          onChange={handleEditThreadChange}
                          rows="5"
                          className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                            editThreadErrors.content
                              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                              : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                          }`}
                        />
                        {editThreadErrors.content && (
                          <p className="mt-2 text-xs font-medium text-red-600">
                            {editThreadErrors.content}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveThreadEdit(thread._id)}
                          disabled={savingThreadEdit}
                          className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingThreadEdit ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          onClick={closeEditThread}
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900">{thread.title}</h3>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {thread.topic}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-slate-600">{thread.content}</p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span>Author: {thread.author || 'Unknown User'}</span>
                            <span>
                              Created:{' '}
                              {thread.createdAt ? new Date(thread.createdAt).toLocaleString() : '-'}
                            </span>
                            <span>Replies: {Array.isArray(thread.replies) ? thread.replies.length : 0}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSaveThread(thread._id)}
                            disabled={savingThreadId === thread._id}
                            className={`h-10 rounded-2xl px-4 text-sm font-semibold transition ${
                              isSaved(thread._id)
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            } disabled:cursor-not-allowed disabled:opacity-70`}
                          >
                            {savingThreadId === thread._id
                              ? 'Updating...'
                              : isSaved(thread._id)
                              ? 'Saved'
                              : 'Save'}
                          </button>

                          {canModifyThread(thread) && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditThread(thread)}
                                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteThreadConfirm(thread._id)}
                                disabled={deletingThreadId === thread._id}
                                className="h-10 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {deletingThreadId === thread._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-800">Replies</p>

                        {Array.isArray(thread.replies) && thread.replies.length > 0 ? (
                          <div className="mt-4 space-y-4">
                            {thread.replies.map((reply) => (
                              <div
                                key={reply._id}
                                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                              >
                                {editingReplyId === reply._id ? (
                                  <div className="grid gap-3">
                                    <textarea
                                      rows="4"
                                      maxLength={REPLY_MAX}
                                      value={editReplyInputs[reply._id] || ''}
                                      onChange={(e) => handleEditReplyInputChange(reply._id, e.target.value)}
                                      className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                                        editReplyErrors[reply._id]
                                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                                          : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                                      }`}
                                    />
                                    {editReplyErrors[reply._id] && (
                                      <p className="text-xs font-medium text-red-600">
                                        {editReplyErrors[reply._id]}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveReplyEdit(thread._id, reply._id)}
                                        disabled={savingReplyEditId === reply._id}
                                        className="h-10 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                                      >
                                        {savingReplyEditId === reply._id ? 'Saving...' : 'Save Reply'}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={closeEditReply}
                                        className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                          {reply.author || 'Unknown User'}
                                        </p>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">{reply.text}</p>
                                        <p className="mt-2 text-xs text-slate-500">
                                          {reply.createdAt
                                            ? new Date(reply.createdAt).toLocaleString()
                                            : '-'}
                                        </p>
                                      </div>

                                      {canModifyReply(reply) && (
                                        <div className="flex flex-wrap gap-3">
                                          <button
                                            type="button"
                                            onClick={() => openEditReply(reply)}
                                            className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                          >
                                            Edit
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              openDeleteReplyConfirm(thread._id, reply._id)
                                            }
                                            disabled={deletingReplyId === reply._id}
                                            className="h-10 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                                          >
                                            {deletingReplyId === reply._id ? 'Deleting...' : 'Delete'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-slate-600">
                            No replies have been added to this discussion yet.
                          </p>
                        )}

                        <div className="mt-5 grid gap-3">
                          <textarea
                            rows="3"
                            maxLength={REPLY_MAX}
                            value={replyInputs[thread._id] || ''}
                            onChange={(e) => handleReplyInputChange(thread._id, e.target.value)}
                            placeholder="Write your reply here"
                            className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                              replyErrors[thread._id]
                                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
                            }`}
                          />
                          {replyErrors[thread._id] && (
                            <p className="text-xs font-medium text-red-600">
                              {replyErrors[thread._id]}
                            </p>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAddReply(thread._id)}
                              disabled={replyingThreadId === thread._id}
                              className="h-10 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {replyingThreadId === thread._id ? 'Submitting...' : 'Submit Reply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
};

export default AcademicCommunication;