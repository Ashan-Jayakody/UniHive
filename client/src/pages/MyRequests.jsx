import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ChevronRight, Plus } from "lucide-react";
import RequestDetailModal from "../components/RequestDetailModal";

const MyRequests = () => {
  const [requests,        setRequests]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchMyRequests(); }, []);

  const fetchMyRequests = async () => {
    try {
      const token    = typeof window !== "undefined" ? localStorage.getItem('token') : null;
      const response = await fetch('http://localhost:8000/api/request/myrequests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch my requests");
      setRequests(Array.isArray(data.myRequests) ? data.myRequests : []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'In Progress': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Resolved':    return 'bg-green-100 text-green-700 border border-green-200';
      default:            return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const getAccentBar = (status) => {
    switch (status) {
      case 'Open':        return 'bg-amber-400';
      case 'In Progress': return 'bg-indigo-500';
      case 'Resolved':    return 'bg-green-500';
      default:            return 'bg-slate-300';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };


  const inProgress = requests.filter((r) => r.status === 'In Progress').length;
  const open       = requests.filter((r) => r.status === 'Open').length;
  const resolved   = requests.filter((r) => r.status === 'Resolved').length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <p className="text-slate-400 text-sm">Loading your requests...</p>
    </div>
  );
  if (error) return (
    <div className="flex justify-center items-center h-64">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );


  return (
    <div className="max-w-5xl mx-auto px-6 py-7">

      <div className="flex items-start justify-between mb-8">
        <div>
          
          <h1 className="text-3xl font-semibold text-gray-800">My Help Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage all the help requests you have submitted.
          </p>
        </div>
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

      {/* Stat summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xl font-semibold text-indigo-600">{inProgress}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">In Progress</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xl font-semibold text-amber-500">{open}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">Open</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xl font-semibold text-green-600">{resolved}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">Resolved</p>
        </div>
      </div>

   
      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-400 text-sm">You haven't submitted any help requests yet.</p>
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={12} strokeWidth={2.5} />
            Create your first request
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex items-stretch hover:shadow-sm transition-shadow"
            >
             
              <div className={`w-1 flex-shrink-0 ${getAccentBar(req.status)}`} />

             
              <div className="flex flex-1 items-center gap-4 px-5 py-4">

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="text-medium font-semibold text-slate-900 truncate">
                      {req.topic}
                    </p>
                    <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  {req.status === 'In Progress' && req.acceptedHelper && (
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px] mt-3 font-semibold text-teal-700 flex-shrink-0">
                        {getInitials(req.acceptedHelper.name)}
                      </div>
                      <p className="text-sm mt-4 text-slate-500">
                        <span className="font-medium  text-slate-700">{req.acceptedHelper.name}</span>
                        {' '}is helping you
                      </p>
                    </div>
                  )}
                  {req.status === 'Open' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-amber-500 fill-none" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
                      <p className="text-xs text-amber-600 font-medium">Waiting for a helper to accept</p>
                    </div>
                  )}
                  {req.status === 'Resolved' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-green-600 mt-3 fill-none" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      <p className="text-xs text-green-600 font-medium">Resolved</p>
                      {req.rating && (
                        <div className="flex items-center gap-0.5 ml-1">
                          {[1,2,3,4,5].map((s) => (
                            <svg key={s} width="11" height="11" viewBox="0 0 24 24" strokeWidth="1.5"
                              className={s <= req.rating ? 'fill-amber-400 stroke-amber-400' : 'fill-slate-200 stroke-slate-300'}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={10} strokeWidth={1.5} />
                    {formatTime(req.createdAt)}
                  </div>
                </div>


                <div className="flex items-center gap-2 flex-shrink-0">

                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                  >
                    Details
                    <ChevronRight size={12} />
                  </button>

                  {req.status === 'In Progress' && (
                    <button
                      onClick={() => navigate(`/chat/${req._id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 flex-shrink-0"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      Go to Chat
                    </button>
                  )}
                  {req.status === 'Resolved' && (
                    <button
                      onClick={() => navigate(`/chat/${req._id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all active:scale-95"
                    >
                      View history
                    </button>
                  )}
                  {req.status === 'Open' && (
                    <button
                      disabled
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg border border-slate-200 cursor-not-allowed"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><circle cx="5" cy="12" r="3"/>
                      </svg>
                      Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />

    </div>
  );
};

export default MyRequests;