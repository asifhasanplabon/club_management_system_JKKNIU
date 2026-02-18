// frontend/src/pages/ClubManagement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiTrash2, FiEdit, FiUsers } from 'react-icons/fi';
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";

export default function ClubManagement() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user and check permissions
  useEffect(() => {
    const loggedAuthority = JSON.parse(localStorage.getItem("authority") || "{}");
    if (!loggedAuthority.token) {
      navigate("/authority/login");
      return;
    }
    
    setUser(loggedAuthority);
  }, [navigate]);

  // Fetch clubs
  useEffect(() => {
    if (!user) return;
    
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get('http://localhost:5000/api/authority/clubs', { headers });
        if (res.data.success) {
          setClubs(res.data.clubs || []);
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load clubs.");
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("authority");
    navigate("/authority/login");
  };

  const handleDeleteClub = async (clubId, clubName) => {
    if (!window.confirm(`Are you sure you want to delete "${clubName}"? This action cannot be undone and will delete all associated data.`)) {
      return;
    }

    setDeleting(clubId);
    setError('');
    setSuccess('');

    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await axios.delete(`http://localhost:5000/api/authority/clubs/${clubId}`, { headers });
      
      if (res.data.success) {
        setSuccess(`Club "${clubName}" deleted successfully.`);
        setClubs(clubs.filter(c => c.id !== clubId));
      } else {
        setError(res.data.message || "Failed to delete club.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "An error occurred while deleting the club.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || !user.token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <PageHeader title="Access Denied" />
        <main className="max-w-7xl mx-auto p-4 md:p-6">
          <Alert type="error" message="You do not have permission to access this page." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title="Club Management"
        subtitle="Create and manage all clubs"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Dashboard", path: "/dashboard" },
          { label: "Club Management" }
        ]}
        actions={
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={() => navigate('/clubs/create')}
          >
            Create New Club
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} autoClose />}

        {clubs.length === 0 ? (
          <Card>
            <EmptyState 
              title="No clubs yet" 
              description="Create your first club to get started."
              action={
                <Button
                  variant="primary"
                  icon={FiPlus}
                  onClick={() => navigate('/clubs/create')}
                >
                  Create Club
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Card key={club.id} hover>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{club.description}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                      <FiUsers className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={FiEdit}
                      onClick={() => navigate(`/clubs/${club.id}/settings`)}
                      fullWidth
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={FiTrash2}
                      onClick={() => handleDeleteClub(club.id, club.name)}
                      loading={deleting === club.id}
                      disabled={deleting === club.id}
                      fullWidth
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
