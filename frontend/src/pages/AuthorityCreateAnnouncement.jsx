// frontend/src/pages/AuthorityCreateAnnouncement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBell, FiSend } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function AuthorityCreateAnnouncement() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    target_audience: "all_clubs",
    specific_clubs: [],
  });
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const authority = JSON.parse(localStorage.getItem("authority") || "{}");

  useEffect(() => {
    if (!authority.token) {
      navigate("/authority/login");
      return;
    }

    fetchClubs();
  }, [authority.token, navigate]);

  const fetchClubs = async () => {
    try {
      const headers = { Authorization: `Bearer ${authority.token}` };
      const res = await axios.get("http://localhost:5000/api/authority/clubs", { headers });
      if (res.data.success) {
        setClubs(res.data.clubs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClubSelection = (clubId) => {
    const clubIdNum = parseInt(clubId);
    setFormData(prev => ({
      ...prev,
      specific_clubs: prev.specific_clubs.includes(clubIdNum)
        ? prev.specific_clubs.filter(id => id !== clubIdNum)
        : [...prev.specific_clubs, clubIdNum]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${authority.token}` };
      const payload = {
        ...formData,
        created_by: authority.id
      };

      const res = await axios.post("http://localhost:5000/api/authority/announcements", payload, { headers });

      if (res.data.success) {
        setSuccess("Announcement created successfully!");
        setTimeout(() => navigate("/authority/dashboard"), 2000);
      } else {
        setError(res.data.message || "Failed to create announcement");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!authority.token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-4">
          <Button
            variant="ghost"
            icon={FiArrowLeft}
            onClick={() => navigate("/authority/dashboard")}
            className="text-white hover:bg-white/20"
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Administrative Announcement</h1>
            <p className="text-sm text-indigo-100">Broadcast important updates to clubs and students</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-6">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter detailed message..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="club_creation">Club Creation</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all_clubs">All Clubs</option>
                  <option value="all_students">All Students</option>
                  <option value="specific_clubs">Specific Clubs</option>
                </select>
              </div>
            </div>

            {formData.target_audience === "specific_clubs" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Clubs <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {clubs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No clubs available</p>
                  ) : (
                    <div className="space-y-2">
                      {clubs.map((club) => (
                        <label key={club.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.specific_clubs.includes(club.id)}
                            onChange={() => handleClubSelection(club.id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{club.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This announcement will be visible to the selected audience immediately after creation.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                icon={FiSend}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
              >
                {loading ? "Creating..." : "Create Announcement"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/authority/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
