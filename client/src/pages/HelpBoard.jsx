import { Clock, Plus, ChevronDown, X, Search, Trash2 } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import RequestDetailModal from "../components/RequestDetailModal";
import { Link, useNavigate } from "react-router-dom";
import ChatRoom from "./ChatRoom";

const HelpBoard = () => {
    const navigate = useNavigate();
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [activeChatRequest, setActiveChatRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  //filters
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [facultyFilter, setFacultyFilter] = useState("All");
  const [filterAcademicYear, setFilterAcademicYear] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("You must be logged in to view the board.");
      }

      const response = await fetch("http://localhost:8000/api/request", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch help requests");
      }
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // click offer help button
  const handleOfferHelp = async (requestId) => {
    const targetRequest = requests.find((req) => req._id === requestId);
    const isOwnRequest =
      String(targetRequest?.requester?._id || "") === String(currentUser?._id || "");

    if (isOwnRequest) {
      alert("You cannot offer help on your own request.");
      return;
    }

    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/request/${requestId}/accept`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to accept help request");
      }

      // Open chat room after accepting
      const accepted = requests.find((r) => r._id === requestId);
      if (!accepted) throw new Error("Request not found in local state");
      
      navigate(`/chat/${requestId}`);
      
    } catch (error) {
      alert(error.message);
      fetchFeed();
    } finally {
      setActionLoading(null);
    }
  };

  // delete help request (admin only)
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to remove this help request from the board?")) {
      return;
    }

    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/request/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete help request");
      }

      // Remove from local state
      setRequests(requests.filter((r) => r._id !== requestId));
      alert("Request removed successfully");
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const facultyOptions = useMemo(() => {
    const set = new Set(
      requests.map((r) => r.requester?.faculty).filter(Boolean),
    );
    return ["All", ...Array.from(set).sort()];
  }, [requests]);

  const academicYearOptions = useMemo(() => {
    if (!requests.length) return ["All"];
    const set = new Set(
      requests
        .map((r) => r.requester?.academicYear)
        .filter((v) => v !== undefined && v !== "")
        .map((v) => String(v)),
    );
    return ["All", ...Array.from(set).sort()];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!requests.length) return [];
    return requests.filter((req) => {
      const urgencyMatch =
        urgencyFilter === "All" || req.urgencyLevel === urgencyFilter;
      const facultyMatch =
        facultyFilter === "All" || req.requester?.faculty === facultyFilter;
      const yearMatch =
        filterAcademicYear === "All" ||
        String(req.requester?.academicYear) === String(filterAcademicYear);

      const term = searchTerm.trim().toLowerCase();
      const searchMatch =
        term === "" ||
        req.topic?.toLowerCase().includes(term) ||
        req.description?.toLowerCase().includes(term) ||
        req.tags?.some((tag) => tag.toLowerCase().includes(term));
      return urgencyMatch && facultyMatch && yearMatch && searchMatch;
    });
  }, [requests, urgencyFilter, facultyFilter, filterAcademicYear, searchTerm]);

  const hasActiveFilters =
    urgencyFilter !== "All" ||
    facultyFilter !== "All" ||
    filterAcademicYear !== "All" ||
    searchTerm.trim() !== "";
  const clearFilters = () => {
    setUrgencyFilter("All");
    setFacultyFilter("All");
    setFilterAcademicYear("All");
    setSearchTerm("");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-400";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "Open":
        return "bg-amber-100 text-amber-800 border-amber-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "";
    const diff = Math.floor((Date.now() - new Date(dateValue)) / 60000);
    if (diff < 1) return "Just Now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} day(s) ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400 text-sm">Loading help requests...</p>
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
          {currentUser?.role === 'admin' ? 'Help Exchange Management' : 'University Help Board'}
        </h1>
        <div className="flex gap-4">
          {currentUser?.role !== 'admin' && (
            <>
              <Link
                to="/requests"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-95 transition-all duration-200"
              >
                <Plus size={15} strokeWidth={2.5} />
                Request Help
              </Link>

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
            </>
          )}
          {currentUser?.role === 'admin' && (
            <Link
              to="/helpboard"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 text-sm font-medium rounded-xl border border-slate-300 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200"
            >
              Help Board
            </Link>
          )}
          
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-slate-200">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by topic, tags or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder:text-slate-400"
          />
          {/* Clear search x button */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Urgency
          </label>
          <div className="relative">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm text-slate-700 bg-slate-50 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              {["All", "Low", "Medium", "Critical"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="h-10 w-px bg-slate-200 self-end mb-0.5" />

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Faculty
          </label>
          <div className="relative">
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm text-slate-700 bg-slate-50 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              {facultyOptions.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="h-10 w-px bg-slate-200 self-end mb-0.5" />

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Academic Year
          </label>
          <div className="relative">
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm text-slate-700 bg-slate-50 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
            >
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="ml-auto flex items-end gap-3 pb-0.5">
          <span className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {filteredRequests.length}
            </span>
            {""}
            of{" "}
            <span className="font-medium text-slate-700">
              {requests.length}
            </span>{" "}
            requests
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">
            {hasActiveFilters
              ? "No requests match your current filters."
              : "No open requests right now. The campus is bug-free!"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-indigo-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
            >
              <div
                className={`h-1 w-full ${getUrgencyBorder(req.urgencyLevel)}`}
              />

              {/* Card Header: Topic & Urgency */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setSelectedRequest(req)}>
                  <h3 className="text-lg font-semibold text-slate-900 leading-snug flex-1">
                    {req.topic}
                  </h3>
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getUrgencyColor(req.urgencyLevel)}`}
                    >
                      {req.urgencyLevel}
                    </span>
                    {req.status && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusColor(req.status)}`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-4">
                  Asked by{" "}
                  <span className=" font-medium text-slate-700">
                    {req.requester?.name || "A Student"}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  {req.requester?.faculty && (
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                      {req.requester.faculty}
                    </span>
                  )}
                  {req.requester?.academicYear && (
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                      {req.requester.academicYear} 
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                  {req.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {req.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-[12px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200"
                    >
                      # {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Action Button */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <Clock size={14} strokeWidth={2} />
                  {formatTime(req.createdAt)}
                </div>
                
                {currentUser?.role === 'admin' ? (
                  <button
                    onClick={() => handleDeleteRequest(req._id)}
                    disabled={actionLoading === req._id}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-white text-sm font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 shadow-sm"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    {actionLoading === req._id ? "Removing..." : "Remove"}
                  </button>
                ) : req.status === 'Resolved' ? (
                  <span className="text-xs font-medium px-3 py-1.5 bg-green-100 text-green-700 rounded-lg border border-green-300">
                    ✓ Resolved
                  </span>
                ) : (
                  <button
                    onClick={() => handleOfferHelp(req._id)}
                    disabled={
                      actionLoading === req._id ||
                      String(req.requester?._id || "") === String(currentUser?._id || "")
                    }
                    className="flex items-center gap-1.5 px-5 py-1.5 text-white text-sm font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    {actionLoading === req._id
                      ? "Locking Request..."
                      : String(req.requester?._id || "") === String(currentUser?._id || "")
                        ? "Your Request"
                        : "Offer Help"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {activeChatRequest?._id && (
  <div className="mt-6">
    <ChatRoom
      requestId={activeChatRequest._id}
      requestTopic={activeChatRequest.topic}
      onClose={() => setActiveChatRequest(null)}
    />
  </div>
)}
        </div>
      )}

       <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        showOfferHelp={currentUser?.role !== 'admin'}
        onOfferHelp={handleOfferHelp}
        actionLoading={actionLoading === selectedRequest?._id}
      />

    </div>
  );
};
export default HelpBoard;
