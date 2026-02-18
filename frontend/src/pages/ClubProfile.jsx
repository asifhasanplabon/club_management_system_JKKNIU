import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// --- Imports ---
import { FiUsers, FiCalendar, FiImage, FiChevronRight, FiSettings, FiUserCheck } from 'react-icons/fi';
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import { getImageUrl } from "../utils/imageHelper";

// Helper function
const formatDate = (d) => {
  if (!d) return "TBA";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
};

export default function ClubProfile() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get user from local storage
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedUser || null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Fetch all club details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`http://localhost:5000/api/clubs/${clubId}/details`);
        if (res.data.success) {
          setDetails(res.data.details);
        } else {
          setError("Failed to fetch club details.");
        }
      } catch (e) {
        setError(e.response?.data?.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [clubId]);

  // Check if the logged-in user is an admin of THIS club
  const isClubAdmin = user?.role === 'admin' && user?.club_id && String(user.club_id) === String(clubId);
  const isAuthority = user?.role === 'authority';
  const canEditClub = isClubAdmin || isAuthority;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <PageHeader title="Error" />
        <main className="max-w-4xl mx-auto p-4 md:p-6">
          <Alert type="error" message={error} />
        </main>
      </div>
    );
  }

  if (!details) return null;

  const { info, executives, events, images } = details;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title={info.name}
        subtitle="Club Profile"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Clubs", path: "/clubs" },
          { label: info.name }
        ]}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
        
        <Card>
          <div className="flex flex-col md:flex-row justify-between md:items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{info.name}</h1>
              <p className="mt-2 text-gray-600 max-w-2xl">{info.description}</p>
            </div>
            <div className="flex-shrink-0 mt-4 md:mt-0 flex flex-col items-end gap-3">
              {user && user.club_id && user.club_id.toString() === clubId ? (
                <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                  You are a member
                </span>
              ) : (
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/register')}
                >
                  Join this Club
                </Button>
              )}
              
              {/* --- NEW: Admin Buttons --- */}
              {(isClubAdmin || isAuthority) && (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    variant="outline"
                    icon={FiUserCheck}
                    onClick={() => navigate(`/clubs/${clubId}/manage-members`)}
                    fullWidth
                  >
                    Manage Members
                  </Button>
                  <Button
                    variant="outline"
                    icon={FiSettings}
                    onClick={() => navigate(`/clubs/${clubId}/settings`)}
                    fullWidth
                  >
                    Club Settings
                  </Button>
                </div>
              )}
              {/* --- END: Admin Buttons --- */}
              
            </div>
          </div>
        </Card>

        {/* --- Executive Committee Card --- */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <FiUsers className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-gray-800">Executive Committee</h2>
            </div>
            <div className="flex items-center gap-2">
              {(isClubAdmin || isAuthority) && (
                <Button 
                  variant="ghost"
                  size="sm"
                  icon={FiSettings}
                  className="text-green-600"
                  onClick={() => navigate(`/create-executive`)}
                >
                  Manage
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/view-executive/${clubId}`)}
                icon={FiChevronRight}
                iconPosition="right"
              >
                View All
              </Button>
            </div>
          </div>
          
          {executives.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {executives.map(exec => (
                <Link to={`/view-profile/${exec.id}`} key={exec.id || exec.email} className="text-center group p-2 rounded-lg hover:bg-gray-50">
                  <img src={getImageUrl(exec.photo)} alt={exec.name} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gray-200 group-hover:border-green-500 transition-colors" />
                  <p className="mt-2 text-sm font-semibold truncate">{exec.name}</p>
                  <p className="text-xs text-gray-500">{exec.position}</p>
                </Link>
              ))}
            </div>
          ) : <EmptyState description="No executive committee members listed." />}
        </Card>
        
        {/* --- Upcoming Events Card --- */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <FiCalendar className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/events")}
              icon={FiChevronRight}
              iconPosition="right"
            >
              View All
            </Button>
          </div>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events.map(event => (
                <Card 
                  key={event.id}
                  hover
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <p className="font-semibold text-gray-800">{event.title}</p>
                  <p className="text-sm text-green-600">{formatDate(event.date)}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                </Card>
              ))}
            </div>
          ) : <EmptyState description="No upcoming events for this club." />}
        </Card>

        {/* --- Recent Gallery Card --- */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <FiImage className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-gray-800">Recent Gallery</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/gallery?clubId=${clubId}`)}
              icon={FiChevronRight}
              iconPosition="right"
            >
              View Full Gallery
            </Button>
          </div>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {images.map(img => (
                <Link to={`/gallery?clubId=${clubId}`} key={img.id} className="block aspect-square rounded-lg overflow-hidden group shadow-sm border">
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </Link>
              ))}
            </div>
          ) : <EmptyState description="No images have been added to this club's gallery yet." />}
        </Card>

      </main>
    </div>
  );
}