// ForgotPassword.jsx - CORRECTED VERSION
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiHome } from "react-icons/fi";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/request-reset', { email });
      if (res.data.success) {
        setMessage(res.data.message);
      } else {
        setError(res.data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError("Too many requests. Please try again later.");
      } else {
        setError(err.response?.data?.message || 'Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Back/Home buttons in top-left corner */}
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
            <FiMail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="text-gray-600 mt-2">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* Success Message */}
        {message && (
          <Alert
            type="success"
            message={message}
            onClose={() => setMessage("")}
            autoClose
            autoCloseDuration={10000}
          />
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
          >
            Send Reset Link
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </p>
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