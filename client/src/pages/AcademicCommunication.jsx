import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api/threads';

const AcademicCommunication = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [postingThread, setPostingThread] = useState(false);
  const [replyingThreadId, setReplyingThreadId] = useState(null);

  const [newThread, setNewThread] = useState({
    title: '',
    topic: 'General',
    author: '',
    content: '',
  });

  const [replyInputs, setReplyInputs] = useState({});

  const topicOptions = ['All', 'General', 'Academics', 'Projects', 'Internships', 'Events'];

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(API_BASE);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load discussions');
      }

      setThreads(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const q = search.toLowerCase();

      const matchesSearch =
        thread.title.toLowerCase().includes(q) ||
        thread.content.toLowerCase().includes(q) ||
        thread.author.toLowerCase().includes(q) ||
        thread.topic.toLowerCase().includes(q);

      const matchesTopic = selectedTopic === 'All' || thread.topic === selectedTopic;

      return matchesSearch && matchesTopic;
    });
  }, [threads, search, selectedTopic]);

  const handleNewThreadChange = (e) => {
    setNewThread({ ...newThread, [e.target.name]: e.target.value });
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();

    try {
      setPostingThread(true);
      setMessage('');

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create thread');
      }

      setNewThread({
        title: '',
        topic: 'General',
        author: '',
        content: '',
      });

      setShowCreateForm(false);
      await fetchThreads();
      setMessage('Discussion thread created successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPostingThread(false);
    }
  };

  const handleReplyInputChange = (threadId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [threadId]: value,
    }));
  };

  const handleAddReply = async (threadId) => {
    const replyText = replyInputs[threadId]?.trim();

    if (!replyText) return;

    try {
      setReplyingThreadId(threadId);
      setMessage('');

      const response = await fetch(`${API_BASE}/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Current User',
          text: replyText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post reply');
      }

      setReplyInputs((prev) => ({
        ...prev,
        [threadId]: '',
      }));

      await fetchThreads();
      setMessage('Reply added successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setReplyingThreadId(null);
    }
  };

  const topicBadgeStyle = (topic) => {
    if (topic === 'Projects') return 'bg-blue-50 text-blue-700 ring-blue-100';
    if (topic === 'Academics') return 'bg-green-50 text-green-700 ring-green-100';
    if (topic === 'Internships') return 'bg-purple-50 text-purple-700 ring-purple-100';
    if (topic === 'Events') return 'bg-orange-50 text-orange-700 ring-orange-100';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-200 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
                Academic Communication Hub
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                Structured academic discussions across the UniHive platform
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Support meaningful academic interaction through topic-based discussions,
                threaded replies, and searchable conversations for students, faculty,
                and administrators.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back to Home
              </Link>
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {showCreateForm ? 'Close Thread Form' : 'Create New Thread'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px]">
            <input
              type="text"
              placeholder="Search discussions by title, topic, author, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100">
              <p className="text-sm text-slate-500">Total Discussions</p>
              <h3 className="mt-2 text-3xl font-bold text-blue-700">{threads.length}</h3>
            </div>

            <div className="rounded-3xl bg-green-50 p-5 ring-1 ring-green-100">
              <p className="text-sm text-slate-500">Filtered Results</p>
              <h3 className="mt-2 text-3xl font-bold text-green-700">{filteredThreads.length}</h3>
            </div>

            <div className="rounded-3xl bg-slate-100 p-5 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Total Replies</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {threads.reduce((sum, thread) => sum + thread.replies.length, 0)}
              </h3>
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {message}
          </div>
        )}

        {showCreateForm && (
          <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-lg shadow-slate-100">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                Create Thread
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Start a new academic discussion
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Add a title, choose a topic, and create a discussion for the UniHive community.
              </p>
            </div>

            <form onSubmit={handleCreateThread} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Thread Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newThread.title}
                  onChange={handleNewThreadChange}
                  placeholder="Enter discussion title"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Topic
                </label>
                <select
                  name="topic"
                  value={newThread.topic}
                  onChange={handleNewThreadChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                >
                  {topicOptions
                    .filter((topic) => topic !== 'All')
                    .map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Author
                </label>
                <input
                  type="text"
                  name="author"
                  value={newThread.author}
                  onChange={handleNewThreadChange}
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Discussion Content
                </label>
                <textarea
                  name="content"
                  value={newThread.content}
                  onChange={handleNewThreadChange}
                  rows="5"
                  placeholder="Write your academic question, topic, or discussion summary..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={postingThread}
                  className="rounded-2xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {postingThread ? 'Posting...' : 'Post Thread'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-5">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading discussions...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No discussions found.
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread._id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${topicBadgeStyle(
                          thread.topic
                        )}`}
                      >
                        {thread.topic}
                      </span>
                      <span className="text-sm text-slate-500">By {thread.author}</span>
                    </div>

                    <h3 className="mt-3 text-2xl font-bold text-slate-900">
                      {thread.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                      {thread.content}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-100">
                    {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
                    Discussion Replies
                  </p>

                  <div className="mt-4 grid gap-3">
                    {thread.replies.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500 ring-1 ring-slate-100">
                        No replies yet. Start the discussion.
                      </div>
                    ) : (
                      thread.replies.map((reply) => (
                        <div
                          key={reply._id || reply.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {reply.author}
                            </p>
                            <span className="text-xs text-slate-400">Reply</span>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {reply.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyInputs[thread._id] || ''}
                      onChange={(e) => handleReplyInputChange(thread._id, e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => handleAddReply(thread._id)}
                      disabled={replyingThreadId === thread._id}
                      className="rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {replyingThreadId === thread._id ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicCommunication;