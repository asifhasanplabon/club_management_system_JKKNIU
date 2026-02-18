// Reusable Navbar Component with improved UX
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiImage,
  FiBell,
  FiMail,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiSettings,
  FiChevronDown,
  FiShield,
} from "react-icons/fi";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fetch unread message count
  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/api/messages/unread-count/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setUnreadMessages(data.unreadCount);
        })
        .catch(console.error);
    }
  }, [user]);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/clubs", label: "Clubs", icon: FiUsers },
    { path: "/events", label: "Events", icon: FiCalendar },
    { path: "/gallery", label: "Gallery", icon: FiImage },
    { path: "/announcements", label: "Announcements", icon: FiBell },
  ];

  // Club Settings link for admins and executives
  const getClubSettingsLink = () => {
    if (!user) return null;
    
    // For club admins, show settings for their club
    if (user.role === "admin" && user.club_id) {
      return { 
        path: `/clubs/${user.club_id}/settings`, 
        label: "Club Settings", 
        icon: FiShield 
      };
    }
    
    // For authorities, they can access any club settings
    // (you might want to add a dropdown or different logic here)
    if (user.role === "authority") {
      return { 
        path: `/dashboard`, 
        label: "Admin Panel", 
        icon: FiShield 
      };
    }
    
    return null;
  };

  const clubSettingsLink = getClubSettingsLink();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CM</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-900">
                Club<span className="text-green-600">Hub</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user &&
              navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    isActive(link.path)
                      ? "bg-green-50 text-green-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            
            {/* Club Settings Link (for admins/executives) */}
            {user && clubSettingsLink && (
              <Link
                to={clubSettingsLink.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive(clubSettingsLink.path)
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <clubSettingsLink.icon className="w-4 h-4" />
                {clubSettingsLink.label}
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Messages Icon with Badge */}
                <button
                  onClick={() => navigate("/messages")}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiMail className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    <img
                      src={user.photo || "/images/default.jpg"}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
                    />
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                    <FiChevronDown
                      className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform ${
                        profileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-green-600 mt-1 capitalize">
                          {user.role} • {user.position || "Member"}
                        </p>
                      </div>

                      <Link
                        to="/my-profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        <FiUser className="w-4 h-4 mr-3" />
                        My Profile
                      </Link>

                      {/* Club Settings for Club Admins */}
                      {user.role === "admin" && user.club_id && (
                        <>
                          <Link
                            to={`/clubs/${user.club_id}/settings`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setProfileOpen(false)}
                          >
                            <FiSettings className="w-4 h-4 mr-3" />
                            Club Settings
                          </Link>
                          <Link
                            to={`/clubs/${user.club_id}/manage-members`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setProfileOpen(false)}
                          >
                            <FiUsers className="w-4 h-4 mr-3" />
                            Manage Members
                          </Link>
                        </>
                      )}

                      {(user.role === "admin" || user.role === "authority") && (
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          <FiShield className="w-4 h-4 mr-3" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && user && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            
            {/* Club Settings Link in Mobile Menu */}
            {clubSettingsLink && (
              <Link
                to={clubSettingsLink.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(clubSettingsLink.path)
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <clubSettingsLink.icon className="w-5 h-5" />
                {clubSettingsLink.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
