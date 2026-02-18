// src/pages/DisplayEvents.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiMapPin, FiPlus } from "react-icons/fi";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Alert from "../components/Alert";

export default function DisplayEvents() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedUser);
    
    const loadEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/events"); 
        
        if (res.data.success) {
          setEvents(res.data.events);
        } else {
          setErr("No events found");
        }
      } catch (e) {
        setErr("Error fetching events");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <PageHeader
        title="Events"
        subtitle="Browse and register for upcoming events"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Events" }
        ]}
        actions={
          user && (user.role === "admin" || user.role === "authority") && (
            <Button 
              icon={FiPlus} 
              onClick={() => navigate("/events/create")}
            >
              Create Event
            </Button>
          )
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {err && (
          <Alert
            type="error"
            message={err}
            onClose={() => setErr("")}
            autoClose
          />
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 skeleton rounded-lg"></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No events found"
            description="Check back later for upcoming events or create your first event"
            action={() => navigate("/")}
            actionLabel="Go Home"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <Card
                key={event.id}
                hover
                onClick={() => navigate(`/events/${event.id}`)}
                className="animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FiCalendar className="text-green-600 w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                    Upcoming
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {event.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {event.description || "No description available"}
                </p>
                
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <FiClock className="w-4 h-4 mr-2" />
                  <span>{new Date(event.date || event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}