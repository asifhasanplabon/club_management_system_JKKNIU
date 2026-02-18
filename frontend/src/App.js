import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import ViewProfile from "./pages/ViewProfile";
import ViewMembers from "./pages/ViewMembers";
import MyProfile from "./pages/MyProfile";
import Clubs from "./pages/Clubs";
import CreateExecutive from "./pages/CreateExecutive";
import ViewImage from "./pages/ViewImage";
import ViewExecutive from "./pages/ViewExecutive";
import AddImage from "./pages/AddImage";
import CreateEvent from "./pages/CreateEvent";
import DisplayEvents from "./pages/DisplayEvents";
import ViewEvent from "./pages/ViewEvent";
import Messages from "./pages/Messages"; 
import Conversation from "./pages/Conversation"; 
import Announcements from "./pages/Announcements";
import ClubProfile from "./pages/ClubProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// --- NEWLY ADDED PAGES ---
import ClubSettings from "./pages/ClubSettings";
import MemberManagement from "./pages/MemberManagement";
// -------------------------

// --- AUTHORITY PAGES ---
import AuthorityLogin from "./pages/AuthorityLogin";
import AuthorityDashboard from "./pages/AuthorityDashboardEnhanced";
import AuthorityCreateClub from "./pages/AuthorityCreateClub";
import AuthorityCreateAnnouncement from "./pages/AuthorityCreateAnnouncement";
// -----------------------

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        {/* <Route path="/profile" element={<Profile />} /> */}{/* --- REMOVED Redundant/Old page --- */}
        <Route path="/view-profile/:id" element={<ViewProfile />} />
        <Route path="/members" element={<ViewMembers/>}/>
        <Route path="/my-profile" element={<MyProfile/>}/>
        <Route path="/clubs" element={<Clubs/>}/>
        <Route path="/create-executive" element={<CreateExecutive/>}/>
        <Route path="/view-executive/:clubId" element={<ViewExecutive/>}/>
        <Route path="/gallery" element={<ViewImage/>}/>
        <Route path="/gallery/add" element={<AddImage/>}/>
        <Route path="/events" element={<DisplayEvents/>}/>
        <Route path="/events/create"element={<CreateEvent/>}/>
        <Route path="/events/:eventId"element={<ViewEvent/>}/>
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/clubs/:clubId" element={<ClubProfile />} />
        
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:receiverId" element={<Conversation />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* --- NEW ADMIN ROUTES --- */}
        <Route path="/clubs/:clubId/settings" element={<ClubSettings />} />
        <Route path="/clubs/:clubId/manage-members" element={<MemberManagement />} />
        {/* ------------------------ */}

        {/* --- AUTHORITY ROUTES --- */}
        <Route path="/authority/login" element={<AuthorityLogin />} />
        <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
        <Route path="/authority/create-club" element={<AuthorityCreateClub />} />
        <Route path="/authority/create-announcement" element={<AuthorityCreateAnnouncement />} />
        {/* ------------------------ */}

      </Routes>
    </Router>
  );
}

export default App;