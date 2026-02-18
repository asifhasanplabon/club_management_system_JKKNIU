// src/pages/CreateEvent.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import { FiPlus } from "react-icons/fi";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login");
    } else if (loggedUser.role !== 'admin' && loggedUser.role !== 'authority') {
      setErr("Only admins can create events.");
    }
    setUser(loggedUser);
    setPageLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  
  const canCreate = user && (user.role === 'admin' || user.role === 'authority');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCreate || !user.club_id) {
      setErr("You do not have permission or club ID is missing.");
      return;
    }

    setErr("");
    setOk("");
    setLoading(true);

    if (new Date(eventDate) < new Date()) {
      setErr("You cannot create an event in the past.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/clubs/${user.club_id}/events`,
        { title, description, event_date: eventDate }
      );

      if (res.data.success) {
        setOk("Event created successfully");
        setTimeout(() => navigate(`/events`), 1000);
      } else {
        setErr(res.data.message || "Event creation failed");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Error creating event in the form");
    } finally {
      setLoading(false);
    }
  };
  
  if (pageLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title="Create New Event"
        subtitle={user?.club_name || "Post an activity for your club"}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Events", path: "/events" },
          { label: "Create" }
        ]}
      />

      <main className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in-up">
        {err && <Alert type="error" message={err} onClose={() => setErr("")} />}
        {ok && <Alert type="success" message={ok} onClose={() => setOk("")} autoClose />}

        {!canCreate ? (
          <Alert type="error" message="You do not have permission to create events." />
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={5}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date & Time</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
                icon={FiPlus}
              >
                {loading ? "Saving..." : "Create Event"}
              </Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}