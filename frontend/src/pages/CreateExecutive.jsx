// src/pages/CreateExecutive.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { getImageUrl } from "../utils/imageHelper";

const POSITIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Joint Secretary",
  "Treasurer",
  "Organizing Secretary",
  "Media & PR",
  "Event Coordinator",
  "Executive Member",
];

export default function CreateExecutive() {
  const { clubId: clubIdParam } = useParams();
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState({}); // { [memberId]: position }
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const clubId = clubIdParam || authUser?.club_id;

  // read login
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) {
      navigate("/login");
      return;
    }
    setAuthUser(u || null);
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Load club and member data
  useEffect(() => {
    const load = async () => {
      if (!authUser) return;
      
      if (!clubId) {
         setLoading(false);
         setError("Could not determine Club ID.");
         return;
      }

      // guard: admin of this club or authority
      const isClubAdmin = authUser.role === "admin" && String(authUser.club_id) === String(clubId);
      const isAuthority = authUser.role === 'authority';

      if (!isClubAdmin && !isAuthority) {
        setLoading(false);
        setError("You don't have permission to access this page.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setOk("");

        const [clubRes, membersRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/clubs/${clubId}`),
          axios.get(`http://localhost:5000/api/clubs/${clubId}/members`),
        ]);

        setClub(clubRes.data?.club || null);
        
        const ms = (membersRes.data?.members || []).map((m) => ({
          ...m,
          photo: getImageUrl(m.photo),
        }));
        setMembers(ms);

        // Prefill from club_members.position
        const pre = {};
        ms.forEach((m) => {
          if (m.position && POSITIONS.includes(m.position)) {
            pre[m.id] = m.position;
          }
        });
        setSelected(pre);

      } catch (e) {
        console.error("Load data error:", e);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authUser, clubId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((m) => {
      const matchRole = roleFilter === "all" ? true : m.role === roleFilter;
      const matchQ =
        !term ||
        (m.name || "").toLowerCase().includes(term) ||
        (m.email || "").toLowerCase().includes(term);
      return matchRole && matchQ;
    });
  }, [members, q, roleFilter]);

  const setPos = (id, pos) => {
    setSelected((s) => ({ ...s, [id]: pos }));
  };

  const removePos = (id) => {
    setSelected((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setOk("");

    const list = Object.entries(selected)
      .filter(([, p]) => p && POSITIONS.includes(p))
      .map(([id, position]) => ({ id: Number(id), position }));

    try {
      await axios.put(
        `http://localhost:5000/api/clubs/${clubId}/members/positions`,
        {
          updates: list,
          resetOthersTo: "member", // Demotes anyone not in the list
        }
      );

      setOk("Executive Committee saved.");
      setTimeout(() => navigate(`/view-executive/${clubId}`), 1000);
      
    } catch (e) {
      console.error("Save error:", e);
      setError(e?.response?.data?.message || "Failed to save committee.");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // unauthorized
  if (!loading && error && authUser && (authUser.role !== "admin" && authUser.role !== 'authority')) {
    return (
      <div className="min-h-screen bg-gray-50">
         <Navbar user={authUser} onLogout={handleLogout} />
         <PageHeader title="Permission Denied" />
         <main className="max-w-4xl mx-auto p-4 md:p-6">
           <Alert type="error" message={error} />
         </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={authUser} onLogout={handleLogout} />
      <PageHeader
        title="Edit Executive Committee"
        subtitle={club?.name || "Assign roles to members"}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: club?.name || "...", path: `/clubs/${clubId}` },
          { label: "Edit Committee" }
        ]}
        actions={
          <Button
            onClick={save}
            loading={saving}
            disabled={saving || loading}
          >
            {saving ? "Saving…" : "Save Committee"}
          </Button>
        }
      />
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {ok && <Alert type="success" message={ok} onClose={() => setOk("")} autoClose />}

        {/* Controls */}
        <Card>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="member">Members</option>
            </select>
          </div>
        </Card>

        {/* Members grid */}
        {filtered.length === 0 ? (
          <Card>
            <EmptyState title="No members found" description={q ? "Try a different search." : "No members match this filter."} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <Card key={m.id}>
                <div className="flex items-center gap-3">
                  <img
                    src={getImageUrl(m.photo)}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-sm text-gray-600">{m.email}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${m.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {m.role}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-700 mb-1">Position</label>
                  <div className="flex gap-2">
                    <select
                      value={selected[m.id] || ""}
                      onChange={(e) => setPos(m.id, e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">— Not Executive —</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {selected[m.id] && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => removePos(m.id)}
                      >
                        Clear
                      </Button>
                    )}
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