import React, {useState} from "react";

const ExpertMatch = ({isOpen, helpers, requestId, onClose}) => {
    const [selectedExperts, setSelectedExperts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if(! isOpen) return null;

    const toggleSelection = (helperId) => {
        if(selectedExperts.includes(helperId)) {
            setSelectedExperts(selectedExperts.filter(id => id!== helperId));
        }else{
            setSelectedExperts([...selectedExperts, helperId]);
        }
    };


    const handleInvite = async() => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');

        try{
            const response= await fetch(`http://localhost:5001/api/request/${requestId}/invite`,{
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({expertIds: selectedExperts})
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.error || 'Failed to send invitations');
            }
            alert('Invitations sent successfully');
            onClose();

        }catch (err) {
            setError(err.message);
        }finally {
            setLoading(false);
        }
    };


return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-2">Expert Matches Found!</h2>
                
                {helpers.length > 0 ? (
                    <p className="text-gray-600 mb-4">
                        We found some students who excel in these topics. Select up to 3 to invite directly:
                    </p>
                ) : (
                    <p className="text-gray-600 mb-4">
                        We couldn't find exact matches right now, but your request is live on the public board!
                    </p>
                )}

                {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

                {/* List of Experts */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {helpers.map((helper) => (
                        <div 
                            key={helper._id} 
                            onClick={() => toggleSelection(helper._id)}
                            className={`p-3 border rounded cursor-pointer transition-colors ${
                                selectedExperts.includes(helper._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg">{helper.name}</h4>
                                    <p className="text-sm text-gray-500">Skills: {(helper.expertiseAreas || []).join(', ')}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                                        ⭐ {helper.rating || 'New'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Skip for now
                    </button>
                    
                    {helpers.length > 0 && (
                        <button 
                            onClick={handleInvite}
                            disabled={loading || selectedExperts.length === 0}
                            className={`px-4 py-2 rounded text-white font-bold ${
                                selectedExperts.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                            }`}
                        >
                            {loading ? 'Sending...' : `Invite Selected (${selectedExperts.length}/3)`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpertMatch;
