// frontend/src/pages/ClubSettings.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiEdit, FiShield, FiCalendar, FiImage } from 'react-icons/fi';
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";

export default function ClubSettings() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user and check permissions
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login");
      return;
    }
    setUser(loggedUser);

    const isClubAdmin = loggedUser.role === 'admin' && loggedUser.club_id && loggedUser.club_id.toString() === clubId;
    const isAuthority = loggedUser.role === 'authority';

    if (!isClubAdmin && !isAuthority) {
      setError("You do not have permission to access this page.");
      setLoading(false);
    }
  }, [clubId, navigate]);

  // Fetch club data
  useEffect(() => {
    if (!user) return; // Wait for user check
    
    const fetchClub = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/clubs/${clubId}`);
        if (res.data.success) {
          setClub(res.data.club);
          setFormData({
            name: res.data.club.name,
            description: res.data.club.description
          });
        } else {
          setError("Club not found.");
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load club data.");
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [clubId, user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.put(`http://localhost:5000/api/clubs/${clubId}`, {
        ...formData,
        userId: user.id // Pass adminId for auth check
      });
      if (res.data.success) {
        setSuccess("Club details updated successfully!");
        setClub({ ...club, ...formData });
      } else {
        setError(res.data.message || "Failed to save.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  const pageTitle = club ? `Settings: ${club.name}` : "Club Settings";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title={pageTitle}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Clubs", path: "/clubs" },
          { label: club?.name || "...", path: `/clubs/${clubId}` },
          { label: "Settings" }
        ]}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} autoClose />}

        {(!user || (user.role !== 'admin' && user.role !== 'authority')) ? (
          <Alert type="error" message="You do not have permission to view this page." />
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                hover 
                onClick={() => navigate(`/clubs/${clubId}/manage-members`)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Members</h3>
                    <p className="text-sm text-gray-500">Manage members</p>
                  </div>
                </div>
              </Card>

              <Card 
                hover 
                onClick={() => navigate(`/view-executive/${clubId}`)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiShield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Executives</h3>
                    <p className="text-sm text-gray-500">Manage executive team</p>
                  </div>
                </div>
              </Card>

              <Card 
                hover 
                onClick={() => navigate(`/events/create`)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Events</h3>
                    <p className="text-sm text-gray-500">Create events</p>
                  </div>
                </div>
              </Card>

              <Card 
                hover 
                onClick={() => navigate(`/gallery/add`)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FiImage className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Gallery</h3>
                    <p className="text-sm text-gray-500">Upload images</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Club Details Form */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FiEdit className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Club Details</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/clubs/${clubId}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}