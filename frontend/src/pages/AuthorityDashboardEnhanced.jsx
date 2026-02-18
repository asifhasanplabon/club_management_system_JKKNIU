// frontend/src/pages/AuthorityDashboardEnhanced.jsx
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
  FiEdit,
  FiTrash2,
  FiShield,
  FiTrendingUp,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiAlertCircle
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
  Line
} from "recharts";
import Button from "../components/Button";
import Alert from "../components/Alert";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AuthorityDashboardEnhanced() {
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

  // Prepare chart data
  const getClubMemberData = () => {
    return clubs
      .sort((a, b) => b.member_count - a.member_count)
      .slice(0, 10)
      .map(club => ({
        name: club.name.length > 20 ? club.name.substring(0, 20) + '...' : club.name,
        members: club.member_count,
        events: club.event_count
      }));
  };

  const getClubDistribution = () => {
    const ranges = [
      { range: '0-10', count: 0 },
      { range: '11-20', count: 0 },
      { range: '21-50', count: 0 },
      { range: '50+', count: 0 }
    ];

    clubs.forEach(club => {
      if (club.member_count <= 10) ranges[0].count++;
      else if (club.member_count <= 20) ranges[1].count++;
      else if (club.member_count <= 50) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges.filter(r => r.count > 0);
  };

  const getAnnouncementTypes = () => {
    const types = {};
    announcements.forEach(a => {
      types[a.type] = (types[a.type] || 0) + 1;
    });

    return Object.entries(types).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      value: count
    }));
  };

  const getRecentActivity = () => {
    const activities = [];
    
    // Recent clubs (last 5)
    clubs.slice(0, 5).forEach(club => {
      activities.push({
        type: 'club',
        icon: FiUsers,
        color: 'blue',
        text: `Club "${club.name}" created`,
        time: new Date(club.created_at).toLocaleDateString()
      });
    });

    // Recent announcements (last 5)
    announcements.slice(0, 5).forEach(ann => {
      activities.push({
        type: 'announcement',
        icon: FiBell,
        color: 'purple',
        text: ann.title,
        time: new Date(ann.created_at).toLocaleDateString()
      });
    });

    return activities.slice(0, 8);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-2xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Authority Dashboard</h1>
                <p className="text-sm text-slate-300">Welcome, {authority?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                icon={FiHome}
                onClick={() => navigate("/")}
                className="text-white hover:bg-slate-700/50"
              >
                Home
              </Button>
              <Button
                variant="ghost"
                icon={FiLogOut}
                onClick={handleLogout}
                className="text-white hover:bg-slate-700/50"
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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-600/50 rounded-lg backdrop-blur-sm">
                <FiUsers className="w-8 h-8" />
              </div>
              <FiTrendingUp className="w-6 h-6 opacity-30" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium uppercase tracking-wide">Total Clubs</p>
              <p className="text-4xl font-bold mt-2">{stats.clubs}</p>
              <p className="text-xs text-slate-400 mt-2">Active organizations</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 border border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-800/50 rounded-lg backdrop-blur-sm">
                <FiUsers className="w-8 h-8" />
              </div>
              <FiActivity className="w-6 h-6 opacity-30" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium uppercase tracking-wide">Total Members</p>
              <p className="text-4xl font-bold mt-2">{stats.members}</p>
              <p className="text-xs text-blue-400 mt-2">Across all clubs</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 border border-amber-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/50 rounded-lg backdrop-blur-sm">
                <FiCalendar className="w-8 h-8" />
              </div>
              <FiBarChart2 className="w-6 h-6 opacity-30" />
            </div>
            <div>
              <p className="text-amber-100 text-sm font-medium uppercase tracking-wide">Total Events</p>
              <p className="text-4xl font-bold mt-2">{stats.events}</p>
              <p className="text-xs text-amber-200 mt-2">Scheduled & completed</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-700 to-indigo-800 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 border border-indigo-600">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-600/50 rounded-lg backdrop-blur-sm">
                <FiBell className="w-8 h-8" />
              </div>
              <FiPieChart className="w-6 h-6 opacity-30" />
            </div>
            <div>
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide">Announcements</p>
              <p className="text-4xl font-bold mt-2">{stats.announcements}</p>
              <p className="text-xs text-indigo-300 mt-2">Active notifications</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6 border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex gap-4 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-4 font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-slate-800 text-slate-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab("clubs")}
                className={`py-4 px-4 font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "clubs"
                    ? "border-slate-800 text-slate-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                🏢 Clubs Management
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`py-4 px-4 font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "announcements"
                    ? "border-slate-800 text-slate-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                📢 Announcements
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-4 px-4 font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "activity"
                    ? "border-slate-800 text-slate-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                🔔 Recent Activity
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Analytics Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-300 shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiPlus className="w-5 h-5" />
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Button
                        className="w-full justify-start bg-slate-700 hover:bg-slate-800 text-white"
                        icon={FiPlus}
                        onClick={() => navigate("/authority/create-club")}
                      >
                        Create New Club
                      </Button>
                      <Button
                        className="w-full justify-start bg-amber-600 hover:bg-amber-700 text-white"
                        icon={FiBell}
                        onClick={() => navigate("/authority/create-announcement")}
                      >
                        Create Announcement
                      </Button>
                      <Button
                        className="w-full justify-start bg-blue-900 hover:bg-blue-950 text-white"
                        icon={FiUsers}
                        onClick={() => setActiveTab("clubs")}
                      >
                        Manage Clubs
                      </Button>
                    </div>
                  </div>

                  {/* System Info */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-300 shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiShield className="w-5 h-5 text-amber-600" />
                      System Information
                    </h3>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span className="font-medium">Role:</span>
                        <span className="text-slate-800 font-semibold">{authority?.designation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span className="text-slate-800">{authority?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Access Level:</span>
                        <span className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-bold">FULL ADMIN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Database:</span>
                        <span className="text-green-600 font-semibold">● Connected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Club Members Chart */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiBarChart2 className="w-5 h-5 text-blue-600" />
                      Top Clubs by Members
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getClubMemberData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="members" fill="#3b82f6" name="Members" />
                        <Bar dataKey="events" fill="#10b981" name="Events" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Club Distribution */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiPieChart className="w-5 h-5 text-purple-600" />
                      Club Size Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getClubDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ range, count }) => `${range}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {getClubDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-xs text-gray-600 text-center">
                      Distribution based on member count ranges
                    </div>
                  </div>

                  {/* Announcement Types */}
                  {announcements.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FiBell className="w-5 h-5 text-orange-600" />
                        Announcement Types
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getAnnouncementTypes()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getAnnouncementTypes().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Activity Timeline */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiActivity className="w-5 h-5 text-green-600" />
                      Quick Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <FiUsers className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Avg Members/Club</p>
                            <p className="text-xs text-gray-500">Across all clubs</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {clubs.length > 0 ? Math.round(stats.members / stats.clubs) : 0}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded">
                            <FiCalendar className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Avg Events/Club</p>
                            <p className="text-xs text-gray-500">Per organization</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {clubs.length > 0 ? Math.round(stats.events / stats.clubs) : 0}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded">
                            <FiBell className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Active Notices</p>
                            <p className="text-xs text-gray-500">System-wide</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">{stats.announcements}</p>
                      </div>
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
                    <div key={club.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800">{club.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                              <FiUsers className="w-4 h-4" />
                              <strong>{club.member_count}</strong> members
                            </span>
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                              <FiCalendar className="w-4 h-4" />
                              <strong>{club.event_count}</strong> events
                            </span>
                            <span className="text-gray-500">
                              Created: {new Date(club.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={FiEdit}
                            onClick={() => navigate(`/clubs/${club.id}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            View
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
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
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
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
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
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              {announcement.target_audience.replace('_', ' ')}
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
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      <FiBell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>No announcements yet. Create your first announcement!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h3>
                
                <div className="space-y-3">
                  {getRecentActivity().map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-lg ${
                          activity.color === 'blue' ? 'bg-blue-100' :
                          activity.color === 'purple' ? 'bg-purple-100' :
                          activity.color === 'green' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            activity.color === 'blue' ? 'text-blue-600' :
                            activity.color === 'purple' ? 'text-purple-600' :
                            activity.color === 'green' ? 'text-green-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{activity.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}

                  {getRecentActivity().length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>No recent activity</p>
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
