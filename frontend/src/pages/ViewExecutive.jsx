import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiHome, FiEdit, FiUsers } from 'react-icons/fi';
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";

const POSITION_ORDER = [
  "President", "Vice President", "General Secretary", "Joint Secretary",
  "Treasurer", "Organizing Secretary", "Media & PR", "Event Coordinator",
  "Executive Member",
];

export default function ViewExecutive() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [committee, setCommittee] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isAdminOfThisClub =
    user?.role === "admin" && user?.club_id && String(user.club_id) === String(clubId);
  const isAuthority = user?.role === "authority";
  const canEdit = isAdminOfThisClub || isAuthority;

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u || null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const [clubRes, ecRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/clubs/${clubId}`),
          axios.get(`http://localhost:5000/api/clubs/${clubId}/executive-committee/view`),
        ]);
        if (!mounted) return;
        setClub(clubRes.data?.club || null);

        const rows = ecRes.data?.committee || [];
        const posIndex = (p) => {
          const i = POSITION_ORDER.findIndex(
            (x) => x.toLowerCase() === String(p || "").toLowerCase()
          );
          return i === -1 ? 999 : i;
        };
        rows.sort((a, b) => {
          const d = posIndex(a.position) - posIndex(b.position);
          if (d !== 0) return d;
          return String(a.name).localeCompare(String(b.name));
        });

        setCommittee(rows);
      } catch (e) {
        setErr("Failed to load executive committee.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [clubId]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader 
        title={`Executive Committee - ${club?.name || 'Club'}`}
        showBack 
        showHome
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Edit Committee Button - Moved here so it renders after user loads */}
        {canEdit && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/create-executive`)}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2 transition-colors shadow-sm"
            >
              <FiEdit className="w-4 h-4" /> Edit Committee
            </button>
          </div>
        )}

        {err && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 bg-white border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !committee.length ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-700">
             <FiUsers className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-semibold">No executive committee found</h3>
            <p className="text-sm text-gray-500">No executive committee has been created yet.</p>
            {canEdit && (
              <button
                onClick={() => navigate(`/create-executive`)}
                className="mt-4 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500"
              >
                Create Committee
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {committee.map((p) => (
              <Link
                to={`/view-profile/${p.id}`}
                key={p.id || p.email}
                className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.photo || "/images/default.jpg"}
                    alt={p.name}
                    className="w-12 h-12 rounded-full object-cover border"
                    onError={(e) => (e.currentTarget.src = "/images/default.jpg")}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-sm text-gray-600 truncate">{p.email}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                    {p.position}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}