// club_mgnt_bak/frontend/src/pages/Conversation.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FiSend, FiArrowLeft, FiHome } from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import { getImageUrl } from "../utils/imageHelper";

const POLLING_INTERVAL_MS = 2000; // 2 seconds

export default function Conversation() {
  const navigate = useNavigate();
  const { receiverId } = useParams();
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const messagesEndRef = useRef(null);
  const renderedMessageIds = useRef(new Set());

  // Get logged-in user info
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) navigate("/login");
    setUser(u);
  }, [navigate]);

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change
  useEffect(scrollToBottom, [messages]);

  // Load conversation logic
  const loadConversation = useCallback(async (isInitialLoad = false) => {
    if (!user || !receiverId) return; 

    if (isInitialLoad) {
      setLoading(true);
      renderedMessageIds.current.clear();
    }
    
    try {
      setErr("");
      const res = await axios.get(`http://localhost:5000/api/messages/conversation/${user.id}/${receiverId}`);
      
      if (isInitialLoad) {
        setPartner(res.data.partner);
      }

      const newMessages = res.data.messages || [];
      const hasNewMessages = newMessages.some(msg => !renderedMessageIds.current.has(msg.id));
      
      if (hasNewMessages) {
        setMessages(newMessages);
        newMessages.forEach(msg => renderedMessageIds.current.add(msg.id));
        scrollToBottom();
      }

    } catch (e) {
      console.error("Failed to load conversation:", e);
      setErr("Failed to load conversation. The user might not exist or there was a server error.");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [user, receiverId]);

  // Effect for the *initial* load
  useEffect(() => {
    loadConversation(true);
  }, [loadConversation]);

  // Effect for polling
  useEffect(() => {
    if (!loading) {
      const intervalId = setInterval(() => {
        loadConversation(false);
      }, POLLING_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
  }, [loading, loadConversation]);

  // Handle sending a new message
  const handleSend = async (e) => {
    e.preventDefault(); 
    if (!newMessage.trim() || !user || !partner) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: partner.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    renderedMessageIds.current.add(optimisticMessage.id);
    setNewMessage("");
    scrollToBottom();

    try {
      await axios.post("http://localhost:5000/api/messages", {
        sender_id: user.id,
        receiver_id: partner.id,
        message: newMessage.trim(),
      });
      loadConversation(false); // Manually refresh after send
    } catch (e) {
      console.error("Failed to send message:", e);
      setErr("Failed to send message. Please try again.");
      setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMessage.id));
      renderedMessageIds.current.delete(optimisticMessage.id);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (err && !partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
       <Alert type="error" message={err} />
       <button onClick={() => navigate('/messages')} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
         Back to Messages
       </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col h-screen">
      <header className="bg-white text-gray-900 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b">
         <div className="flex items-center gap-3">
           <button
             onClick={() => navigate("/messages")}
             className="p-2 rounded-full hover:bg-gray-100"
             aria-label="Back to Messages"
           >
             <FiArrowLeft className="w-6 h-6 text-gray-600" />
           </button>
           <img
             src={getImageUrl(partner?.photo)}
             alt={partner?.name || 'Partner'}
             className="w-10 h-10 rounded-full object-cover border"
           />
           <h1 className="text-xl font-bold">{partner?.name || 'Conversation'}</h1>
         </div>
         <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Dashboard"
         >
           <FiHome className="w-6 h-6 text-gray-600" />
         </button>
       </header>

      {/* Chat Messages Area (Scrollable) */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {err && <Alert type="error" message={err} onClose={() => setErr('')} />}
        
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id; 
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${
                  isMe ? "bg-green-600 text-white" : "bg-white text-gray-800"
                }`}
              >
                <p className="break-words">{msg.message}</p>
                <span className={`text-xs mt-1 block text-right ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input Form (Fixed at Bottom) */}
      <footer className="sticky bottom-0 bg-white p-4 border-t">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            autoComplete="off"
          />
          <button
            type="submit"
            className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-all"
            aria-label="Send"
            disabled={!newMessage.trim()}
          >
            <FiSend className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
}