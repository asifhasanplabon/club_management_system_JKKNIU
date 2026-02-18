import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiPlus, FiTrash2, FiEdit, FiSave, FiX } from 'react-icons/fi';

// --- New Imports ---
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
// --------------------

export default function Announcements() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin-specific state
  const [isPosting, setIsPosting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [postError, setPostError] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const editInputRef = useRef(null);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('user'));
    if (!loggedUser) {
      navigate('/login');
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
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/announcements'); 
      setAnnouncements(res.data.announcements || []);
    } catch (e) {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAnnouncements();
  }, [user]);

  const isAdmin = user?.role === 'admin' || user?.role === 'authority';

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      setPostError('Message cannot be empty.');
      return;
    }
    setPostError('');
    setIsPosting(true);
    
    try {
      await axios.post('http://localhost:5000/api/announcements', {
        message: newMessage,
        club_id: user.club_id || 0,
        created_by: user.id,
      });
      setNewMessage('');
      await fetchAnnouncements();
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/announcements/${id}`, {
        data: { user_id: user?.id } 
      });
      await fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleEditClick = (announcement) => {
    setEditingId(announcement.id);
    setEditText(announcement.message);
    setPostError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editText.trim()) {
      setPostError('Message cannot be empty.');
      return;
    }
    setIsUpdating(true);
    setPostError('');
    
    try {
      await axios.put(`http://localhost:5000/api/announcements/${editingId}`, {
        message: editText,
        user_id: user.id,
      });
      setEditingId(null);
      setEditText('');
      await fetchAnnouncements();
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Replaced old header with Navbar --- */}
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* --- Replaced old header with PageHeader --- */}
      <PageHeader
        title="Notice Board"
        subtitle="View and post important announcements"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Announcements" }
        ]}
      />

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
        {/* --- Replaced old error <p> with <Alert> --- */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {isAdmin && (
          // --- Wrapped form in a Card ---
          <Card>
            <h2 className="text-xl font-semibold mb-4">Post a New Announcement</h2>
            <form onSubmit={handlePost}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Type your message here..."
              />
              {/* --- Replaced postError <p> with <Alert> --- */}
              {postError && <Alert type="error" message={postError} onClose={() => setPostError('')} />}
              
              {/* --- Replaced <button> with <Button> --- */}
              <Button
                type="submit"
                loading={isPosting}
                className="mt-3"
                icon={FiPlus}
                fullWidth
              >
                {isPosting ? 'Posting...' : 'Post Announcement'}
              </Button>
            </form>
          </Card>
        )}

        {/* --- Replaced loading <div> with <LoadingSpinner> --- */}
        {loading && <LoadingSpinner size="lg" />}
        
        {/* --- Replaced empty <div> with <EmptyState> --- */}
        {!loading && announcements.length === 0 && (
          <Card>
            <EmptyState
              icon={FiBell}
              title="No announcements yet"
              description="New notices will appear here."
            />
          </Card>
        )}
        
        {/* --- List of announcements, wrapped in Cards --- */}
        <div className="space-y-4">
          {announcements.map((n) => (
            <Card key={n.id} className="relative">
              
              {editingId === n.id ? (
                <form onSubmit={handleUpdate}>
                  <textarea
                    ref={editInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                  {postError && <Alert type="error" message={postError} onClose={() => setPostError('')} />}
                  <div className="flex gap-2 mt-2">
                    {/* --- Replaced <button> with <Button> --- */}
                    <Button
                      type="submit"
                      loading={isUpdating}
                      icon={FiSave}
                      size="sm"
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancelEdit}
                      icon={FiX}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      <FiBell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pr-16">
                      <p className="text-gray-800 whitespace-pre-wrap">{n.message}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>{n.club_name || 'System'}</strong>
                        {n.author_name && ` (via ${n.author_name})`}
                        {` • ${new Date(n.created_at).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {/* --- Replaced <button> with <Button variant="ghost"> --- */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(n)}
                        aria-label="Edit"
                        icon={FiEdit}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(n.id)}
                        aria-label="Delete"
                        icon={FiTrash2}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      />
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}