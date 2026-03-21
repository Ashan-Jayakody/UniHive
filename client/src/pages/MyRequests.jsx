import React, {useState, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";

const MyRequests = () => {
    const [requests, setRequests] = useState([]);

    return (<div>
        <h1 className="text-3xl font-extrabold mb-8 text-gray-800">
          My Help Requests
        </h1>
        <div className="flex gap-4">
          <Link
            to="/helpboard"
            className="flex items-center gap-2 px-6 py-3 mb-6 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            Back to Help Board
          </Link>
    </div>  
        {requests.length === 0 ? (
            <p className="text-gray-600">You haven't created any help requests yet.</p>
        ) : (
            <div className="space-y-4">
                {requests.map((request) => (
                    <div key={request._id} className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-bold text-gray-800">{request.topic}</h2>
                        <p className="text-gray-600">{request.description}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
);
}
export default MyRequests;