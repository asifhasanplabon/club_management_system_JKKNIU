// Login.jsx - Pre-selection of club before login
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiLogIn, FiHome, FiUsers } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "", clubId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clubList, setClubList] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const navigate = useNavigate();

  // Fetch all clubs on component mount
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/clubs");
        if (res.data.success) {
          setClubList(res.data.clubs || []);
          if (res.data.clubs && res.data.clubs.length > 0) {
            setFormData(prev => ({ ...prev, clubId: res.data.clubs[0].id }));
          }
        }
      } catch (err) {
        console.error("Error fetching clubs:", err);
        setError("Failed to load clubs. Please refresh the page.");
      } finally {
        setLoadingClubs(false);
      }
    };
    fetchClubs();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate club selection
    if (!formData.clubId || formData.clubId === "") {
      setError("Please select a club");
      return;
    }
    
    setLoading(true);

    try {
      // Send clubId along with email and password
      const res = await axios.post("http://localhost:5000/api/club_members/login", formData);

      if (res.data.success) {
        // Store user with token in localStorage
        const userData = {
          ...res.data.user,
          token: res.data.token
        };
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/");
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 429) {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError(err.response?.data?.message || "Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          icon={FiHome}
          onClick={() => navigate("/")}
        >
          Home
        </Button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {loadingClubs ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading clubs...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Club Selection - First */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Club
              </label>
              <div className="relative">
                <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="clubId"
                  value={formData.clubId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                  required
                >
                  <option value="">-- Select a Club --</option>
                  {clubList.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email - Second */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password - Third */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              icon={FiLogIn}
            >
              Sign In
            </Button>
          </form>
        )}

        <div className="mt-6 text-center space-y-2">
          <Link
            to="/forgot-password"
            className="text-sm text-green-600 hover:text-green-700 block"
          >
            Forgot your password?
          </Link>
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}