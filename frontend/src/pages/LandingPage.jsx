// club_mgnt_bak/frontend/src/pages/LandingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMenu,
  FiX,
  FiImage,
  FiUsers,
  FiZap,
  FiChevronRight,
  FiBell,
} from "react-icons/fi";

export default function LandingPage() {
  const navigate = useNavigate();

  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]); // State for gallery
  const [mobileOpen, setMobileOpen] = useState(false);

  // Init & fetch
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const fetchData = async () => {
      try {
        const [clubsRes, eventsRes, annRes, galleryRes] = await Promise.all([
          axios.get("http://localhost:5000/api/clubs"),
          axios.get("http://localhost:5000/api/events"), // <-- FIX: Fetch ALL events
          axios.get("http://localhost:5000/api/announcements"),
          axios.get("http://localhost:5000/api/gallery?limit=3"), // Get latest 3 gallery images
        ]);

        // Popular (random 3)
        const allClubs = clubsRes?.data?.clubs || [];
        const rand = [...allClubs].sort(() => 0.5 - Math.random()).slice(0, 3);
        setClubs(rand);

        setEvents(eventsRes?.data?.events.slice(0, 3) || []); // <-- Get 3 most RECENT events
        setAnnouncements(annRes?.data?.announcements || []);
        setGalleryImages(galleryRes?.data?.images || []);
      } catch (err) {
        console.error("Landing load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Open menu"
            >
              {mobileOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
            <Link to="/" className="text-xl font-extrabold text-green-700">
              JKKNIU Club Hub
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#clubs" className="text-gray-700 hover:text-green-700">
              Clubs
            </a>
            <a href="#events" className="text-gray-700 hover:text-green-700">
              Events
            </a>
            <a href="#gallery" className="text-gray-700 hover:text-green-700">
              Gallery
            </a>
            <a href="#announcements" className="text-gray-700 hover:text-green-700">
              Notices
            </a>

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-green-700 hover:bg-green-50"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <a
                href="#clubs"
                className="block py-2 text-gray-700 hover:text-green-700"
                onClick={() => setMobileOpen(false)}
              >
                Clubs
              </a>
              <a
                href="#events"
                className="block py-2 text-gray-700 hover:text-green-700"
                onClick={() => setMobileOpen(false)}
              >
                Events
              </a>
              <a
                href="#gallery"
                className="block py-2 text-gray-700 hover:text-green-700"
                onClick={() => setMobileOpen(false)}
              >
                Gallery
              </a>
              <a
                href="#announcements"
                className="block py-2 text-gray-700 hover:text-green-700"
                onClick={() => setMobileOpen(false)}
              >
                Notices
              </a>

              <div className="pt-2 flex gap-2">
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-center hover:bg-green-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 px-4 py-2 rounded-lg text-green-700 text-center hover:bg-green-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-center hover:bg-green-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-gray-700 text-center hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white px-4"
        style={{
          backgroundImage: "url(/images/jkkniu.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 z-0"></div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}>
            Organize, Discover & Join
          </h1>
          <p className="mt-4 text-lg text-gray-200 animate-fade-in-up"
             style={{ animationDelay: "0.2s" }}>
            Your central hub for all club activities, events, and announcements at JKKNIU.
          </p>
          <div className="mt-8 flex items-center gap-4 animate-fade-in-up"
               style={{ animationDelay: "0.3s" }}>
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Login
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors shadow-lg"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
      {/* --- END HERO SECTION --- */}

      
      {/* --- GALLERY PREVIEW --- */}
      <section id="gallery" className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <SectionHeader
          icon={<FiImage />}
          title="Recent Gallery"
          subtitle="See the latest moments captured by our clubs."
          link="/gallery"
          linkText="View Full Gallery"
        />
        
        {loading ? (
          <LoadingGrid />
        ) : galleryImages.length === 0 ? (
          <Empty title="No images yet" subtitle="The gallery is currently empty." />
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {galleryImages.map((img) => (
              <Link
                key={img.id}
                to="/gallery"
                className="group block relative rounded-lg overflow-hidden shadow-md aspect-video"
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="font-semibold truncate">{img.caption}</h3>
                  <p className="text-sm text-gray-200">{img.club_name || "Club Activity"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      {/* --- END GALLERY PREVIEW --- */}


      {/* --- POPULAR CLUBS (FIXED LINKS) --- */}
      <section id="clubs" className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <SectionHeader
            icon={<FiUsers />}
            title="Popular Clubs"
            subtitle="Find your community from our active clubs."
            link="/clubs"
            linkText="Explore all Clubs"
          />

          {loading ? (
            <LoadingGrid />
          ) : clubs.length === 0 ? (
            <Empty title="No clubs yet" subtitle="Clubs will appear once created." />
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`} // <-- FIX: Link to club profile page
                  className="p-5 rounded-lg border bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-900">{club.name}</div>
                    <div className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {club.description || "No description available."}
                    </div>
                  </div>
                  <div className="mt-4">
                    <span
                      className="text-sm font-medium inline-flex items-center gap-1 text-green-600"
                    >
                      Learn More <FiChevronRight />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* --- END POPULAR CLUBS --- */}

      {/* --- EVENTS (FIXED API CALL & LINKS) --- */}
      <section id="events" className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <SectionHeader
          icon={<FiZap />}
          title="Recent Events" // Changed from "Upcoming"
          subtitle="See what’s been happening on campus."
          link="/events"
          linkText="View all Events"
        />

        {loading ? (
          <LoadingGrid />
        ) : events.length === 0 ? (
          <Empty title="No events posted" subtitle="New events will appear here." />
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((e) => (
              <div key={e.id} className="p-5 rounded-lg border bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="font-semibold text-gray-900">{e.title || "Untitled Event"}</div>
                <div className="text-sm text-green-700 font-medium mt-1">
                  {formatDate(e.event_date || e.date) || "Date TBA"}
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {e.description || "No description."}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
                    onClick={() => navigate(`/events/${e.id}`)}
                  >
                    Details
                  </button>
                  <button
                    className="text-sm px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/events/${e.id}`)} // <-- FIX: Link to details page
                  >
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* --- END EVENTS --- */}

      {/* --- ANNOUNCEMENTS (FiBell fix) --- */}
      <section id="announcements" className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <SectionHeader
            icon={<FiBell />} // <-- FIX: Was FiMegaphone
            title="Latest Announcements"
            subtitle="Stay on top of important updates from all clubs."
          />
          
          {loading ? (
             <div className="mt-8 space-y-3">
               {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg border bg-gray-50 animate-pulse" />)}
             </div>
          ) : announcements.length === 0 ? (
            <Empty title="No announcements yet" subtitle="New notices will be posted here." />
          ) : (
            <div className="mt-8 space-y-4">
              {announcements.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-lg border bg-white hover:shadow-lg hover:border-green-300 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      <FiBell className="w-4 h-4" /> {/* <-- FIX: Was FiMegaphone */}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800">{n.message}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>{n.club_name || "System"}</strong>
                        {n.author_name && ` (via ${n.author_name})`}
                        {` • ${formatDate(n.created_at, true)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* --- END ANNOUNCEMENTS --- */}

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-bold">JKKNIU Club Hub</div>
            <p className="text-gray-400 mt-2 text-sm">
              A unified space for students to engage, organize, and grow together.
            </p>
          </div>
          <div>
            <div className="font-semibold">Explore</div>
            <ul className="mt-2 space-y-1 text-gray-300 text-sm">
              <li><Link to="/clubs" className="hover:underline">Clubs</Link></li>
              <li><Link to="/events" className="hover:underline">Events</Link></li>
              <li><Link to="/gallery" className="hover:underline">Image Gallery</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Account</div>
            <ul className="mt-2 space-y-1 text-gray-300 text-sm">
              {!user ? (
                <>
                  <li><Link to="/login" className="hover:underline">Login</Link></li>
                  <li><Link to="/register" className="hover:underline">Register</Link></li>
                  <li><Link to="/authority/login" className="hover:underline text-yellow-300">Authority Login</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/dashboard" className="hover:underline">Dashboard</Link></li>
                  <li><Link to="/my-profile" className="hover:underline">My Profile</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <div className="font-semibold">Contact</div>
            <p className="text-gray-300 text-sm mt-2">
              Jatiya Kabi Kazi Nazrul Islam University, Mymensingh, Bangladesh
            </p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 text-center text-gray-400 text-sm">
            © {year} JKKNIU Club Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────────────────────────────
 * Reusable Components
 * ─────────────────────────────────────────────── */
function SectionHeader({ icon, title, subtitle, link, linkText }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded bg-green-100 text-green-700 flex items-center justify-center">
            {icon}
          </span>
          <h2 className="text-3xl font-bold">{title}</h2>
        </div>
        <p className="text-gray-600 mt-2">{subtitle}</p>
      </div>
      {link && (
        <Link
          to={link}
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-500 font-medium transition-colors"
        >
          {linkText} <FiChevronRight />
        </Link>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 rounded-lg border bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function Empty({ title, subtitle }) {
  return (
    <div className="mt-8 p-8 text-center border rounded-lg bg-gray-50">
      <div className="font-semibold text-gray-900">{title}</div>
      {subtitle && <div className="text-gray-600 text-sm mt-1">{subtitle}</div>}
    </div>
  );
}

/* ───────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────── */
function formatDate(d, includeTime = false) {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return includeTime ? date.toLocaleString() : date.toLocaleDateString();
  } catch {
    return d;
  }
}