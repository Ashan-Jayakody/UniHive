import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft, Star, CheckCircle } from 'lucide-react';
import { socket } from '../socket';
import { useNavigate, useParams } from 'react-router-dom';

const REQUEST_API = 'http://localhost:8000/api/request';

const ChatRoom = () => {
  const { id: requestId } = useParams();
  const navigate          = useNavigate();

  const [messages,    setMessages]    = useState([]);
  const [newMessage,  setNewMessage]  = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [topic,       setTopic]       = useState('');
  const [description, setDescription] = useState('');
  const [attachment,  setAttachment]  = useState(null);
  const [status,      setStatus]      = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [helperId,    setHelperId]    = useState('');
  const [helperName,  setHelperName]  = useState('');

 
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showRating,   setShowRating]   = useState(false);
  const [rating,       setRating]       = useState(0);
  const [hoverRating,  setHoverRating]  = useState(0);
  const [summary,      setSummary]      = useState('');
  const [resolving,    setResolving]    = useState(false);

  const bottomRef = useRef(null);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();

  const isRequester = currentUser?._id === requesterId ||
                      String(currentUser?._id) === String(requesterId);

 
  useEffect(() => {
    if (!requestId) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${REQUEST_API}/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setMessages(data.helpRequest?.discussion   || []);
          setTopic(data.helpRequest?.topic           || '');
          setDescription(data.helpRequest?.description || '');
          setAttachment(data.helpRequest?.attachmentUrl || null);
          setStatus(data.helpRequest?.status         || '');
          setRequesterId(String(data.helpRequest?.requester?._id || data.helpRequest?.requester || ''));
          setHelperId(String(data.helpRequest?.acceptedHelper?._id || data.helpRequest?.acceptedHelper || ''));
          setHelperName(data.helpRequest?.acceptedHelper?.name || 'your helper');
        }
      } catch (err) {
        console.error('Fetch failed:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId]);

  // Socket room 
  useEffect(() => {
    if (!currentUser) return;
    socket.emit('join-room', {
      roomId:   requestId,
      userId:   currentUser._id,
      userName: currentUser.name,
    });
    const onNewMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('new-message', onNewMessage);
    return () => {
      socket.off('new-message', onNewMessage);
      socket.emit('leave-room', { roomId: requestId, userName: currentUser.name });
    };
  }, [requestId, currentUser?._id]);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message 
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic = {
      _id: Date.now(), message: text,
      sender: { _id: currentUser._id, name: currentUser.name },
      createdAt: new Date().toISOString(), optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${REQUEST_API}/${requestId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => prev.map((m) => (m.optimistic ? data.discussion.at(-1) : m)));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.optimistic));
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  //Resolve request 
  const handleResolve = async () => {
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }
    setResolving(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${REQUEST_API}/${requestId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ summary, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('Resolved');
      setShowRating(false);
    } catch (err) {
      alert(err.message || 'Failed to resolve request');
    } finally {
      setResolving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwn = (msg) =>
    msg.sender?._id === currentUser?._id ||
    String(msg.sender) === String(currentUser?._id);

  const getStatusBadge = () => {
    if (status === 'Resolved')    return 'bg-green-100 text-green-700 border border-green-200';
    if (status === 'In Progress') return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    return 'bg-slate-100 text-slate-500 border border-slate-200';
  };

 
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-56px)]">

      {/* top*/}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold uppercase tracking-widest text-blue-600">
              Chat Room
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate">{topic || 'Help Request'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status badge */}
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${getStatusBadge()}`}>
            {status}
          </span>

          
          {isRequester && status === 'In Progress' && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-all active:scale-95"
            >
              <CheckCircle size={13} strokeWidth={2} />
              Mark as Solved
            </button>
          )}

        
          {status === 'Resolved' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
              <CheckCircle size={13} strokeWidth={2} />
              Resolved
            </span>
          )}
        </div>
      </div>

     
      {(description || attachment) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex-shrink-0">
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Description: </span>
              {description}
            </p>
          )}
          {attachment && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Attachment
              </p>
              {attachment.match(/\.(jpeg|jpg|png|gif)(\?.*)?$/i) ? (
                <img
                  src={attachment.startsWith('http') ? attachment : `http://localhost:8000${attachment}`}
                  alt="Attachment"
                  className="max-h-40 rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(attachment.startsWith('http') ? attachment : `http://localhost:8000${attachment}`, '_blank')}
                />
              ) : (
                <a
                  href={attachment.startsWith('http') ? attachment : `http://localhost:8000${attachment}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100"
                >
                  View attached document
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* messages*/}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {loading ? (
          <p className="text-center text-xs text-slate-400 mt-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400 mt-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, index) => {
            const own = isOwn(msg);
            return (
              <div
                key={msg._id || index}
                className={`flex items-end gap-2 ${own ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!own && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-semibold text-indigo-700 flex-shrink-0">
                    {getInitials(msg.sender?.name)}
                  </div>
                )}
                <div className={`max-w-[70%] flex flex-col gap-1 ${own ? 'items-end' : 'items-start'}`}>
                  {!own && (
                    <p className="text-[10px] font-medium text-slate-500 px-1">
                      {msg.sender?.name || 'Unknown'}
                    </p>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    own
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  } ${msg.optimistic ? 'opacity-60' : ''}`}>
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-slate-400 px-1">{formatTime(msg.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3 border-t border-slate-200 flex-shrink-0">
        {status === 'Resolved' ? (
          <div className="flex items-center justify-center py-3 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle size={14} className="text-green-600 mr-2" />
            <p className="text-xs text-green-700 font-medium">
              This request has been resolved. The chat is now closed.
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              className="flex-1 resize-none px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder:text-slate-400"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

  
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Mark as solved?</p>
                <p className="text-xs text-slate-500">This will close the chat and notify your helper.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 mb-5 leading-relaxed">
              Once resolved, the discussion will be closed and you will be asked to rate your helper. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); setShowRating(true); }}
                className="flex-1 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                Yes, mark solved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* rating*/}
      {showRating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowRating(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900 mb-1 text-center">
              Rate your helper
            </p>
            <p className="text-xs text-slate-500 text-center mb-5">
              How well did{' '}
              <span className="font-medium text-indigo-600">{helperName}</span>{' '}
              help you?
            </p>

            {/* Star rating */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={32}
                    strokeWidth={1.5}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 stroke-amber-400'
                        : 'fill-slate-200 stroke-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

           
            {(hoverRating || rating) > 0 && (
              <p className="text-center text-xs font-medium text-amber-600 mb-4">
                {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent!'][hoverRating || rating]}
              </p>
            )}

           
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add a short summary (optional)..."
              rows={3}
              className="w-full resize-none text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-slate-400"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={rating === 0 || resolving}
                className="flex-1 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resolving ? 'Submitting...' : 'Submit & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatRoom;