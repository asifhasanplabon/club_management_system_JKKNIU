// frontend/src/pages/ViewImage.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { canUpload } from "../utils/permissions";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";

export default function ViewImage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [canUserUpload, setCanUserUpload] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u || null);
    setCanUserUpload(canUpload(u));

    const params = new URLSearchParams(location.search);
    const urlClubId = params.get("clubId");

    setSelectedClubId(urlClubId || (u?.club_id ? String(u.club_id) : ""));

    const fetchClubs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/clubs");
        setClubs(res.data?.clubs || []);
      } catch (e) {
        console.warn("Could not fetch club list for filter.");
      }
    };
    fetchClubs();
  }, [location.search]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setErr("");
        const url = selectedClubId
          ? `http://localhost:5000/api/gallery?clubId=${selectedClubId}`
          : `http://localhost:5000/api/gallery`;
        const res = await axios.get(url);
        setImages(res.data?.images || []);
      } catch (e) {
        setErr("Failed to load gallery.");
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, [selectedClubId]);

  const handleDelete = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/gallery/${imageId}`, {
        data: { user_id: user?.id },
      });
      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to delete image.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader 
        title="Gallery" 
        showBack 
        showHome
        action={canUserUpload ? (
          <Link
            to="/gallery/add"
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Add Image
          </Link>
        ) : null}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {err && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">
            {err}
          </div>
        )}

        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <label className="text-sm font-medium">Filter by Club:</label>
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-xs bg-white"
          >
            <option value="">All Clubs</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>

        {/* --- FIX: Add proper loading placeholder --- */}
        {loading ? (
          <div className="text-center text-gray-600 py-8">Loading images...</div>
        ) : !images.length ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-700">
            <h3 className="text-lg font-semibold">No images found</h3>
            <p className="text-sm">No images have been posted for this club yet.</p>
            {canUserUpload && (
              <Link
                className="mt-4 inline-block px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500"
                to="/gallery/add"
              >
                Add Image
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-white border rounded-lg overflow-hidden shadow-sm group relative"
              >
                {canUserUpload && (
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    aria-label="Delete Image"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
                <div className="p-3">
                  <div className="font-semibold truncate">{img.caption}</div>
                  <div className="text-xs text-gray-500">
                    {img.club_name || `Club ID: ${img.club_id}`} •{" "}
                    {new Date(img.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
