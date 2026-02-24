import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans">
      
      {/* Main Content Container */}
      <div className="text-center max-w-2xl">
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to AcademiSync
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          The collaborative learning platform for university students.
        </p>
        
        {/* Buttons Container */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          
          <Link 
            to="/login"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 w-full sm:w-auto text-center"
          >
            Login
          </Link>
          
          <Link 
            to="/register"
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 w-full sm:w-auto text-center"
          >
            Register
          </Link>
          
        </div>
      </div>
    </div>
  );
};

export default Home;