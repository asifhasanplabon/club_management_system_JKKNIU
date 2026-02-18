import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";

// --- New Imports ---
import {
  FiUsers, FiCheckCircle, FiXCircle, FiInfo, FiCalendar, FiClock
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import { getImageUrl } from "../utils/imageHelper";
import EmptyState from "../components/EmptyState";
// --------------------

export default function ViewEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPastEvent, setIsPastEvent] = useState(false);

  const isRegistered = myRegistrations.includes(Number(eventId));
  const isAdminOfThisClub = user?.role === 'admin' && user?.club_id && event?.club_id && 
    String(user.club_id) === String(event.club_id);
  const isAuthority = user?.role === 'authority';
  const canEdit = isAdminOfThisClub || isAuthority;

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login");
      return; // <-- Added return
    }
    setUser(loggedUser);
  }, [navigate]);

  // --- New function for Navbar logout ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (!user) return; 

    const loadData = async () => {
      try {
        setLoading(true);
        setErr("");
        
        const eventRes = await axios.get(`http://localhost:5000/api/events/${eventId}`);
        if (eventRes.data.success) {
          const eventData = eventRes.data.event;
          setEvent(eventData);
          
          const eventDate = new Date(eventData.event_date);
          if (eventDate < new Date()) {
            setIsPastEvent(true);
          }
        } else {
          setErr(eventRes.data.message || "Event not found");
        }

        const regRes = await axios.get(`http://localhost:5000/api/registrations/my?userId=${user.id}`);
        if (regRes.data.success) {
          setMyRegistrations(regRes.data.eventIds || []);
        }
        
      } catch (e) {
        setErr(e.response?.data?.message || "Error fetching event details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId, user]);

  useEffect(() => {
    if (isAdminOfThisClub) {
      const fetchAttendees = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/events/${eventId}/registrations`);
          setAttendees(res.data.attendees || []);
        } catch (e) {
          console.error("Failed to fetch attendees:", e);
        }
      };
      fetchAttendees();
    }
  }, [isAdminOfThisClub, eventId]);

  const handleRegister = async () => {
    setIsSubmitting(true);
    setErr(""); 
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/register`, { 
        userId: user.id 
      });
      setMyRegistrations([...myRegistrations, Number(eventId)]);
    } catch (e) {
      setErr(e.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    setIsSubmitting(true);
    setErr("");
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}/register`, {
        data: { userId: user.id } 
      });
      setMyRegistrations(myRegistrations.filter(id => id !== Number(eventId)));
    } catch (e) {
      setErr(e.response?.data?.message || "Unregistration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Replaced old loading div with LoadingSpinner component ---
  if (loading || !user) { // Wait for user to load as well
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Replaced old header with Navbar & PageHeader --- */}
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title="Event Details"
        subtitle={event?.title || "Loading..."}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Events", path: "/events" },
          { label: event?.title || "..." }
        ]}
      />

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
        
        {/* --- Replaced old error div with Alert component --- */}
        {err && (
          <Alert type="error" message={err} onClose={() => setErr("")} />
        )}
        
        {!event && !loading ? (
          <Card>
            <EmptyState title="Event Not Found" description="This event may have been moved or deleted." />
          </Card>
        ) : event && (
          <>
            {/* --- Wrapped event details in a Card --- */}
            <Card>
              <span className="text-sm font-medium text-green-600">
                <Link to={`/clubs/${event.club_id}`} className="hover:underline">
                  {event.club_name}
                </Link>
              </span>
              <h2 className="text-3xl font-bold mt-1">{event.title}</h2>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 mt-2">
                 <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    <span>{new Date(event.event_date).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    <span>{new Date(event.event_date).toLocaleTimeString(undefined, {
                      hour: '2-digit', minute: '2-digit'
                    })}</span>
                 </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-1">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description || "No description provided."}</p>
              </div>

              <div className="mt-6 pt-6 border-t">
                {isPastEvent ? (
                  <Alert
                    type="info"
                    message="This event has already passed and registration is closed."
                    icon={FiInfo}
                  />
                ) : isRegistered ? (
                  <Button
                    variant="danger"
                    size="lg"
                    fullWidth
                    onClick={handleUnregister}
                    loading={isSubmitting}
                    icon={FiXCircle}
                  >
                    {isSubmitting ? "Cancelling..." : "Unregister"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleRegister}
                    loading={isSubmitting}
                    icon={FiCheckCircle}
                  >
                    {isSubmitting ? "Registering..." : "Register for this Event"}
                  </Button>
                )}
              </div>
            </Card>

            {/* --- Wrapped attendee list in a Card --- */}
            {isAdminOfThisClub && (
              <Card padding={false} className="overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3">
                  <FiUsers className="w-5 h-5 text-green-700" />
                  <h3 className="text-xl font-semibold">Event Attendees ({attendees.length})</h3>
                </div>
                {attendees.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {attendees.map(attendee => (
                      <li key={attendee.id} className="p-3 flex items-center gap-3">
                        <img src={getImageUrl(attendee.photo)} alt={attendee.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="font-medium">{attendee.name}</div>
                          <div className="text-sm text-gray-500">{attendee.email}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  // --- Replaced <p> with <EmptyState> ---
                  <EmptyState
                    description="No one has registered for this event yet."
                  />
                )}
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}