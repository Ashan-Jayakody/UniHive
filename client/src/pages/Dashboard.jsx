import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token'); // Clear the token
        navigate('/login'); // Send back to login
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
                
                <p className="text-gray-600 text-lg">
                    Welcome to your hub! Here you will soon be able to view your courses, track your reputation points, and access your bookmarked resources.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;