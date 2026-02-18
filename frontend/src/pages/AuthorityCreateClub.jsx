// frontend/src/pages/AuthorityCreateClub.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowLeft, FiPlus, FiUsers } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function AuthorityCreateClub() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    president_name: "",
    president_email: "",
    president_password: "",
    secretary_name: "",
    secretary_email: "",
    secretary_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const authority = JSON.parse(localStorage.getItem("authority") || "{}");

  if (!authority.token) {
    navigate("/authority/login");
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${authority.token}` };
      const res = await axios.post("http://localhost:5000/api/authority/clubs/create", formData, { headers });
      
      if (res.data.success) {
        setSuccess("Club created successfully!");
        setTimeout(() => navigate("/authority/dashboard"), 2000);
      } else {
        setError(res.data.message || "Failed to create club");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold">Create New Club</h1>
            <p className="text-sm text-indigo-100">Add a new club to the system</p>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Club Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 pb-2 border-b">
                <FiUsers className="w-5 h-5" />
                <span>Club Information</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter club name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe the club's mission and activities"
                />
              </div>
            </div>

            {/* President Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 pb-2 border-b">
                <FiUsers className="w-5 h-5" />
                <span>President Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    President Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="president_name"
                    value={formData.president_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter president's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    President Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="president_email"
                    value={formData.president_email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="president@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  President Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="president_password"
                  value={formData.president_password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter a secure password (min 6 characters)"
                />
              </div>
            </div>

            {/* Secretary Information (Optional) */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 pb-2 border-b">
                <FiUsers className="w-5 h-5" />
                <span>Secretary Information (Optional)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secretary Name
                  </label>
                  <input
                    type="text"
                    name="secretary_name"
                    value={formData.secretary_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter secretary's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secretary Email
                  </label>
                  <input
                    type="email"
                    name="secretary_email"
                    value={formData.secretary_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="secretary@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secretary Password
                </label>
                <input
                  type="password"
                  name="secretary_password"
                  value={formData.secretary_password}
                  onChange={handleChange}
                  minLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter a secure password (min 6 characters)"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                icon={FiPlus}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
              >
                {loading ? "Creating Club..." : "Create Club"}
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
