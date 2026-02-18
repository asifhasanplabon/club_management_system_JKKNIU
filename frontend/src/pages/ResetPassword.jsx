import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

export default function ResetPassword() {
  const { token } = useParams(); // Get the token from the URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call the new backend route
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token: token,
        newPassword: password,
      });

      if (res.data.success) {
        setMessage(res.data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/jkkniu2.jpg')" }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-700">
          Reset Your Password
        </h2>

        {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}
        {message && (
          <div className="text-center">
            <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 mb-3 text-sm">{message}</p>
            <p className="text-gray-600 text-sm">Redirecting to login...</p>
          </div>
        )}

        {!message && ( // Hide form after success
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 mb-4">
              Enter your new password below.
            </p>
            <input
              type="password"
              name="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mb-3"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-3 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}