// frontend/src/pages/AuthorityLogin.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiLogIn, FiHome, FiShield } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function AuthorityLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/authority/login", formData);

      if (res.data.success) {
        // Store authority user data with token
        const userData = {
          ...res.data.user,
          token: res.data.token
        };
        localStorage.setItem("authority", JSON.stringify(userData));
        navigate("/authority/dashboard");
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Authority login error:", err);
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
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
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Authority Login</h2>
          <p className="text-gray-600 mt-2">Administrative Access Portal</p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FiMail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="authority@admin.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FiLock className="w-4 h-4" />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
            icon={FiLogIn}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Authority"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Regular user?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Login here
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            <strong>⚠️ Restricted Access:</strong> This login is for authorized administrative personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
