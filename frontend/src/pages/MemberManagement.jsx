// frontend/src/pages/MemberManagement.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiSearch, FiTrash2, FiShield, FiUser } from 'react-icons/fi';
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import { getImageUrl } from "../utils/imageHelper";

export default function MemberManagement() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [clubName, setClubName] = useState('');
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user and check permissions
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      navigate("/login");
      return;
    }
    setUser(loggedUser);

    const isClubAdmin = loggedUser.role === 'admin' && loggedUser.club_id && loggedUser.club_id.toString() === clubId;
    const isAuthority = loggedUser.role === 'authority';

    if (!isClubAdmin && !isAuthority) {
      setError("You do not have permission to access this page.");
      setLoading(false);
    }
  }, [clubId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Fetch all members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const [clubRes, membersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/clubs/${clubId}`),
        axios.get(`http://localhost:5000/api/clubs/${clubId}/members`)
      ]);
      
      setClubName(clubRes.data.club?.name || '');
      setMembers(membersRes.data.members || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'authority')) {
      fetchMembers();
    }
  }, [user, clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredMembers = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter(m => 
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.role.toLowerCase().includes(term) ||
      m.position.toLowerCase().includes(term)
    );
  }, [q, members]);

  // --- API Handlers ---
  // NOTE: Role management removed - roles are now managed only through Executive Committee
  // President and General Secretary are automatically promoted to admin via /create-executive

  const handleRevoke = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} from the club? This action cannot be undone.`)) {
      return;
    }
    setSuccess('');
    setError('');
    try {
      const res = await axios.delete(`http://localhost:5000/api/members/${member.id}`, {
        data: { adminId: user.id } // Send adminId in body
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        // Update local state
        setMembers(prev => prev.filter(m => m.id !== member.id));
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError(e.response?.data?.message || "An error occurred.");
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader
        title="Member Management"
        subtitle={clubName}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Clubs", path: "/clubs" },
          { label: clubName || "...", path: `/clubs/${clubId}` },
          { label: "Manage Members" }
        ]}
        actions={
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, role..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        }
      />
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} autoClose />}

        {filteredMembers.length === 0 ? (
          <Card>
            <EmptyState icon={FiUsers} title="No members found" description={q ? "Try a different search." : "This club has no members."} />
          </Card>
        ) : (
          <Card padding={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Position</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(m.photo)}
                            alt={m.name}
                            className="w-10 h-10 rounded-full object-cover border"
                            onError={(e) => { e.target.src = 'http://localhost:5000/images/default.jpg'; }}
                          />
                          <div>
                            <Link to={`/view-profile/${m.id}`} className="font-semibold text-gray-900 hover:text-green-600">
                              {m.name}
                            </Link>
                            <div className="text-xs text-gray-500">
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${m.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {m.role}
                          </span>
                          {(m.position === 'President' || m.position === 'General Secretary') && (
                            <span className="text-xs text-gray-500 italic">
                              (via {m.position})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.position}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {/* Only show remove button - roles managed via Executive Committee */}
                          <Button 
                            size="sm" 
                            variant="danger" 
                            icon={FiTrash2} 
                            onClick={() => handleRevoke(m)}
                            disabled={user.id === m.id} // Can't revoke self
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}