// back_v2/backend/frontend/src/pages/MyProfile.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// --- NEW IMPORTS ---
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import { getImageUrl } from "../utils/imageHelper";
// -------------------

export default function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // logged-in (localStorage)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    club_name: "",
    position: "",
    contact_no: "",
    gender: "",
    dept: "",
    session: "",
    description: "",
    photo: null,
    photoUrl: "",
  });

  // boot: check auth
  useEffect(() => {
    const logged = JSON.parse(localStorage.getItem("user"));
    if (!logged) {
      navigate("/login");
      return;
    }
    setUser(logged);
  }, [navigate]);

  // load fresh profile
  useEffect(() => {
    const run = async () => {
      // --- FIX: Check for user.id to ensure user is loaded ---
      if (!user?.id) return;
      try {
        setLoading(true);
        setError(""); // Clear error on new load

        // Use the user.id from the state
        const res = await axios.get(`http://localhost:5000/api/me?id=${user.id}`);

        const u = res.data?.user || user;
        setForm((prev) => ({
          ...prev,
          name: u.name || "",
          email: u.email || "",
          club_name: u.club_name || "",
          position: u.position || "",
          contact_no: u.contact_no || "",
          gender: u.gender || "",
          dept: u.dept || "",
          session: u.session || "",
          description: u.description || "",
          photo: null,
          photoUrl: u.photo || getImageUrl(null),
        }));
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        setError("Failed to load profile data.");
        // fallback to local
        setForm((prev) => ({
          ...prev,
          name: user?.name || "",
          email: user?.email || "",
          club_name: user?.club_name || "",
          position: user?.position || "",
          contact_no: user?.contact_no || "",
          gender: user?.gender || "",
          dept: user?.dept || "",
          session: user?.session || "",
          description: user?.description || "",
          photoUrl: user?.photo || getImageUrl(null),
        }));
      } finally {
        setLoading(false);
      }
    };
    run();
    // --- THIS IS THE BUG FIX ---
    // The dependency is now user.id, not the entire user object.
    // This stops the component from re-fetching after a successful save.
  }, [user?.id]);
  // --- END FIX ---

  // --- New function for Navbar logout ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((s) => ({ ...s, photo: f, photoUrl: URL.createObjectURL(f) }));
  };

  const removePhoto = () => {
    setForm((s) => ({ ...s, photo: null, photoUrl: getImageUrl(null) }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) return setError(v);

    try {
      setSaving(true);
      const body = new FormData();
      body.append("name", form.name);
      body.append("contact_no", form.contact_no || "");
      body.append("gender", form.gender || "");
      body.append("dept", form.dept || "");
      body.append("session", form.session || "");
      body.append("description", form.description || "");
      if (form.photo) body.append("photo", form.photo);

      const res = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        body,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated = res.data?.user || {};
      const merged = { ...user, ...updated };
      localStorage.setItem("user", JSON.stringify(merged));

      // Update the user state here, AFTER saving, to reflect new changes
      setUser(merged);

      setForm((f) => ({
        ...f,
        photo: null,
        photoUrl: updated.photo || f.photoUrl,
      }));
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- REFACTORED HEADER --- */}
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title="My Profile"
        subtitle={form.club_name || "Edit your profile details"}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "My Profile" }
        ]}
      />
      {/* --- END HEADER --- */}

      {/* Body */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in-up">
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess("")} autoClose />
        )}

        {/* --- REFACTORED to use Card --- */}
        <Card>
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
              <img
                src={form.photoUrl || getImageUrl(null)}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = getImageUrl(null); }}
              />
            </div>

            <div className="flex gap-2">
              {/* --- REFACTORED to use Button --- */}
              <Button
                variant="primary"
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                Change Photo
                 <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileRef}
                  onChange={onPickPhoto}
                />
              </Button>
              <Button
                variant="secondary"
                onClick={removePhoto}
              >
                Remove
              </Button>
              {/* --- END REFACTOR --- */}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter your name"
              />
            </div>

            {/* Email (locked) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                value={form.email}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
            </div>

            {/* Club Name (locked) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <input
                name="club_name"
                value={form.club_name}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>

            {/* Position (locked) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                name="position"
                value={form.position}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>

            {/* Contact No (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact No</label>
              <input
                name="contact_no"
                value={form.contact_no}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                placeholder="01XXXXXXXXX"
              />
            </div>

            {/* Gender (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender || ""}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </div>

            {/* Dept (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                name="dept"
                value={form.dept}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., CSE"
              />
            </div>

            {/* Session (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <input
                name="session"
                value={form.session}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., 2019-20"
              />
            </div>

            {/* Description (editable, full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={5}
                className="w-full border rounded px-3 py-2"
                placeholder="Write a short bio or interests…"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex items-center justify-between mt-2">
              {/* --- REFACTORED to use Button --- */}
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/dashboard")} // Go to dashboard
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {/* --- END REFACTOR --- */}
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}