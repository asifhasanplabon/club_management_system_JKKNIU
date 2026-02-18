// club_mgnt_bak/frontend/src/pages/Messages.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiPlus, FiSearch, FiX, FiMessageSquare, FiSend, FiClock, FiCheck } from "react-icons/fi";
import { getImageUrl } from "../utils/imageHelper";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [convoRes, memberRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/messages/conversations/${user.id}`),
          axios.get(`http://localhost:5000/api/clubs/${user.club_id}/members`)
        ]);
        
        setConversations(convoRes.data.conversations || []);
        setAllMembers(
          (memberRes.data.members || []).filter(m => m.id !== user.id)
        );
      } catch (e) {
        setErr("Failed to load messages or members.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const isUnread = (convo) => {
    return convo.status === 0 && convo.receiver_id === user?.id;
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch) return allMembers;
    const term = memberSearch.toLowerCase();
    return allMembers.filter(m => 
      m.name.toLowerCase().includes(term) || 
      m.email.toLowerCase().includes(term)
    );
  }, [allMembers, memberSearch]);

  const unreadCount = useMemo(() => {
    return conversations.filter(isUnread).length;
  }, [conversations, user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <PageHeader 
        title="Messages" 
        subtitle={unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
        showBack 
        showHome
        action={
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={() => setShowNewMessageModal(true)}
          >
            New Message
          </Button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {err && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <FiX className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{err}</p>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && <LoadingSpinner fullScreen={false} />}
        
        {/* Empty State */}
        {!loading && conversations.length === 0 && (
          <EmptyState
            icon={FiMessageSquare}
            title="No Messages Yet"
            description="Start a conversation by sending a message to your club members"
            action={
              <Button
                variant="primary"
                icon={FiPlus}
                onClick={() => setShowNewMessageModal(true)}
              >
                Start Conversation
              </Button>
            }
          />
        )}

        {/* Conversation List */}
        {!loading && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((convo) => {
              const unread = isUnread(convo);
              const isSent = convo.sender_id === user?.id;
              
              return (
                <Link
                  key={convo.id}
                  to={`/messages/${convo.partner_id}`}
                  className="block group"
                >
                  <Card 
                    hover 
                    className={`transition-all ${unread ? 'border-l-4 border-green-600 bg-green-50/30' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={getImageUrl(convo.partner_photo)}
                          alt={convo.partner_name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                        {unread && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors ${unread ? 'text-green-700' : ''}`}>
                            {convo.partner_name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500 ml-2 flex-shrink-0">
                            <FiClock className="w-3 h-3" />
                            <span>{formatMessageTime(convo.created_at)}</span>
                          </div>
                        </div>
                        
                        <p className={`text-sm truncate flex items-center gap-2 ${unread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {isSent && (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <FiSend className="w-3 h-3" />
                              <span className="font-medium">You:</span>
                            </span>
                          )}
                          <span className="truncate">{convo.message}</span>
                        </p>
                        
                        {/* Status indicator */}
                        {isSent && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <FiCheck className="w-3 h-3" />
                            <span>Sent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Message</h2>
                <p className="text-sm text-gray-500 mt-1">Select a member to start chatting</p>
              </div>
              <button 
                onClick={() => setShowNewMessageModal(false)} 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search members by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
                {memberSearch && (
                  <button
                    onClick={() => setMemberSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <FiX className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Member List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No members found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setShowNewMessageModal(false);
                        navigate(`/messages/${member.id}`);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                    >
                      <img 
                        src={getImageUrl(member.photo)} 
                        alt={member.name} 
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate group-hover:text-green-700 transition-colors">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">{member.email}</div>
                        {member.position && member.position !== 'member' && (
                          <div className="text-xs text-green-600 font-medium mt-0.5">
                            {member.position}
                          </div>
                        )}
                      </div>
                      <FiSend className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
