import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import faculties from '../utils/faculties'; // Import the object

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'student', 
        faculty: '', course: '', academicYear: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // If the user changes the faculty, reset the course to empty
        if (name === 'faculty') {
            setFormData({ ...formData, faculty: value, course: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, academicYear: Number(formData.academicYear) })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            alert('Registration successful! You can now log in.');
            navigate('/login'); // Redirect to login page
            
        } catch (err) {
            setError(err.message);
        }
    };

    // Extract faculty names for the first dropdown
    const facultyOptions = Object.keys(faculties);
    
    // Extract courses for the second dropdown based on the selected faculty
    const availableCourses = formData.faculty ? faculties[formData.faculty] : [];

    // Shared input styling
    const inputStyle = "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Register</h2>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required className={inputStyle} />
                    <input type="email" name="email" placeholder="Email" onChange={handleChange} required className={inputStyle} />
                    <input type="password" name="password" placeholder="Password" onChange={handleChange} required className={inputStyle} />
                    
                    {/* Role Dropdown */}
                    <select name="role" value={formData.role} onChange={handleChange} required className={inputStyle}>
                        <option value="student">Student</option>
                        <option value="faculty">Faculty Member</option>
                        <option value="admin">Admin</option>
                    </select>

                    {/* Faculty Dropdown */}
                    <select name="faculty" value={formData.faculty} onChange={handleChange} required className={inputStyle}>
                        <option value="" disabled>Select Faculty</option>
                        {facultyOptions.map(faculty => (
                            <option key={faculty} value={faculty}>{faculty}</option>
                        ))}
                    </select>

                    {/* Dependent Course Dropdown */}
                    <select name="course" value={formData.course} onChange={handleChange} required disabled={!formData.faculty} className={`${inputStyle} ${!formData.faculty ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                        <option value="" disabled>
                            {formData.faculty ? "Select Course" : "Select Faculty First"}
                        </option>
                        {availableCourses.map(course => (
                            <option key={course} value={course}>{course}</option>
                        ))}
                    </select>

                    {/* Academic Year Dropdown */}
                    <select name="academicYear" value={formData.academicYear} onChange={handleChange} required className={inputStyle}>
                        <option value="" disabled>Select Academic Year</option>
                        {[1, 2, 3, 4].map(year => (
                            <option key={year} value={year}>Year {year}</option>
                        ))}
                    </select>

                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-300">
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;