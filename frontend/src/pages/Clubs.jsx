import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch, FiChevronRight, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// --- New Imports ---
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Alert from "../components/Alert";
// --------------------

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // --- New state for Navbar ---
  const [user, setUser] = useState(null);

  // --- New useEffect for Navbar user ---
  useEffect(() => {
    // No need to block non-users, so just set user if available
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedUser);
  }, []);

  // --- New function for Navbar logout ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null); // Clear user state
    navigate("/login");
  };

  // --- This logic is the same ---
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get("http://localhost:5000/api/clubs");
        setClubs(res.data?.clubs || []);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load clubs.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- This logic is the same ---
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clubs;
    return clubs.filter((c) =>
      [c.name, c.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [q, clubs]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Replaced old header with Navbar --- */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* --- Replaced old header with PageHeader --- */}
      <PageHeader
        title="All Clubs"
        subtitle="Browse and discover clubs on campus"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Clubs" }
        ]}
        actions={
          // Added a search bar as the 'action'
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clubs..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- Replaced old error div with Alert component --- */}
        {err && (
          <Alert
            type="error"
            message={err}
            onClose={() => setErr("")}
            autoClose
          />
        )}

        {/* --- Replaced old loading grid with LoadingSpinner/EmptyState --- */}
        {loading ? (
          // You can use a full-screen spinner or a grid of skeletons
          <LoadingSpinner fullScreen />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title={q ? "No clubs found" : "No clubs available"}
            description={q ? "Try a different search term." : "Please check back later."}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, index) => (
              // --- Replaced old Link/div with Card component ---
              <Card
                key={c.id}
                hover
                onClick={() => navigate(`/clubs/${c.id}`)}
                className="animate-fade-in-up flex flex-col" // Added flex
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{c.name}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {c.description || "No description provided."}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-green-600 inline-flex items-center gap-1">
                    View Details <FiChevronRight />
                  </span>
                </div>
              </Card>
              // -------------------------------------------------
            ))}
          </div>
        )}
      </main>
    </div>
  );
}