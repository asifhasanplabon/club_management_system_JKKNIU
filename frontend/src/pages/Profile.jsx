// src/pages/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);           // from localStorage / API
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Editable fields state (club_members table)
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact_no: "",
    password: "",
    gender: "",
    dept: "",
    session: "",
    position: "",
    description: "",
    photo: null,            // File
    photoUrl: "",           // Preview / existing url
  });

  // Get logged in user
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login");
      return;
    }
    setUser(loggedUser);
  }, [navigate]);

  // Fetch latest user profile from API (optional but safer)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        // Adjust this endpoint to your backend if different:
        const res = await axios.get(`http://localhost:5000/api/users/${user.id}`);
        const profile = res.data?.user || user; // fallback to local
        setForm((prev) => ({
          ...prev,
          name: profile.name || "",
          email: profile.email || "",
          contact_no: profile.contact_no || "",
          password: "",
          gender: profile.gender || "",
          dept: profile.dept || "",
          session: profile.session || "",
          position: profile.position || "",
          description: profile.description || "",
          photo: null,
          photoUrl: profile.photo || "", // should be a URL/path from server
        }));
        // Keep user in state synced (non-sensitive)
        setUser((u) => ({ ...u, ...profile }));
      } catch (err) {
        // If GET fails, fall back to localStorage data
        setForm((prev) => ({
          ...prev,
          name: user?.name || "",
          email: user?.email || "",
          contact_no: user?.contact_no || "",
          gender: user?.gender || "",
          dept: user?.dept || "",
          session: user?.session || "",
          position: user?.position || "",
          description: user?.description || "",
          photoUrl: user?.photo || "",
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isMember = user?.role === "member";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({
      ...f,
      photo: file,
      photoUrl: URL.createObjectURL(file),
    }));
  };

  const removePhoto = () => {
    setForm((f) => ({ ...f, photo: null, photoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    setError("");
    if (!form.name.trim()) return "Name is required.";
    if (!form.contact_no.trim()) return "Contact no is required.";
    // Optional: simple phone check
    if (form.contact_no && form.contact_no.length < 6) return "Contact no looks too short.";
    // Password is optional; only validated if present
    if (form.password && form.password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setSaving(true);
      setError("");

      // Build multipart body to support photo + fields
      const body = new FormData();
      body.append("name", form.name);
      body.append("contact_no", form.contact_no);
      body.append("gender", form.gender);
      body.append("dept", form.dept);
      body.append("session", form.session);
      body.append("position", form.position);
      body.append("description", form.description);
      // Only send password if user typed one (leave unchanged otherwise)
      if (form.password) body.append("password", form.password);
      // Photo (optional)
      if (form.photo) body.append("photo", form.photo);

      // Adjust to your backend route. Using /api/users/:id to reflect earlier endpoints.
      const res = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        body,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated = res.data?.user || {};
      // Update localStorage so the rest of the app has fresh fields
      const merged = { ...user, ...updated };
      localStorage.setItem("user", JSON.stringify(merged));
      setUser(merged);

      setSuccess("Profile updated successfully.");
      setForm((f) => ({
        ...f,
        password: "",
        photo: null,
        photoUrl: updated.photo || f.photoUrl,
      }));
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <nav className="bg-green-600 text-white flex justify-between items-center p-4">
        <button onClick={() => navigate(-1)} className="px-3 py-1 bg-green-700 rounded hover:bg-green-500">
          ← Back
        </button>
        <h1 className="text-lg font-bold">My Profile</h1>
        <div />
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded bg-green-100 text-green-700 border border-green-200">
            {success}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
            </div>

            {isMember ? (
              <div className="flex gap-2">
                <label className="px-3 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-500">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={onPickPhoto}
                  />
                </label>
                {form.photoUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Photo (view only)</span>
            )}
          </div>

          {/* Profile form */}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="Enter your name"
              />
            </div>

            {/* Email (read only) */}
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

            {/* Contact No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact No</label>
              <input
                name="contact_no"
                value={form.contact_no}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="01XXXXXXXXX"
              />
            </div>

            {/* Password (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="Leave blank to keep current"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </div>

            {/* Dept */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                name="dept"
                value={form.dept}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="e.g., CSE"
              />
            </div>

            {/* Session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <input
                name="session"
                value={form.session}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="e.g., 2019-20"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                name="position"
                value={form.position}
                onChange={onChange}
                disabled={!isMember}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="e.g., Member / Coordinator"
              />
            </div>

            {/* Description (full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                disabled={!isMember}
                rows={5}
                className={`w-full border rounded px-3 py-2 ${!isMember ? "bg-gray-100" : ""}`}
                placeholder="Write a short bio or your interests..."
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Cancel
              </button>

              {isMember ? (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              ) : (
                <span className="text-sm text-gray-500">Only members can edit their profile.</span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
