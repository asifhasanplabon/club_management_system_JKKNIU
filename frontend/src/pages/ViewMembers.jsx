import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FiSearch, FiChevronLeft, FiChevronRight, FiUsers } from "react-icons/fi";

// --- New Imports ---
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Card from "../components/Card";
import Button from "../components/Button";
// --------------------

export default function ViewMembers() {
  const navigate = useNavigate();

  // --- Navbar state ---
  // User state is already here, just need handleLogout
  const [user, setUser] = useState(null);
  // --------------------

  const [allClubs, setAllClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true); // <-- Set initial loading to true
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- New function for Navbar logout ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Effect 1: Get user and all clubs
  useEffect(() => {
    setLoading(true); // Start loading
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
    
    if (u.role !== 'authority' && u.club_id) {
        setSelectedClubId(String(u.club_id));
    }

    const loadClubs = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/clubs");
            setAllClubs(res.data?.clubs || []);
        } catch (e) {
            setErr("Failed to load club list.");
        }
    };
    
    if (u.role === 'authority') {
        loadClubs();
    }
  }, [navigate]);

  // Effect 2: Load members *when* selectedClubId changes
  useEffect(() => {
    const load = async () => {
      if (!selectedClubId) {
        setMembers([]);
        setLoading(false); // Not loading if no club is selected
        return;
      }
      
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get(
          `http://localhost:5000/api/clubs/${selectedClubId}/members`
        );
        const list = (res.data?.members || []).map((m) => ({
          ...m,
          photo: m.photo || "/images/default.jpg",
        }));
        setMembers(list);
      } catch (e) {
        setErr(
          e?.response?.data?.message || e.message || "Failed to load members."
        );
      } finally {
        setLoading(false);
      }
    };
    
    // Only run if user is loaded and (either user is not authority OR user is authority and has selected a club)
    if (user) {
      if (user.role !== 'authority' && user.club_id) {
        load();
      } else if (user.role === 'authority' && selectedClubId) {
        load();
      } else if (user.role === 'authority' && !selectedClubId) {
        setLoading(false);
        setMembers([]);
      }
    }
  }, [selectedClubId, user]); // Depend on user as well

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) =>
      [
        m.name,
        m.email,
        m.contact_no,
        m.position,
        m.role,
        m.dept,
        m.session,
        m.club_name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [q, members]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);
  
  const clubName = allClubs.find(c => c.id === selectedClubId)?.name || user?.club_name || "Club";

  const prettyDate = (d) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  };

  const pageTitle = selectedClubId ? `${clubName} — Members` : "View Members";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Replaced old header with Navbar --- */}
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* --- Replaced old header with PageHeader --- */}
      <PageHeader
        title={pageTitle}
        subtitle={`${filtered.length} member${filtered.length !== 1 ? "s" : ""} found`}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Members" }
        ]}
        actions={
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, role…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* --- Replaced old error div with Alert component --- */}
        {err && (
          <Alert type="error" message={err} onClose={() => setErr("")} />
        )}

        {/* --- Wrapped club selector in a Card --- */}
        {user?.role === 'authority' && (
            <Card>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select a Club to View Members
                </label>
                <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    className="w-full max-w-xs p-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500"
                >
                    <option value="">-- Select a Club --</option>
                    {allClubs.map(club => (
                        <option key={club.id} value={club.id}>
                            {club.name}
                        </option>
                    ))}
                </select>
            </Card>
        )}
        
        {/* --- Updated Loading/Empty State Logic --- */}
        {loading ? (
           <LoadingSpinner fullScreen />
        ) : !selectedClubId && user?.role === 'authority' ? (
            <Card>
             <EmptyState
                icon={FiUsers}
                title="Please select a club"
                description="Use the dropdown above to load members for a specific club."
             />
           </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
                icon={FiUsers}
                title="No members found"
                description={q ? "Try a different search term." : "This club has no members yet."}
             />
          </Card>
        ) : (
          // --- Wrapped table in a Card ---
          <Card padding={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Position</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photo || "/images/default.jpg"}
                            alt={m.name}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">
                              {m.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {m.club_name || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{m.email}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.contact_no || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.position || "member"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {prettyDate(m.joined_at)}
                      </td>
                      <td className="px-4 py-3">
                        {/* --- Updated Link to use Button styles --- */}
                        <Link
                          to={`/view-profile/${m.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm rounded-md font-medium bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Page {pageSafe} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                {/* --- Replaced <button> with <Button> component --- */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={FiChevronLeft}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  icon={FiChevronRight}
                />
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}