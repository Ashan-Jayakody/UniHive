import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, Users, Link as LinkIcon, Plus, CheckCircle, XCircle, AlertCircle, Info, Pencil, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api/sessions';

const StarRating = ({ rating, setRating, interactive = false }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={!interactive}
        onClick={() => setRating && setRating(star)}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
      >
        <svg
          className={`h-5 w-5 ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))}
  </div>
);

// Reusable session form (shared between Create and Edit modals)
const SessionForm = ({ onSubmit, submitLabel, onCancel, formData, handleInputChange, formErrors }) => (
  <form onSubmit={onSubmit} className="p-6 space-y-4">
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Topic</label>
      <input 
        name="topic" value={formData.topic} onChange={handleInputChange}
        placeholder="e.g. Advanced Calculus Review"
        className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
          formErrors.topic ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500/20'
        }`}
      />
      {formErrors.topic && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.topic}</p>}
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
      <textarea 
        name="description" value={formData.description} onChange={handleInputChange}
        placeholder="Describe what will be covered..."
        rows="3"
        className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
          formErrors.description ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500/20'
        }`}
      />
      {formErrors.description && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.description}</p>}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Date</label>
        <input 
          type="date" name="date" value={formData.date} onChange={handleInputChange}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
            formErrors.date ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500/20'
          }`}
        />
        {formErrors.date && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.date}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Time</label>
        <input 
          type="time" name="time" value={formData.time} onChange={handleInputChange}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
            formErrors.time ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500/20'
          }`}
        />
        {formErrors.time && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.time}</p>}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Capacity</label>
        <input 
          type="number" name="capacity" value={formData.capacity} onChange={handleInputChange}
          placeholder="Max students"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
            formErrors.capacity ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500/20'
          }`}
        />
        {formErrors.capacity && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.capacity}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meeting Link</label>
        <input 
          name="meetingLink" value={formData.meetingLink} onChange={handleInputChange}
          placeholder="Zoom / Meet link"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
            formErrors.meetingLink ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500/20'
          }`}
        />
        {formErrors.meetingLink && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.meetingLink}</p>}
      </div>
    </div>

    <div className="pt-4 flex gap-3">
      <button 
        type="button" onClick={onCancel}
        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
      >
        Cancel
      </button>
      <button 
        type="submit"
        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition active:scale-95"
      >
        {submitLabel}
      </button>
    </div>
  </form>
);


const PeerTutoring = () => {
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedSessionParticipants, setSelectedSessionParticipants] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(null); // stores sessionId
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });
  const [sessionFeedback, setSessionFeedback] = useState(null); // stores list for a session
  const [highlightedSession, setHighlightedSession] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    date: '',
    time: '',
    capacity: '',
    meetingLink: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchSessions();
    fetchMyEnrollments();
  }, []);

  useEffect(() => {
    if (!loading && sessions.length > 0) {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('sessionId');
      if (sessionId) {
        setHighlightedSession(sessionId);
        setTimeout(() => {
          const element = document.getElementById(`session-${sessionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [loading, sessions, location.search]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch sessions');
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setMyEnrollments(data);
    } catch (err) {
      console.error('Failed to fetch enrollments', err);
    }
  };

  const handleEnroll = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${sessionId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to enroll');
      
      alert('Successfully registered! A reminder will be sent to you before the session starts.');
      fetchSessions();
      fetchMyEnrollments();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchParticipants = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${sessionId}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch participants');
      setSelectedSessionParticipants(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchFeedback = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${sessionId}/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch feedback');
      setSessionFeedback({ sessionId, data });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${showFeedbackModal}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit feedback');
      
      alert('Feedback submitted! Thank you.');
      setShowFeedbackModal(null);
      setFeedbackData({ rating: 5, comment: '' });
      fetchSessions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendReminders = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${sessionId}/remind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send reminders');
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Shared validation for both create and update
  const validateForm = () => {
    const errors = {};
    if (!formData.topic || formData.topic.trim().length < 5) errors.topic = 'Topic must be at least 5 characters.';
    if (!formData.description || formData.description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
    if (!formData.date) errors.date = 'Date is required.';
    if (formData.date && new Date(formData.date) < new Date().setHours(0,0,0,0)) errors.date = 'Date cannot be in the past.';
    if (!formData.time) errors.time = 'Time is required.';
    if (!formData.capacity || parseInt(formData.capacity) <= 0) errors.capacity = 'Capacity must be positive.';
    if (!formData.meetingLink || !formData.meetingLink.startsWith('http')) errors.meetingLink = 'Invalid meeting link (must start with http/https).';
    return errors;
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create session');
      
      setShowCreateModal(false);
      setFormData({ topic: '', description: '', date: '', time: '', capacity: '', meetingLink: '' });
      fetchSessions();
      alert('Session created successfully and is pending admin approval.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditClick = (session) => {
    setEditingSessionId(session._id);
    setFormData({
      topic: session.topic,
      description: session.description,
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
      time: session.time,
      capacity: session.capacity.toString(),
      meetingLink: session.meetingLink
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${editingSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update session');
      
      setShowEditModal(false);
      setEditingSessionId(null);
      setFormData({ topic: '', description: '', date: '', time: '', capacity: '', meetingLink: '' });
      fetchSessions();
      alert('Session updated successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete session');
      
      setShowDeleteConfirm(null);
      fetchSessions();
      fetchMyEnrollments();
      alert('Session deleted successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }
      fetchSessions();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium"><CheckCircle size={12}/> Approved</span>;
      case 'Rejected': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium"><XCircle size={12}/> Rejected</span>;
      case 'Pending': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium"><AlertCircle size={12}/> Pending</span>;
      default: return null;
    }
  };

  const isEnrolled = (sessionId) => myEnrollments.some(e => e.session._id === sessionId);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Sessions & Peer Tutoring</h1>
          <p className="text-slate-500 text-sm mt-1">Connect with mentors and peers for collaborative learning.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setFormErrors({});
              setFormData({ topic: '', description: '', date: '', time: '', capacity: '', meetingLink: '' });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Create Session
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><p>Loading sessions...</p></div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div 
              key={session._id} 
              id={`session-${session._id}`}
              className={`bg-white border rounded-2xl p-5 hover:shadow-md transition group flex flex-col ${
                highlightedSession === session._id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Users size={20} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-2">
                  {/* Edit & Delete buttons for the session creator */}
                  {session.tutor?._id === currentUser._id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(session)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Edit Session"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(session._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {getStatusBadge(session.status)}
                </div>
              </div>
              
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="font-bold text-slate-800 text-lg line-clamp-1 flex-1">{session.topic}</h3>
                {session.reviewCount > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-100 shrink-0">
                    <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[10px] font-bold text-amber-700">{session.averageRating}</span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-2 line-clamp-2 min-h-[40px]">{session.description}</p>
              
              <div className="mt-5 space-y-2.5 flex-1">
                <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                  <Calendar size={15} className="text-indigo-500" />
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                  <Clock size={15} className="text-indigo-500" />
                  <span>{session.time}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                  <Users size={15} className="text-indigo-500" />
                  <span>{session.participants?.length || 0} / {session.capacity} students</span>
                </div>
                {(isAdmin || session.tutor?._id === currentUser._id || isEnrolled(session._id)) && (
                   <div className={`flex items-center gap-2.5 text-xs font-bold p-2 rounded-lg border mt-2 ${
                     isEnrolled(session._id) 
                       ? 'text-green-600 bg-green-50 border-green-100' 
                       : 'text-indigo-600 bg-indigo-50 border-indigo-100'
                   }`}>
                     <LinkIcon size={14} />
                     <a href={session.meetingLink} target="_blank" rel="noreferrer" className="underline">
                       {session.tutor?._id === currentUser._id ? 'Meeting Link (Tutor)' : isAdmin ? 'Meeting Link (Admin)' : 'Join Meeting'}
                     </a>
                   </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-50 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {session.tutor?.name?.charAt(0) || 'T'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{session.tutor?.name || 'Unknown Tutor'}</span>
                  </div>
                  
                  {session.tutor?._id === currentUser._id && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => fetchParticipants(session._id)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        View Participants
                      </button>
                      {session.status === 'Approved' && (
                        <button 
                          onClick={() => handleSendReminders(session._id)}
                          className="text-[10px] font-bold text-amber-600 hover:underline"
                        >
                          Send Reminders
                        </button>
                      )}
                    </div>
                  )}
                  {session.status === 'Approved' && (
                     <button 
                        onClick={() => fetchFeedback(session._id)}
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition"
                      >
                        View Ratings {session.reviewCount > 0 ? `(${session.reviewCount})` : ''}
                      </button>
                  )}
                </div>
                
                {isAdmin && session.status === 'Pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(session._id, 'Approved')} className="flex-1 py-2 bg-green-600 text-white text-[11px] font-bold rounded-xl hover:bg-green-700 active:scale-95 transition">Approve</button>
                    <button onClick={() => updateStatus(session._id, 'Rejected')} className="flex-1 py-2 bg-red-600 text-white text-[11px] font-bold rounded-xl hover:bg-red-700 active:scale-95 transition">Reject</button>
                  </div>
                ) : (
                  !isAdmin && session.tutor?._id !== currentUser._id && session.status === 'Approved' && (
                    <div className="flex flex-col gap-2">
                       <button 
                        disabled={isEnrolled(session._id) || (session.participants?.length >= session.capacity)}
                        onClick={() => handleEnroll(session._id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                          isEnrolled(session._id) 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : (session.participants?.length >= session.capacity)
                              ? 'bg-red-50 text-red-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700'
                        }`}
                      >
                        {isEnrolled(session._id) ? 'Already Registered' : (session.participants?.length >= session.capacity ? 'Full Capacity' : 'Register Now')}
                      </button>
                      
                      {isEnrolled(session._id) && new Date(session.date) <= new Date() && (
                        <button 
                          onClick={() => setShowFeedbackModal(session._id)}
                          className="w-full py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[11px] font-bold hover:bg-amber-100 transition"
                        >
                          Give Feedback
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants Modal */}
      {selectedSessionParticipants && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-lg font-bold">Session Participants</h2>
              <button onClick={() => setSelectedSessionParticipants(null)} className="hover:bg-white/10 p-1 rounded-lg transition"><XCircle size={20}/></button>
            </div>
            <div className="p-5 max-h-[400px] overflow-y-auto">
              {selectedSessionParticipants.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">No participants registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedSessionParticipants.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {p.student?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{p.student?.name}</p>
                        <p className="text-[11px] text-slate-500">{p.student?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">Create Tutoring Session</h2>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition"><XCircle size={22}/></button>
            </div>
            <SessionForm 
              onSubmit={handleCreateSession} 
              submitLabel="Create Session" 
              onCancel={() => setShowCreateModal(false)} 
              formData={formData}
              handleInputChange={handleInputChange}
              formErrors={formErrors}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-500 text-white">
              <h2 className="text-xl font-bold">Edit Tutoring Session</h2>
              <button onClick={() => { setShowEditModal(false); setEditingSessionId(null); }} className="hover:bg-white/10 p-1.5 rounded-lg transition"><XCircle size={22}/></button>
            </div>
            <SessionForm 
              onSubmit={handleUpdateSession} 
              submitLabel="Update Session" 
              onCancel={() => { setShowEditModal(false); setEditingSessionId(null); }} 
              formData={formData}
              handleInputChange={handleInputChange}
              formErrors={formErrors}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Session?</h3>
              <p className="text-sm text-slate-500 mb-6">
                This action cannot be undone. All enrollments and feedback for this session will also be deleted.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteSession(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-red-100 transition active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Submission Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-amber-500 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">Session Feedback</h2>
              <button onClick={() => setShowFeedbackModal(null)} className="hover:bg-white/10 p-1 rounded-lg transition"><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rate your experience</label>
                <StarRating 
                  rating={feedbackData.rating} 
                  setRating={(r) => setFeedbackData({...feedbackData, rating: r})} 
                  interactive={true}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Comments</label>
                <textarea 
                  required
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({...feedbackData, comment: e.target.value})}
                  placeholder="Share your thoughts on this session..."
                  rows="4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-amber-100 transition active:scale-95"
              >
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session Feedback View Modal */}
      {sessionFeedback && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-800 text-white">
              <h2 className="text-lg font-bold">What others said</h2>
              <button onClick={() => setSessionFeedback(null)} className="hover:bg-white/10 p-1 rounded-lg transition"><XCircle size={20}/></button>
            </div>
            <div className="p-5 max-h-[500px] overflow-y-auto">
              {sessionFeedback.data.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                   <Info className="text-slate-300" size={40} />
                   <p className="text-slate-400 text-sm">No feedback has been submitted for this session yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sessionFeedback.data.map((fb) => (
                    <div key={fb._id} className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {fb.student?.name?.charAt(0) || 'S'}
                           </div>
                           <span className="text-xs font-bold text-slate-700">{fb.student?.name}</span>
                        </div>
                        <StarRating rating={fb.rating} />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">"{fb.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerTutoring;
