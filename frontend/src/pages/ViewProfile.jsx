import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// --- New Imports ---
import { FiMessageSquare } from "react-icons/fi";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import Button from "../components/Button";
import Card from "../components/Card";
// --------------------

export default function ViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // --- New state for Navbar ---
  const [user, setUser] = useState(null);

  // --- New useEffect for Navbar user ---
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login"); // Not logged in, redirect
      return;
    }
    setUser(loggedUser);
  }, [navigate]);

  // --- New function for Navbar logout ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- This logic is the same ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true); // Set loading true at the start
        setErr(""); // Clear previous errors
        const res = await axios.get(`http://localhost:5000/api/profile/${id}`);
        if (!res.data.success) {
          setErr(res.data.message || "Profile not found");
        } else {
          setProfile(res.data.user);
        }
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  // --- Replaced old loading div with LoadingSpinner component ---
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  // -----------------------------------------------------------

  // Helper values
  const p = profile;
  const prettyDate = p?.joined_at ? new Date(p.joined_at).toLocaleDateString() : "—";

  return (
    // --- New standard page structure ---
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <PageHeader
        title="Member Profile"
        subtitle={p?.name || "..."}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Members", path: "/members" }, // Good default breadcrumb
          { label: p?.name || "Profile" }
        ]}
      />

      <main className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in-up">
        
        {/* --- Replaced old error div with Alert component --- */}
        {err && !profile && (
          <Alert type="error" message={err} />
        )}
        {/* -------------------------------------------------- */}

        {p && (
          // --- Replaced old div with Card component ---
          <Card>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 border self-center md:self-start flex-shrink-0">
                {p.photo ? (
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Photo
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900">{p.name}</h2>
                <p className="text-lg text-gray-600">
                  {p.position ? `${p.position} • ` : ""}{p.role || "member"}
                </p>
                {p.club_name && <p className="text-md text-gray-700 mt-1">Club: {p.club_name}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t">
                  <Info label="Email" value={p.email} />
                  <Info label="Contact No" value={p.contact_no} />
                  <Info label="Gender" value={p.gender} />
                  <Info label="Department" value={p.dept} />
                  <Info label="Session" value={p.session} />
                  <Info label="Joined At" value={prettyDate} />
                </div>

                {p.description ? (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">{p.description}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* --- Replaced old buttons with Button component --- */}
            <div className="mt-6 flex gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(`/messages/${p.id}`)}
                icon={FiMessageSquare}
              >
                Message {p.name.split(' ')[0]} {/* Get first name */}
              </Button>
            </div>
            {/* ----------------------------------------------- */}
          </Card>
        )}
      </main>
    </div>
  );
}

// This sub-component is good, no change needed
function Info({ label, value }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="text-md text-gray-900">{value || "—"}</div>
    </div>
  );
}