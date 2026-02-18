// src/pages/AddImage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { canUpload } from "../utils/permissions";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import { FiUpload } from "react-icons/fi";

export default function AddImage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // For image preview
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u || null);
    
    if (!canUpload(u)) {
      setErr("Only club executives can add images.");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isExecutive = canUpload(user);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!isExecutive || !user?.club_id) {
      setErr("Only club executives can add images.");
      return;
    }
    
    if (!caption.trim()) {
      setErr("Caption is required.");
      return;
    }
    if (!file) {
      setErr("Please choose an image file.");
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("club_id", user.club_id);
      fd.append("caption", caption.trim());
      fd.append("uploaded_by", user?.id || "");
      fd.append("image", file);

      const res = await axios.post("http://localhost:5000/api/gallery", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setOk("Image uploaded successfully!");
        setTimeout(() => navigate("/gallery"), 1000);
      } else {
        setErr(res.data?.message || "Upload failed.");
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title="Add Image to Gallery"
        subtitle={user?.club_name || "Upload a new photo"}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Gallery", path: "/gallery" },
          { label: "Add Image" }
        ]}
      />

      <main className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in-up">
        {err && <Alert type="error" message={err} onClose={() => setErr("")} />}
        {ok && <Alert type="success" message={ok} onClose={() => setOk("")} />}

        {!isExecutive ? (
           <Alert type="error" message="You do not have permission to access this page." />
        ) : (
          <Card>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                <div className="w-full aspect-video rounded-lg bg-gray-100 border-2 border-dashed flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-500">No image selected</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border rounded-lg px-3 py-2
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Write a short caption..."
                />
              </div>

              <div className="text-right">
                <Button
                  type="submit"
                  loading={saving}
                  disabled={saving || !file || !caption}
                  icon={FiUpload}
                >
                  {saving ? "Uploading…" : "Upload to Gallery"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}