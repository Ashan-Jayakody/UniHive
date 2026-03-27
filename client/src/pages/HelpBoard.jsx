import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HelpBoard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

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

      const response = await fetch("http://localhost:5001/api/request", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch help requests");
      }
      setRequests(data.requests);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // click offer help button
  const handleOfferHelp = async (requestId) => {
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/request/${requestId}/accept`,
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
      alert(
        "You have accepted this help request! The requester will be notified and can choose to chat with you directly.",
      );
      // Update the request status in the UI
      setRequests(requests.filter((req) => req._id !== requestId));
    } catch (error) {
      alert(error.message);
      fetchFeed();
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case "Low":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyBorder = (level) => {
    switch (level) {
      case "Critical":
        return "border-red-400";
      case "Medium":
        return "border-yellow-400";
      case "Low":
        return "border-green-400";
      default:
        return "border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading help requests...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-800">
          University Help Board
        </h1>
        <div className="flex gap-4">
          <Link
            to="/requests"
            className="flex items-center gap-2 px-6 py-3 mb-6 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            Request Help
          </Link>

          <Link
            to="/invitations"
            className="flex items-center gap-2 px-6 py-3 mb-6 bg-slate-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            My Invitations
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No open requests right now. The campus is bug-free!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div
              key={req._id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 flex flex-col justify-between hover:shadow-lg transition-shadow ${getUrgencyBorder(req.urgencyLevel)}`}
            >
              {/* Card Header: Topic & Urgency */}
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {req.topic}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded uppercase ${getUrgencyColor(req.urgencyLevel)}`}
                  >
                    {req.urgencyLevel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Asked by{" "}
                  <span className="font-semibold">
                    {req.requester?.name || "A Student"}
                  </span>
                </p>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {req.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {req.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Action Button */}
              <div className="border-t pt-4">
                <button
                  onClick={() => handleOfferHelp(req._id)}
                  disabled={actionLoading === req._id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-blue-300"
                >
                  {actionLoading === req._id
                    ? "Locking Request..."
                    : "Offer Help"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default HelpBoard;
