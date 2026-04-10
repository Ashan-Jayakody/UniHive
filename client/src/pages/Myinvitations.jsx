import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const MyInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = { Authorization: `Bearer ${token}` };

      const invRes = await fetch(
        "http://localhost:8000/api/request/invitations",
        { headers },
      );
      const invData = await invRes.json();

      const taskRes = await fetch(
        "http://localhost:8000/api/request/my-tasks",
        { headers },
      );
      const taskData = await taskRes.json();

      if (!invRes.ok)
        throw new Error(invData.error || "Failed to fetch invitations");
      if (!taskRes.ok)
        throw new Error(taskData.error || "Failed to fetch tasks");

      setInvitations(invData.invitations || []);
      setTasks(taskData.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/request/${requestId}/accept`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      navigate(`/chat/${requestId}`);
    } catch (err) {
      alert(err.message);
      fetchAllData();
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case "Low":
        return "bg-green-100 text-green-800 border-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "Critical":
        return "bg-red-100 text-red-800 border-red-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyBorder = (level) => {
    switch (level) {
      case "Low":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "Critical":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-400 text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-7">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-sans font-bold mb-8 text-gray-800">
          My Invitations & Tasks
          <p className="mt-1 text-sm text-slate-500">
            Manage your pending invitations and active helping tasks.
          </p>
        </h1>

        <div className="flex gap-4">
          <Link
            to="/helpboard"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 text-sm font-medium rounded-xl border border-slate-300 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200"
          >
            Help Board
          </Link>
          <Link
            to="/invitations"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 text-sm font-medium rounded-xl border border-slate-300 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200"
          >
            My Invitations
          </Link>
          <Link
            to="/myrequests"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 text-sm font-medium rounded-xl border border-slate-300 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200"
          >
            My Requests
          </Link>
        </div>
      </div>

      {/*stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xl font-semibold text-amber-500">
            {invitations.length}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
            Pending Invitations
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xl font-semibold text-indigo-600">
            {tasks.length}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
            Active Tasks
          </p>
        </div>
      </div>

      {/*pending invitations*/}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
            Pending Invitations
          </h2>
          <span className="text-[13px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
            {invitations.length} waiting
          </span>
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">
              No pending invitations right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {invitations.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex items-stretch hover:shadow-sm transition-shadow"
              >
                <div
                  className={`w-1 flex-shrink-0 bg-blue-600`}
                />

                <div className="flex flex-1 items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex iems-center gap-2 mb-1 flex-wrap">
                      <p className="text-lg font-semibold text-slate-900 truncate">
                        {inv.topic}
                      </p>
                      {inv.urgencyLevel && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${getUrgencyColor(inv.urgencyLevel)}`}
                        >
                          {inv.urgencyLevel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] font-semibold text-indigo-700 flex-shrink-0">
                        {getInitials(inv.requester?.name)}
                      </div>
                      <p className="text-sm text-slate-500">
                        Invited by{" "}
                        <span className="font-medium text-indigo-600">
                          {inv.requester?.name || "A Student"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccept(inv._id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 flex-shrink-0"
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*avtive helping tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
            Active Helping Tasks
          </h2>
          <span className="text-[13px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            {tasks.length} active
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">
              Not currently helping anyone. Accept an invitation to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex items-stretch hover:shadow-sm transition-shadow"
              >
                <div
                  className={`w-1 flex-shrink-0 bg-blue-600`}
                />

                <div className="flex flex-1 items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-lg font-semibold text-slate-900 truncate">
                        {task.topic}
                      </p>

                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
                        In Progress
                      </span>

                      {task.urgencyLevel && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getUrgencyColor(task.urgencyLevel)}`}
                        >
                          {task.urgencyLevel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[8px] font-semibold text-teal-700 flex-shrink-0">
                        {getInitials(task.requester?.name)}
                      </div>
                      <p className="text-sm text-slate-500">
                        Helping{" "}
                        <span className="font-medium text-slate-700">
                          {task.requester?.name || "A Student"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/chat/${task._id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 flex-shrink-0"
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Go to Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInvitations;
