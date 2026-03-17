import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import AcademicCommunication from './pages/AcademicCommunication';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/communication" element={<AcademicCommunication />} />
      </Routes>
    </Router>
  );
}

export default App;