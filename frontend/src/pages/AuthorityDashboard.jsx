// frontend/src/pages/AuthorityDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiLogOut,
  FiUsers,
  FiCalendar,
  FiBell,
  FiPlus,
  FiSettings,
  FiEdit,
  FiTrash2,
  FiShield,
  FiTrendingUp,
  FiActivity,
  FiBarChart2,
  FiPieChart
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function AuthorityDashboard() {
  const [authority, setAuthority] = useState(null);
  const [stats, setStats] = useState({ clubs: 0, members: 0, events: 0, announcements: 0 });
  const [clubs, setClubs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("authority");
    if (!userData) {
      navigate("/authority/login");
      return;
    }

    const parsedData = JSON.parse(userData);
    setAuthority(parsedData);
    fetchData(parsedData.token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats
      const statsRes = await axios.get("http://localhost:5000/api/authority/dashboard/stats", { headers });
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch clubs
      const clubsRes = await axios.get("http://localhost:5000/api/authority/clubs", { headers });
      if (clubsRes.data.success) {
        setClubs(clubsRes.data.clubs);
      }

      // Fetch announcements
      const announcementsRes = await axios.get("http://localhost:5000/api/authority/announcements", { headers });
      if (announcementsRes.data.success) {
        setAnnouncements(announcementsRes.data.announcements);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authority");
    navigate("/authority/login");
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${authority.token}` };
      const res = await axios.delete(`http://localhost:5000/api/authority/clubs/${clubId}`, { headers });

      if (res.data.success) {
        setClubs(clubs.filter(club => club.id !== clubId));
        setError("");
        alert("Club deleted successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete club");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${authority.token}` };
      const res = await axios.delete(`http://localhost:5000/api/authority/announcements/${id}`, { headers });

      if (res.data.success) {
        setAnnouncements(announcements.filter(a => a.id !== id));
        alert("Announcement deleted successfully");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FiShield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Authority Dashboard</h1>
                <p className="text-sm text-indigo-100">Welcome, {authority?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                icon={FiHome}
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20"
              >
                Home
              </Button>
              <Button
                variant="ghost"
                icon={FiLogOut}
                onClick={handleLogout}
                className="text-white hover:bg-white/20"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Clubs</p>
                <p className="text-3xl font-bold text-gray-800">{stats.clubs}</p>
              </div>
              <FiUsers className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Members</p>
                <p className="text-3xl font-bold text-gray-800">{stats.members}</p>
              </div>
              <FiUsers className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-gray-800">{stats.events}</p>
              </div>
              <FiCalendar className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Announcements</p>
                <p className="text-3xl font-bold text-gray-800">{stats.announcements}</p>
              </div>
              <FiBell className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-4 font-medium transition-colors border-b-2 ${
                  activeTab === "overview"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("clubs")}
                className={`py-4 px-4 font-medium transition-colors border-b-2 ${
                  activeTab === "clubs"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Clubs Management
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`py-4 px-4 font-medium transition-colors border-b-2 ${
                  activeTab === "announcements"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Announcements
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button
                        className="w-full justify-start"
                        icon={FiPlus}
                        onClick={() => navigate("/authority/create-club")}
                      >
                        Create New Club
                      </Button>
                      <Button
                        className="w-full justify-start"
                        icon={FiBell}
                        onClick={() => navigate("/authority/create-announcement")}
                      >
                        Create Announcement
                      </Button>
                      <Button
                        className="w-full justify-start"
                        icon={FiUsers}
                        onClick={() => setActiveTab("clubs")}
                      >
                        Manage Clubs
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Role:</strong> {authority?.designation}</p>
                      <p><strong>Email:</strong> {authority?.email}</p>
                      <p><strong>Privileges:</strong> Full Administrative Access</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clubs Tab */}
            {activeTab === "clubs" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">All Clubs</h3>
                  <Button
                    icon={FiPlus}
                    onClick={() => navigate("/authority/create-club")}
                  >
                    Create New Club
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {clubs.map((club) => (
                    <div key={club.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800">{club.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                          <div className="flex gap-4 mt-3 text-sm text-gray-500">
                            <span><strong>{club.member_count}</strong> members</span>
                            <span><strong>{club.event_count}</strong> events</span>
                            <span>Created: {new Date(club.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={FiEdit}
                            onClick={() => navigate(`/authority/clubs/${club.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={FiTrash2}
                            onClick={() => handleDeleteClub(club.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {clubs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FiUsers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>No clubs found. Create your first club!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === "announcements" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Administrative Announcements</h3>
                  <Button
                    icon={FiPlus}
                    onClick={() => navigate("/authority/create-announcement")}
                  >
                    Create Announcement
                  </Button>
                </div>

                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{announcement.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              announcement.type === 'urgent' ? 'bg-red-100 text-red-700' :
                              announcement.type === 'event' ? 'bg-blue-100 text-blue-700' :
                              announcement.type === 'club_creation' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {announcement.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{announcement.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            By {announcement.creator_name} • {new Date(announcement.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={FiTrash2}
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}

                  {announcements.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FiBell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>No announcements yet. Create your first announcement!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
