import React, { useState, useEffect } from 'react';

const MyInvitations = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch('http://localhost:5001/api/request/invitations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            setInvitations(data.invitations);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Acceptance handle part
    const handleAccept = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/request/${requestId}/accept`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            alert("Invitation Accepted! You are now the official helper.");
            
            // Remove it from the invitations list
            setInvitations(invitations.filter(inv => inv._id !== requestId));
            
            // Optional: Redirect to the chat room
            // window.location.href = `/chat/${requestId}`;

        } catch (err) {
            alert(err.message); 
            fetchInvitations(); // Refresh the list
        }
    };

    if (loading) return <div>Loading your invitations...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto mt-8 p-4">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Direct Help Invitations</h2>

            {invitations.length === 0 ? (
                <div className="bg-gray-50 text-gray-500 p-6 rounded text-center">
                    You have no pending invitations right now.
                </div>
            ) : (
                <div className="space-y-4">
                    {invitations.map((inv) => (
                        <div key={inv._id} className="bg-white border-l-4 border-blue-500 shadow p-4 rounded flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{inv.topic}</h3>
                                <p className="text-sm text-gray-600">
                                    Invited by: <span className="font-semibold">{inv.requester?.name}</span>
                                </p>
                                <div className="mt-2 flex gap-2">
                                    {inv.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleAccept(inv._id)}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors"
                            >
                                Accept Request
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyInvitations;