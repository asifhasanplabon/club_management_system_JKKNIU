import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

// --- New Imports ---
import { FiUser, FiMail, FiLock, FiUsers, FiHome, FiArrowLeft } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";
// --------------------

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    clubId: "",
  });
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // <-- New state
  const navigate = useNavigate();

  // Fetch clubs from backend (no change)
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/clubs");
        setClubs(res.data.clubs || []);
      } catch (err) {
        console.error("Error fetching clubs:", err);
        setError("Failed to load club list.");
      }
    };
    fetchClubs();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // <-- Clear error on new submit

    if (!formData.clubId) {
      setError("Please select a club");
      return;
    }

    setLoading(true); // <-- Set loading true
    try {
      const res = await axios.post("http://localhost:5000/api/users/register", formData);
      if (res.data.success) {
        // Redirect to login after success
        navigate("/login"); 
      } else {
        setError(res.data.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false); // <-- Set loading false
    }
  };

  // --- JSX completely updated to match Login.jsx pattern ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Back/Home buttons */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Button
          variant="ghost"
          icon={FiArrowLeft}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Button
          variant="ghost"
          icon={FiHome}
          onClick={() => navigate("/")}
        >
          Home
        </Button>
      </div>

      {/* Main form card */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join a club and get started</p>
        </div>

        {/* Replaced <p> with <Alert> component */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wrapped inputs in labeled divs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Club to Join
            </label>
            <div className="relative">
              <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="clubId"
                value={formData.clubId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select Club</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Replaced <button> with <Button> component */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}