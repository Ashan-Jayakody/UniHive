import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000/api/peer-tutoring";

const todayDateString = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
};

const PeerTutoring = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const defaultFormData = {
    moduleName: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    sessionLink: "",
    maxStudents: "",
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [approvedSessions, setApprovedSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [rejectionReasonById, setRejectionReasonById] = useState({});
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [activeParticipantSession, setActiveParticipantSession] = useState(null);
  const [feedbackFormData, setFeedbackFormData] = useState({ rating: 5, comment: "" });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [activeFeedbackSessionId, setActiveFeedbackSessionId] = useState(null);

  const getSessionStatus = (date, startTime, endTime) => {
    if (!date || !startTime || !endTime) return "upcoming";

    try {
      const now = new Date();
      const sessionDate = new Date(date);
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(startH, startM, 0, 0);

      const endDateTime = new Date(sessionDate);
      endDateTime.setHours(endH, endM, 0, 0);

      if (now < startDateTime) return "upcoming";
      if (now >= startDateTime && now <= endDateTime) return "active";
      return "completed";
    } catch (e) {
      console.error("Error calculating session status:", e);
      return "upcoming";
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminSessions();
    } else {
      fetchApprovedSessions();
      fetchMySessions();
    }
  }, [user?.role]);

  const fetchApprovedSessions = async () => {
    try {
      const response = await fetch(API_BASE, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setApprovedSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load approved sessions', error);
    }
  };

  const fetchAdminSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAdminSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load admin sessions', error);
    }
  };

  const fetchMySessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/mine`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMySessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load your sessions', error);
    }
  };

  const handleEditSession = (session) => {
    setEditingSessionId(session._id);
    setIsEditing(true);
    setShowForm(true);
    setSubmitted(false);
    setErrors({});
    setSuccessMessage("");
    setServerError("");
    setFormData({
      moduleName: session.moduleName || "",
      description: session.description || "",
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : "",
      time: session.time || "",
      endTime: session.endTime || "",
      sessionLink: session.sessionLink || "",
      maxStudents: session.maxStudents ? String(session.maxStudents) : "",
    });
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        await fetchMySessions();
        await fetchApprovedSessions();
      }
    } catch (error) {
      console.error('Delete session failed', error);
      setServerError('Unable to delete session. Please try again.');
    }
  };

  const handleShowParticipants = (session) => {
    setActiveParticipantSession(session);
    setShowParticipantsModal(true);
  };

  const handleCloseParticipants = () => {
    setActiveParticipantSession(null);
    setShowParticipantsModal(false);
  };

  const handleJoinSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (response.ok) {
        await fetchApprovedSessions();
        await fetchMySessions();
      }
    } catch (error) {
      console.error('Join session failed', error);
    }
  };

  const handleFeedbackSubmit = async (sessionId) => {
    if (!feedbackFormData.comment.trim()) return;
    setFeedbackLoading(true);
    try {
      const response = await fetch(`${API_BASE}/${sessionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(feedbackFormData),
      });

      if (response.ok) {
        setFeedbackFormData({ rating: 5, comment: "" });
        setActiveFeedbackSessionId(null);
        await fetchApprovedSessions();
        await fetchMySessions();
      }
    } catch (error) {
      console.error('Feedback submission failed', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const validateField = (name, value) => {
    const trimmed = String(value || "").trim();

    switch (name) {
      case "moduleName":
        if (!trimmed) return "Module name is required.";
        return "";
      case "description":
        if (!trimmed) return "Session description is required.";
        return "";
      case "date": {
        if (!trimmed) return "Session date is required.";
        const selected = new Date(trimmed);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) return "The date cannot be in the past.";
        return "";
      }
      case "time":
        if (!trimmed) return "Session time is required.";
        return "";
      case "endTime":
        if (!trimmed) return "Session end time is required.";
        return "";
      case "sessionLink":
        if (!trimmed) return "Session link is required.";
        if (!/^https?:\/\//i.test(trimmed)) return "Session link must begin with http:// or https://.";
        return "";
      case "maxStudents": {
        const count = Number(trimmed);
        if (!trimmed) return "Maximum student count is required.";
        if (!Number.isInteger(count) || count <= 0) return "Maximum student count must be a positive whole number.";
        return "";
      }
      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) nextErrors[key] = error;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (submitted && name === "date") {
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setServerError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token') || '';
      const method = isEditing ? 'PUT' : 'POST';
      const endpoint = isEditing ? `${API_BASE}/${editingSessionId}` : API_BASE;
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleName: formData.moduleName,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          endTime: formData.endTime,
          sessionLink: formData.sessionLink,
          maxStudents: formData.maxStudents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else if (data.message) {
          setServerError(data.message);
        } else {
          setServerError('Unable to save session. Please try again.');
        }
        return;
      }

      setSubmitted(true);
      setSuccessMessage(isEditing
        ? 'Session updated successfully and sent for admin approval.'
        : 'Session created successfully and sent for admin approval.');
      setFormData(defaultFormData);
      setIsEditing(false);
      setEditingSessionId(null);
      await fetchMySessions();
      if (isEditing) {
        await fetchApprovedSessions();
      }
    } catch (error) {
      console.error('Save session error:', error);
      setServerError('Network error while saving session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(defaultFormData);
    setErrors({});
    setSuccessMessage("");
    setServerError("");
    setSubmitted(false);
    setIsEditing(false);
    setEditingSessionId(null);
  };

  const handleApprove = async (sessionId) => {
    setAdminActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/${sessionId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        await fetchAdminSessions();
      }
    } catch (error) {
      console.error('Approve session failed', error);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleReject = async (sessionId) => {
    const reason = (rejectionReasonById[sessionId] || "").trim();
    setAdminActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/${sessionId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (response.ok) {
        setRejectionReasonById((current) => {
          const next = { ...current };
          delete next[sessionId];
          return next;
        });
        await fetchAdminSessions();
      }
    } catch (error) {
      console.error('Reject session failed', error);
    } finally {
      setAdminActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-6 py-7">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Peer Tutoring
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {user?.role === 'admin' ? 'Review Tutoring Sessions' : isEditing ? 'Edit a Tutoring Session' : 'Create a Tutoring Session'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            {user?.role === 'admin'
              ? 'As an admin, you can review submitted tutoring sessions and approve or reject them.'
              : isEditing
                ? 'Update the session details below and submit again for admin approval.'
                : 'Any student can create a session. Fill in the module, description, schedule, link and participant limit.'}
          </p>
          {user?.name && (
            <p className="mt-3 text-sm text-slate-500">
              Logged in as <span className="font-semibold text-slate-900">{user.name}</span>.
            </p>
          )}

          {user?.role !== 'admin' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowForm((current) => !current)}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {showForm ? 'Hide session form' : 'Create session'}
              </button>
            </div>
          )}
        </div>

        {user?.role === 'admin' ? (
          <section className="space-y-6">
            {adminSessions.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">There are no peer tutoring sessions submitted yet.</p>
              </div>
            ) : (
              adminSessions.map((session) => (
                <div key={session._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Created by <span className="font-semibold text-slate-900">{session.creator?.name || 'Unknown'}</span> ({session.creator?.email})</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">{session.moduleName}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{session.description}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <span className="block text-xs uppercase tracking-wide text-slate-400">Date</span>
                          <span className="font-medium text-slate-900">{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <span className="block text-xs uppercase tracking-wide text-slate-400">Time</span>
                          <span className="font-medium text-slate-900">{session.time}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <span className="block text-xs uppercase tracking-wide text-slate-400">Capacity</span>
                          <span className="font-medium text-slate-900">{session.maxStudents} students</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <span className="block text-xs uppercase tracking-wide text-slate-400">Status</span>
                          <span className="font-medium text-slate-900">{session.approvalStatus}</span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-indigo-700">
                        <a href={session.sessionLink} target="_blank" rel="noreferrer" className="underline">Open session link</a>
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:mt-0 sm:w-72">
                      {session.approvalStatus === 'pending' ? (
                        <>
                          <textarea
                            rows={3}
                            placeholder="Optional rejection reason"
                            value={rejectionReasonById[session._id] || ""}
                            onChange={(event) =>
                              setRejectionReasonById((current) => ({
                                ...current,
                                [session._id]: event.target.value,
                              }))
                            }
                            className="h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleApprove(session._id)}
                            disabled={adminActionLoading}
                            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(session._id)}
                            disabled={adminActionLoading}
                            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          This session was <span className="font-semibold text-slate-900">{session.approvalStatus}</span>.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        ) : (
          <>
            {showForm ? (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Session details</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        All fields are required. The date cannot be in the past and will be locked after submission.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="moduleName">
                        Module name
                      </label>
                      <input
                        id="moduleName"
                        name="moduleName"
                        value={formData.moduleName}
                        onChange={handleChange}
                        disabled={submitted}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      {errors.moduleName && <p className="mt-2 text-xs text-rose-600">{errors.moduleName}</p>}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={submitted}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      {errors.description && <p className="mt-2 text-xs text-rose-600">{errors.description}</p>}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="date">
                          Date
                        </label>
                        <input
                          id="date"
                          name="date"
                          type="date"
                          min={todayDateString()}
                          value={formData.date}
                          onChange={handleChange}
                          disabled={submitted}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        {errors.date && <p className="mt-2 text-xs text-rose-600">{errors.date}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="time">
                          Time
                        </label>
                        <input
                          id="time"
                          name="time"
                          type="time"
                          value={formData.time}
                          onChange={handleChange}
                          disabled={submitted}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        {errors.time && <p className="mt-2 text-xs text-rose-600">{errors.time}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="endTime">
                          End Time
                        </label>
                        <input
                          id="endTime"
                          name="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={handleChange}
                          disabled={submitted}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        {errors.endTime && <p className="mt-2 text-xs text-rose-600">{errors.endTime}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="sessionLink">
                        Session link
                      </label>
                      <input
                        id="sessionLink"
                        name="sessionLink"
                        type="url"
                        placeholder="https://example.com/meeting"
                        value={formData.sessionLink}
                        onChange={handleChange}
                        disabled={submitted}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      {errors.sessionLink && <p className="mt-2 text-xs text-rose-600">{errors.sessionLink}</p>}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="maxStudents">
                        Maximum students
                      </label>
                      <input
                        id="maxStudents"
                        name="maxStudents"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.maxStudents}
                        onChange={handleChange}
                        disabled={submitted}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      {errors.maxStudents && <p className="mt-2 text-xs text-rose-600">{errors.maxStudents}</p>}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="submit"
                        disabled={submitted || loading}
                        className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {loading ? "Saving..." : submitted ? "Session saved" : isEditing ? "Update session" : "Create session"}
                      </button>
                      {submitted && (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Create another session
                        </button>
                      )}
                    </div>
                  </form>

                  {serverError && (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                      {serverError}
                    </div>
                  )}

                  {successMessage && (
                    <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
                      {successMessage}
                    </div>
                  )}
                </section>

                <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Session rules</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Validation checks</h2>
                  </div>
                  <ul className="space-y-3 text-sm leading-6 text-slate-600">
                    <li className="rounded-2xl border border-slate-200 bg-white p-4">
                      <strong className="font-semibold text-slate-900">Date</strong> cannot be in the past and will be locked after submission.
                    </li>
                    <li className="rounded-2xl border border-slate-200 bg-white p-4">
                      <strong className="font-semibold text-slate-900">Session link</strong> must start with <span className="font-mono">http://</span> or <span className="font-mono">https://</span>.
                    </li>
                    <li className="rounded-2xl border border-slate-200 bg-white p-4">
                      <strong className="font-semibold text-slate-900">Maximum students</strong> must be a positive whole number greater than zero.
                    </li>
                  </ul>
                </aside>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">
                  Click the button above to open the session creation form.
                </p>
              </div>
            )}

            <section className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">My tutoring sessions</h2>
                <p className="mt-2 text-sm text-slate-500">Manage your submitted sessions and update or delete them before final approval.</p>
              </div>
              {mySessions.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-600">You have not created any tutoring sessions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySessions.map((session) => (
                    <div key={session._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{session.moduleName}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{session.description}</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                              <span className="block text-xs uppercase tracking-wide text-slate-400">Date</span>
                              <span className="font-medium text-slate-900">{new Date(session.date).toLocaleDateString()}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                              <span className="block text-xs uppercase tracking-wide text-slate-400">Time</span>
                              <span className="font-medium text-slate-900">{session.time} - {session.endTime}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                              <span className="block text-xs uppercase tracking-wide text-slate-400">Status</span>
                              <span className="font-medium text-slate-900">{session.approvalStatus}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                              <span className="block text-xs uppercase tracking-wide text-slate-400">Registered</span>
                              <span className="font-medium text-slate-900">{session.participants?.length || 0} students</span>
                            </div>
                          </div>

                          {session.feedbacks?.length > 0 && (
                            <div className="mt-6">
                              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recent Feedback ({session.feedbacks.length})</p>
                              <div className="mt-3 grid gap-3">
                                {session.feedbacks.slice(-3).map((fb, idx) => (
                                  <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-center gap-1 text-amber-500">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} className={i < fb.rating ? "text-amber-500" : "text-slate-200"}>★</span>
                                      ))}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600 italic">"{fb.comment}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {session.rejectionReason && (
                            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                              Rejection reason: {session.rejectionReason}
                            </p>
                          )}
                          <p className="mt-4 text-sm text-indigo-700">
                            <a href={session.sessionLink} target="_blank" rel="noreferrer" className="underline">Open session link</a>
                          </p>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:w-72">
                          {session.approvalStatus === 'approved' && getSessionStatus(session.date, session.time, session.endTime) === 'active' && (
                            <button
                              type="button"
                              onClick={() => window.open(session.sessionLink, '_blank', 'noopener,noreferrer')}
                              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Start session
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleShowParticipants(session)}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                          >
                            Participants info
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditSession(session)}
                            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session._id)}
                            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Available peer tutoring sessions</h2>
                <p className="mt-2 text-sm text-slate-500">Only approved sessions are visible to students.</p>
              </div>
              {approvedSessions.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-600">No approved sessions are available at the moment.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                    {approvedSessions.map((session) => (
                      <div key={session._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{session.moduleName}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{session.description}</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-4">
                              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                <span className="block text-xs uppercase tracking-wide text-slate-400">Date</span>
                                <span className="font-medium text-slate-900">{new Date(session.date).toLocaleDateString()}</span>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                <span className="block text-xs uppercase tracking-wide text-slate-400">Time</span>
                                <span className="font-medium text-slate-900">{session.time} - {session.endTime}</span>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                <span className="block text-xs uppercase tracking-wide text-slate-400">Capacity</span>
                                <span className="font-medium text-slate-900">{session.maxStudents} students</span>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                <span className="block text-xs uppercase tracking-wide text-slate-400">Joined</span>
                                <span className="font-medium text-slate-900">{session.participants?.length || 0} students</span>
                              </div>
                            </div>

                            {/* Feedback Form for joined users during active or completed sessions */}
                            {session.participants?.some(p => (p._id || p) === user?._id) && 
                             activeFeedbackSessionId === session._id && (
                              <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                                <h4 className="text-sm font-semibold text-indigo-900">
                                  {getSessionStatus(session.date, session.time, session.endTime) === 'active' 
                                    ? "Session in progress: Leave your feedback" 
                                    : "Session completed: Share your experience"}
                                </h4>
                                <div className="mt-3 flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setFeedbackFormData(prev => ({ ...prev, rating: star }))}
                                      className="text-2xl transition hover:scale-110"
                                    >
                                      <span className={star <= feedbackFormData.rating ? "text-amber-500" : "text-slate-300"}>★</span>
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="What did you think of this session?"
                                  value={feedbackFormData.comment}
                                  onChange={(e) => setFeedbackFormData(prev => ({ ...prev, comment: e.target.value }))}
                                  className="mt-3 w-full rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                  rows={2}
                                />
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => handleFeedbackSubmit(session._id)}
                                    disabled={feedbackLoading || !feedbackFormData.comment.trim()}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
                                  >
                                    {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                                  </button>
                                  <button
                                    onClick={() => setActiveFeedbackSessionId(null)}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:w-72">
                            {(() => {
                              const status = getSessionStatus(session.date, session.time, session.endTime);
                              const isJoined = session.participants?.some((p) => (p._id || p) === user?._id);
                              const alreadyHasFeedback = session.feedbacks?.some(fb => (fb.user?._id || fb.user) === user?._id);

                              if (status === 'completed') {
                                if (isJoined) {
                                  if (alreadyHasFeedback) {
                                    return (
                                      <button disabled className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400">
                                        Feedback submitted
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      onClick={() => {
                                        setActiveFeedbackSessionId(session._id === activeFeedbackSessionId ? null : session._id);
                                        setFeedbackFormData({ rating: 5, comment: "" });
                                      }}
                                      className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                      Give feedback
                                    </button>
                                  );
                                }
                                return (
                                  <button disabled className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400">
                                    Session ended
                                  </button>
                                );
                              }

                              // Status is active or upcoming
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isJoined) {
                                      window.open(session.sessionLink, '_blank', 'noopener,noreferrer');
                                    } else {
                                      handleJoinSession(session._id);
                                    }
                                  }}
                                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                                    isJoined
                                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                      : "border border-indigo-600 bg-white text-indigo-700 hover:bg-indigo-50"
                                  }`}
                                >
                                  {isJoined ? "Join session" : "Join session"}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showParticipantsModal && activeParticipantSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Joined users</h3>
                <p className="mt-1 text-sm text-slate-500">Participants for {activeParticipantSession.moduleName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">Total joined</p>
                <p className="text-2xl font-semibold text-slate-900">{activeParticipantSession.participants?.length || 0}</p>
              </div>
            </div>
            <div className="space-y-3 px-6 py-5">
              {activeParticipantSession.participants?.length ? (
                activeParticipantSession.participants.map((participant) => (
                  <div key={participant._id || participant} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{participant.name || participant}</p>
                    {participant.email && <p className="text-sm text-slate-500">{participant.email}</p>}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                  No users have joined this session yet.
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseParticipants}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerTutoring;
