import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// --- New Imports ---
import {
  FiCalendar, FiClock, FiUsers, FiPlus, FiCheck, FiX, FiGift, FiLock
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Alert from "../components/Alert";
import { getImageUrl } from "../utils/imageHelper";
// --------------------

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  // unreadCount is no longer needed here; Navbar fetches it automatically
  const [clubMembers, setClubMembers] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState("");
  
  const [totalMembers, setTotalMembers] = useState(0);

  // Password update states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login");
      return;
    }
    setUser(loggedUser);
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; } 
      try {
        setLoading(true);
        setError("");
        
        // --- Simplified promises (removed unreadCount) ---
        const promises = [
          axios.get("http://localhost:5000/api/events/upcoming"),
        ];
        
        if (user.club_id && user.role !== 'authority') {
          promises.push(axios.get(`http://localhost:5000/api/clubs/${user.club_id}/members`));
          promises.push(axios.get(`http://localhost:5000/api/clubs/${user.club_id}/executive-committee/view`));
        } else {
          promises.push(Promise.resolve({ data: { members: [] } }));
          promises.push(Promise.resolve({ data: { committee: [] } }));
        }

        if (user.role === 'authority') {
          promises.push(axios.get(`http://localhost:5000/api/members/count?userId=${user.id}`));
        } else {
          promises.push(Promise.resolve({ data: { total: 0 } }));
        }

        if (user.role === "admin" && user.club_id) {
            setLoadingPending(true);
            promises.push(axios.get(`http://localhost:5000/api/users/pending/${user.club_id}`));
        } else {
            promises.push(Promise.resolve({ data: { members: [] } }));
        }
        
        const [upcomingRes, membersRes, executivesRes, totalMembersRes, pendingRes] = await Promise.all(promises);
        
        setUpcomingEvents(upcomingRes.data.events || []);
        setClubMembers(membersRes.data.members || []);
        setExecutives(executivesRes.data.committee || []);
        setTotalMembers(totalMembersRes.data.total || 0); 
        setPendingMembers(pendingRes.data.members || []);

      } catch (e) {
        console.error("Dashboard load error:", e); 
        setError(e?.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
        setLoadingPending(false); 
      }
    };
    load(); 
  }, [user]); 

  const handleApprove = async (member) => {
    try {
      await axios.post(`http://localhost:5000/api/users/approve/${member.id}`);
      setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (user.club_id && member.club_id === user.club_id) {
         setClubMembers((prev) => [...prev, { ...member, role: "member", position: "member" }]);
      }
    } catch (e) {
      alert( e?.response?.data?.message || e.message || "Failed to approve member." );
    }
  };

  const handleReject = async (member) => {
    try {
      await axios.post(`http://localhost:5000/api/users/reject/${member.id}`);
      setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (e) {
      alert( e?.response?.data?.message || e.message || "Failed to reject member." );
    }
  };

  // --- New logout function for Navbar ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    try {
      setPasswordLoading(true);
      await axios.post("http://localhost:5000/api/users/update-password", {
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error) {
      setPasswordError(error.response?.data?.error || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const randomMembers = useMemo(() => {
    const base = clubMembers.map((m) => ({ ...m, photo: getImageUrl(m.photo) }));
    if (!base.length) return [];
    return [...base].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [clubMembers]);
  
  const eventDate = (e) => e?.date || e?.event_date || "";
  
  const canManage = user?.role === 'admin' || user?.role === 'authority';

  // --- Show full-screen loader while user is loading ---
  if (!user || loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    // --- New standard page layout ---
    <div className="min-h-screen bg-gray-50">
      {/* 1. Replaced sidebar/header with Navbar */}
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* 2. Added standard PageHeader */}
      <PageHeader
  title="Dashboard"
    subtitle={
    <>
      Welcome back, {user.name}! <br /> {user.club_name || 'Loading...'}
    </>
  }
  showBack={false}
  breadcrumbs={[
    { label: "Home", path: "/" },
    { label: "Dashboard" }
  ]}
  actions={
    <Button
      variant="outline"
      size="sm"
      icon={FiLock}
      onClick={() => setShowPasswordModal(true)}
    >
      Change Password
    </Button>
  }
/>



      {/* 3. Replaced <div> with <main> and standard padding */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 animate-fade-in-up">
        
        {/* Replaced error <div> with <Alert> */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {/* --- StatCard section --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Members" value={user?.role === 'authority' ? totalMembers : clubMembers.length} icon={<FiUsers className="w-5 h-5" />} />
          <StatCard title="Upcoming" value={upcomingEvents.length} icon={<FiClock className="w-5 h-5" />} />
          
          {canManage && (
              // --- Wrapped in <Card> for consistent style ---
              <Card className="flex items-center justify-center">
                  {/* --- Replaced <button> with <Button> --- */}
                  <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      icon={FiPlus}
                      onClick={() => navigate("/events/create")}
                  >
                      Create New Event
                  </Button>
              </Card>
          )}
        </section>
        
        {/* --- Pending Members section --- */}
        {user?.role === "admin" && (
          <Card padding={false} className="overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Pending Member Approvals</h2>
              <span className="text-sm text-gray-500">
                {loadingPending ? "Loading..." : `${pendingMembers.length} request(s)`}
              </span>
            </div>
            {loadingPending ? (
              <div className="p-4"><LoadingSpinner /></div>
            ) : pendingMembers.length ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingMembers.map((m) => (
                  <Card key={m.id} className="bg-gray-50">
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-sm text-gray-600">{m.email}</div>
                    <div className="text-xs text-gray-500 mt-1">Club: {m.club_name || "N/A"}</div>
                    <div className="mt-3 flex gap-2">
                      {/* --- Replaced <button> with <Button> --- */}
                      <Button
                        size="sm"
                        icon={FiCheck}
                        onClick={() => handleApprove(m)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={FiX}
                        onClick={() => handleReject(m)}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // --- Replaced local EmptyState with global one ---
              <EmptyState title="No pending requests" description="New join requests will appear here." />
            )}
          </Card>
        )}
        
        {/* --- Executive Committee section --- */}
        {user?.role !== 'authority' && executives.length > 0 && (
          <Card padding={false} className="overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Executive Committee</h2>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/view-executive/${user.club_id}`)}
                >
                  Manage
                </Button>
              )}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {executives.map((exec) => {
                const badgeColor = 
                  exec.position === 'President' ? 'bg-green-100 text-green-800' :
                  exec.position === 'General Secretary' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800';
                
                return (
                  <Card key={exec.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getImageUrl(exec.photo)} 
                          alt={exec.name} 
                          className="w-12 h-12 rounded-full border object-cover" 
                        />
                        <div>
                          <Link to={`/view-profile/${exec.id}`} className="font-semibold text-green-700 hover:underline">
                            {exec.name}
                          </Link>
                          <div className="text-sm text-gray-600">{exec.email}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${badgeColor}`}>
                        {exec.position}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        )}
        
        {/* --- Club Members section --- */}
        {user?.role !== 'authority' && (
          <Card padding={false} className="overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Club Members</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {randomMembers.length ? (
                randomMembers.map((m) => (
                  <Card key={m.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img src={getImageUrl(m.photo)} alt={m.name} className="w-12 h-12 rounded-full border object-cover" />
                        <div>
                          <Link to={`/view-profile/${m.id}`} className="font-semibold text-green-700 hover:underline">
                            {m.name}
                          </Link>
                          <div className="text-sm text-gray-600">{m.email}</div>
                          <div className="text-xs text-gray-500">{m.contact_no || "No contact"}</div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {m.position || "member"}
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 col-span-full">No members yet.</div>
              )}
            </div>
            <div className="p-4 text-right bg-gray-50 border-t">
              {/* --- Replaced <button> with <Button> --- */}
              <Button
                variant="primary"
                onClick={() => navigate("/members")}
              >
                View Full Member List
              </Button>
            </div>
          </Card>
        )}
        
        {/* --- Upcoming Events section --- */}
        <Card padding={false} className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Activities</h2>
            <Button
              variant="outline"
              icon={FiCalendar}
              onClick={() => navigate("/events")}
            >
              All Events
            </Button>
          </div>
          {upcomingEvents.length ? (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.slice(0, 4).map((e) => ( // Show 4 instead of 3
                <Card key={e.id} hover onClick={() => navigate(`/events/${e.id}`)}>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-sm text-green-700 mt-1">Date: {formatDate(eventDate(e))}</div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {e.description || "No description for this event."}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            // --- Replaced local EmptyState with global one ---
            <EmptyState 
              icon={FiGift}
              title="No upcoming activities" 
              description="New events will appear here." 
            />
          )}
        </Card>
      </main>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FiLock className="w-5 h-5" />
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {passwordError && (
              <Alert type="error" message={passwordError} onClose={() => setPasswordError("")} />
            )}

            {passwordSuccess && (
              <Alert type="success" message={passwordSuccess} />
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter current password"
                  disabled={passwordLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter new password (min 8 characters)"
                  disabled={passwordLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Re-enter new password"
                  disabled={passwordLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  disabled={passwordLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={passwordLoading}
                  className="flex-1"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Kept this local component as it's good and specific to the dashboard ---
function StatCard({ icon, title, value }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-green-100 text-green-700">{icon}</div>
        <div>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="mt-1 text-3xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

// --- Kept this helper, it's useful ---
function formatDate(d) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString();
  } catch {
    return d;
  }
}