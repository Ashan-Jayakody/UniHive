import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpertMatch from "./ExpertMatch";

const RequestHelp = () => {
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    urgencyLevel: "Medium",
    tags: "",
  });

  const [attachment, setAttachment] = useState(null);
  const [newRequestId, setNewRequestId] = useState(null);
  const [matchedHelpers, setMatchedHelpers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: null });
    }
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
    if (validationErrors.attachment) {
      setValidationErrors({ ...validationErrors, attachment: null });
    }
  };

  //validations 
  const validateForm = () => {
    const errors = {};

    if (formData.topic.trim().length < 15) {
      errors.topic = "Topic must be at least 15 characters long.";
    }
    else if (/^\d+$/.test(formData.topic)) {
      errors.topic = "Topic cannot be just numbers. Please provide a descriptive title.";
    }

    if (formData.description.trim().length > 250) {
      errors.description = "Please detail (max 250 characters). Include what you've tried!";
    }

if (formData.tags.trim().endsWith(',')) {
  errors.tags = "Tags cannot end with a comma.";
} else {
  const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

  if (tagsArray.length === 0) {
    errors.tags = "Please add at least one tag.";
  } 

  else if (tagsArray.length > 5) {
    errors.tags = "Please limit to a maximum of 5 tags.";
  } 

  else {
   
    const alphanumericRegex = /^[a-zA-Z0-9 ]+$/; 
    const hasInvalidTags = tagsArray.some(tag => !alphanumericRegex.test(tag));

    if (hasInvalidTags) {
      errors.tags = "Tags cannot contain special characters (like $, @, +, -).";
    }
  }
}
    if (attachment) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      if (attachment.size > maxSize) {
        errors.attachment = "File size must be under 5MB.";
      } else if (!allowedTypes.includes(attachment.type)) {
        errors.attachment = "Only JPG, PNG, and PDF files are allowed.";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({}); // Reset validation errors on new submit

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return; 
    }

    
    const token = localStorage.getItem("token");
    const submitData = new FormData();

    const formattedTags = formData.tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag !== '')
      .join(','); 
      
    submitData.append("topic", formData.topic);
    submitData.append("description", formData.description);
    submitData.append("urgencyLevel", formData.urgencyLevel);
    submitData.append("tags", formattedTags); 

    if (attachment) {
      submitData.append("attachment", attachment);
    }

  
    try {
      const response = await fetch("http://localhost:5000/api/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      console.log("Successfully Created Request:", data.helpRequest);
      setMatchedHelpers(data.helpers);
      setNewRequestId(data.helpRequest._id);
      setShowModal(true); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-6">Ask for Help</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic */}
        <div>
          <label className="block font-medium mb-1">Topic</label>
          <input
            type="text"
            name="topic"
            required
            className={`w-full border p-2 rounded ${validationErrors.topic ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="React Router v6 nested routes throwing 404"
            value={formData.topic}
            onChange={handleChange}
          />
          {/* Validation Message */}
          {validationErrors.topic && <p className="text-red-500 text-sm mt-1 font-medium">{validationErrors.topic}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            required
            rows="4"
            className={`w-full border p-2 rounded ${validationErrors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Describe what you are stuck on, what you have tried, and any error messages..."
            value={formData.description}
            onChange={handleChange}
          />
          {/* Validation Message */}
          {validationErrors.description && <p className="text-red-500 text-sm mt-1 font-medium">{validationErrors.description}</p>}
        </div>

        {/* Tags & Urgency */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              required
              className={`w-full border p-2 rounded ${validationErrors.tags ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="python, react, database"
              value={formData.tags}
              onChange={handleChange}
            />
             {/* Validation Message*/}
             {validationErrors.tags && <p className="text-red-500 text-sm mt-1 font-medium">{validationErrors.tags}</p>}
          </div>
          <div className="w-1/3">
            <label className="block font-medium mb-1">Urgency</label>
            <select
              name="urgencyLevel"
              className="w-full border p-2 rounded border-gray-300"
              value={formData.urgencyLevel}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block font-medium mb-1">
            Attach Screenshot/Code (Optional, Max 5MB)
          </label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
          />
          {/* Validation Message */}
          {validationErrors.attachment && <p className="text-red-500 text-sm mt-1 font-medium">{validationErrors.attachment}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md mt-4"
        >
          Post Request
        </button>
      </form>

      <ExpertMatch
        isOpen={showModal}
        helpers={matchedHelpers}
        requestId={newRequestId}
        onClose={() => {
          setShowModal(false);
          navigate('/myrequests'); 
        }}
      />
    </div>
  );
};

export default RequestHelp;