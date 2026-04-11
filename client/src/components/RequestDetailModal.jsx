// src/components/RequestDetailModal.jsx
import { X, Clock, Tag, User, AlertCircle, MessageSquare } from 'lucide-react';

const RequestDetailModal = ({ request, onClose, onOfferHelp, onAccept, showOfferHelp = false, showAccept = false, actionLoading = false }) => {
  if (!request) return null;

  const getUrgencyBadge = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-700 border border-red-200';
      case 'High':     return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Medium':   return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Low':      return 'bg-green-100 text-green-700 border border-green-200';
      default:         return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const getUrgencyAccent = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-500';
      case 'High':     return 'bg-orange-400';
      case 'Medium':   return 'bg-yellow-400';
      case 'Low':      return 'bg-green-500';
      default:         return 'bg-slate-300';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Progress': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Resolved':    return 'bg-green-100 text-green-700 border border-green-200';
      case 'Open':        return 'bg-amber-100 text-amber-700 border border-amber-200';
      default:            return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString([], {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className={`h-1.5 w-full ${getUrgencyAccent(request.urgencyLevel)}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getUrgencyBadge(request.urgencyLevel)}`}>
                {request.urgencyLevel}
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                {request.status}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 leading-snug">
              {request.topic}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Requester info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
              {getInitials(request.requester?.name)}
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none mb-0.5">Requested by</p>
              <p className="text-sm font-medium text-slate-800">
                {request.requester?.name || 'A Student'}
              </p>
            </div>
            {request.requester?.faculty && (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full font-medium">
                {request.requester.faculty}
              </span>
            )}
            {request.requester?.academicYear && (
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full font-medium">
                Year {request.requester.academicYear}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Description */}
          {request.description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Description
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {request.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {request.tags?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {request.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attachment */}
          {request.attachmentUrl && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Attachment
              </p>
              {request.attachmentUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <img
                  src={request.attachmentUrl.startsWith('http') ? request.attachmentUrl : `http://localhost:5000${request.attachmentUrl}`}
                  alt="Attachment"
                  className="max-h-40 rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(request.attachmentUrl.startsWith('http') ? request.attachmentUrl : `http://localhost:5000${request.attachmentUrl}`, '_blank')}
                />
              ) : (
                <a
                  href={request.attachmentUrl.startsWith('http') ? request.attachmentUrl : `http://localhost:5000${request.attachmentUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 hover:text-indigo-800"
                >
                  View attached document
                </a>
              )}
            </div>
          )}

          {/* Helper info — shown when In Progress or Resolved */}
          {request.acceptedHelper && (
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-2">
                Helper
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-semibold text-indigo-800">
                  {getInitials(request.acceptedHelper?.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    {request.acceptedHelper?.name}
                  </p>
                  <p className="text-[10px] text-indigo-500">Currently helping</p>
                </div>
              </div>
            </div>
          )}

          {/* Rating — shown when Resolved */}
          {request.status === 'Resolved' && request.rating && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-2">
                Rating given
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="16" height="16"
                    viewBox="0 0 24 24"
                    className={star <= request.rating ? 'fill-amber-400 stroke-amber-400' : 'fill-slate-200 stroke-slate-300'}
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
                <span className="text-xs text-amber-700 font-medium ml-1">
                  {request.rating}/5
                </span>
              </div>
              {request.summary && (
                <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
                  {request.summary}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock size={11} strokeWidth={1.5} />
            <span>Posted {formatDate(request.createdAt)}</span>
          </div>

        </div>

        {/* Footer actions */}
        {(showOfferHelp || showAccept) && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            {showOfferHelp && (
              <button
                onClick={() => onOfferHelp(request._id)}
                disabled={actionLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  request.urgencyLevel === 'Critical' ? 'bg-red-500 hover:bg-red-600' :
                  request.urgencyLevel === 'High'     ? 'bg-orange-500 hover:bg-orange-600' :
                  request.urgencyLevel === 'Low'      ? 'bg-green-600 hover:bg-green-700' :
                                                        'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <MessageSquare size={14} strokeWidth={2} />
                {actionLoading ? 'Locking...' : 'Offer Help'}
              </button>
            )}
            {showAccept && (
              <button
                onClick={() => onAccept(request._id)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare size={14} strokeWidth={2} />
                {actionLoading ? 'Accepting...' : 'Accept Invitation'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetailModal;