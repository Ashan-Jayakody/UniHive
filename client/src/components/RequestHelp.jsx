import React, { useState } from "react";
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
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  //get users token
  const token = localStorage.getItem("token");

  const submitData = new FormData();

  //to lowercase and trim tags before sending to backend
   const formattedTags = formData.tags
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== '');
    
  submitData.append("topic", formData.topic);
  submitData.append("description", formData.description);
  submitData.append("urgencyLevel", formData.urgencyLevel);
  submitData.append("tags", formData.tags);

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
      throw new Error(data.error || "An error occured");
    }

    console.log("Successfully Created Request:", data.helpRequest);
    setMatchedHelpers(data.helpers);
    setNewRequestId(data.helpRequest._id);
    setShowModal(true); //opens expert matching modal
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
      {/*topic*/}
      <div>
        <label className="block font-medium mn-1">Topic</label>
        <input
          type="text"
          name="topic"
          required
          className="w-full border p-2 rounded"
          placeholder="python pandas Merge Error"
          value={formData.topic}
          onChange={handleChange}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          name="description"
          required
          rows="4"
          className="w-full border p-2 rounded"
          placeholder="Describe what you are stuck on..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      {/* Tags & Urgency (Side by Side) */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            required
            className="w-full border p-2 rounded"
            placeholder="Python, React, Database"
            value={formData.tags}
            onChange={handleChange}
          />
        </div>
        <div className="w-1/3">
          <label className="block font-medium mb-1">Urgency</label>
          <select
            name="urgencyLevel"
            className="w-full border p-2 rounded"
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
          Attach Screenshot/Code (Optional)
        </label>
        <input type="file" onChange={handleFileChange} className="w-full" />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
      >
        Post Request
      </button>
    </form>

    {/* Placeholder for the Modal */}
    <ExpertMatch
      isOpen={showModal}
      helpers={matchedHelpers}
      requestId={newRequestId}
      onClose={() => {
        setShowModal(false);
        //add here to redirect to the dashboard or etc
      }}
    />

  </div>
);
};

export default RequestHelp;