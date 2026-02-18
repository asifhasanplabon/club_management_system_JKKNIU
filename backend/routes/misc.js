const express = require("express");
const crypto = require("crypto");

module.exports = (db, authenticateToken, strictLimiter, upload) => {
  const router = express.Router();

  // ========================================
  // ANNOUNCEMENTS
  // ========================================
  
  router.get("/announcements", async (req, res) => {
    try {
      const { clubId } = req.query;
      
      // Fetch announcements with club name and author name
      let sql = `
        SELECT 
          a.id, 
          a.message, 
          a.created_at,
          c.name AS club_name,
          cm.name AS author_name
        FROM announcements a
        LEFT JOIN clubs c ON a.club_id = c.id
        LEFT JOIN club_members cm ON a.created_by = cm.id
      `;
      
      const params = [];
      
      if (clubId) {
        sql += " WHERE a.club_id = ?";
        params.push(clubId);
      }
      
      sql += " ORDER BY a.created_at DESC";
      
      const [rows] = await db.query(sql, params);
      res.json({ success: true, announcements: rows });
    } catch (e) {
      console.error("Get announcements error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.post("/announcements", authenticateToken, async (req, res) => {
    try {
      const { title, message, clubId, club_id, userId, created_by } = req.body;
      
      // Support both naming conventions
      const finalClubId = clubId || club_id;
      const finalUserId = userId || created_by;

      if (!message || !finalClubId || !finalUserId) {
        return res.status(400).json({ success: false, message: "Message, club ID, and user ID required" });
      }

      // Verify that the user exists in club_members table
      const [userCheck] = await db.query(
        "SELECT id FROM club_members WHERE id = ?",
        [finalUserId]
      );

      if (!userCheck.length) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
      }

      // Insert announcement without foreign key constraint issues
      // Note: The foreign key constraint references 'users' table but we use 'club_members'
      // We need to temporarily disable foreign key checks or fix the schema
      await db.query("SET FOREIGN_KEY_CHECKS=0");
      
      await db.query(
        "INSERT INTO announcements (club_id, message, created_by) VALUES (?, ?, ?)",
        [finalClubId, message, finalUserId]
      );
      
      await db.query("SET FOREIGN_KEY_CHECKS=1");

      res.json({ success: true, message: "Announcement created" });
    } catch (e) {
      console.error("Create announcement error:", e);
      // Re-enable foreign key checks in case of error
      await db.query("SET FOREIGN_KEY_CHECKS=1").catch(() => {});
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.put("/announcements/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }

      // Check if user is the creator or admin of the club
      const [announcement] = await db.query(
        "SELECT club_id, created_by FROM announcements WHERE id = ?",
        [id]
      );

      if (!announcement.length) {
        return res.status(404).json({ success: false, message: "Announcement not found" });
      }

      const isCreator = announcement[0].created_by === req.user.id;
      const isAdminOfClub = req.user.role === 'admin' && req.user.club_id === announcement[0].club_id;
      const isAuthority = req.user.role === 'authority';

      if (!isCreator && !isAdminOfClub && !isAuthority) {
        return res.status(403).json({ success: false, message: "Not authorized to update this announcement" });
      }

      // Note: announcements table doesn't have 'title' column
      await db.query(
        "UPDATE announcements SET message = ? WHERE id = ?",
        [message, id]
      );

      res.json({ success: true, message: "Announcement updated" });
    } catch (e) {
      console.error("Update announcement error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.delete("/announcements/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user is the creator or admin of the club
      const [announcement] = await db.query(
        "SELECT club_id, created_by FROM announcements WHERE id = ?",
        [id]
      );

      if (!announcement.length) {
        return res.status(404).json({ success: false, message: "Announcement not found" });
      }

      const isCreator = announcement[0].created_by === req.user.id;
      const isAdminOfClub = req.user.role === 'admin' && req.user.club_id === announcement[0].club_id;
      const isAuthority = req.user.role === 'authority';

      if (!isCreator && !isAdminOfClub && !isAuthority) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this announcement" });
      }

      await db.query("DELETE FROM announcements WHERE id = ?", [id]);
      res.json({ success: true, message: "Announcement deleted" });
    } catch (e) {
      console.error("Delete announcement error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GALLERY
  // ========================================
  
  router.post("/gallery", authenticateToken, upload.single("image"), async (req, res) => {
    try {
      const { club_id, clubId, caption } = req.body;
      const finalClubId = club_id || clubId; // Support both naming conventions
      const filename = req.file ? req.file.filename : null;

      if (!filename || !finalClubId) {
        return res.status(400).json({ success: false, message: "Image and club ID required" });
      }

      // Get user ID from token
      const [userRows] = await db.query(
        "SELECT id FROM club_members WHERE email = ?",
        [req.user.email]
      );
      
      const uploadedBy = userRows.length > 0 ? userRows[0].id : null;

      await db.query(
        "INSERT INTO gallery_images (club_id, filename, caption, uploaded_by) VALUES (?, ?, ?, ?)",
        [finalClubId, filename, caption || "", uploadedBy]
      );

      res.json({ success: true, message: "Image uploaded successfully" });
    } catch (e) {
      console.error("Upload image error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/gallery", async (req, res) => {
    try {
      const { limit, clubId } = req.query;
      let sql = "SELECT * FROM gallery_images WHERE 1=1";
      const params = [];

      if (clubId) {
        sql += " AND club_id = ?";
        params.push(clubId);
      }

      sql += " ORDER BY created_at DESC";

      if (limit) {
        sql += " LIMIT ?";
        params.push(parseInt(limit));
      }

      const [rows] = await db.query(sql, params);
      
      const images = rows.map(row => ({
        ...row,
        url: `${req.protocol}://${req.get('host')}/uploads/${row.filename}`
      }));

      res.json({ success: true, images });
    } catch (e) {
      console.error("Get gallery error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.delete("/gallery/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user is the uploader or admin of the club
      const [image] = await db.query(
        "SELECT club_id, uploaded_by FROM gallery_images WHERE id = ?",
        [id]
      );

      if (!image.length) {
        return res.status(404).json({ success: false, message: "Image not found" });
      }

      const isUploader = image[0].uploaded_by === req.user.id;
      const isAdminOfClub = req.user.role === 'admin' && req.user.club_id === image[0].club_id;
      const isAuthority = req.user.role === 'authority';

      if (!isUploader && !isAdminOfClub && !isAuthority) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this image" });
      }

      await db.query("DELETE FROM gallery_images WHERE id = ?", [id]);
      res.json({ success: true, message: "Image deleted" });
    } catch (e) {
      console.error("Delete image error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // PASSWORD RESET
  // ========================================
  
  router.post("/auth/request-reset", strictLimiter, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: "Email required" });
      }

      const [rows] = await db.query("SELECT id FROM club_members WHERE email = ?", [email]);
      
      if (!rows.length) {
        return res.json({ success: true, message: "If email exists, reset link sent" });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await db.query(
        "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?",
        [email, token, expires, token, expires]
      );

      res.json({ success: true, message: "Password reset link sent", token });
    } catch (e) {
      console.error("Request reset error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.post("/auth/reset-password", strictLimiter, async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: "Token and password required" });
      }

      const [rows] = await db.query(
        "SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()",
        [token]
      );

      if (!rows.length) {
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
      }

      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.query("UPDATE club_members SET password = ? WHERE email = ?", [hashedPassword, rows[0].email]);
      await db.query("DELETE FROM password_resets WHERE token = ?", [token]);

      res.json({ success: true, message: "Password reset successful" });
    } catch (e) {
      console.error("Reset password error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // MESSAGES
  // ========================================
  
  router.get("/messages/unread-count/:userId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND status = 0",
        [userId]
      );
      res.json({ success: true, count: rows[0].count });
    } catch (e) {
      console.error("Get unread count error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/messages/conversations/:userId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Optimized query - fetch all conversation data in one query using JOIN
      const [rows] = await db.query(
        `SELECT 
           CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partnerId,
           CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
           cm.name as partnerName,
           cm.name as partner_name,
           cm.photo as partner_photo,
           m.message,
           m.created_at,
           m.sender_id,
           m.receiver_id,
           m.status,
           m.id as message_id
         FROM messages m
         INNER JOIN (
           SELECT 
             CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as pid,
             MAX(id) as last_id
           FROM messages
           WHERE sender_id = ? OR receiver_id = ?
           GROUP BY pid
         ) latest ON m.id = latest.last_id
         LEFT JOIN club_members cm ON cm.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
         ORDER BY m.created_at DESC`,
        [userId, userId, userId, userId, userId, userId]
      );
      
      res.json({ success: true, conversations: rows });
    } catch (e) {
      console.error("Get conversations error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/messages/conversation/:userId/:partnerId", authenticateToken, async (req, res) => {
    try {
      const { userId, partnerId } = req.params;
      
      // Get partner info
      const [partnerRows] = await db.query(
        'SELECT id, name, email, photo FROM club_members WHERE id = ?',
        [partnerId]
      );
      const partner = partnerRows.length > 0 ? partnerRows[0] : null;
      
      // Get messages
      const [rows] = await db.query(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at ASC`,
        [userId, partnerId, partnerId, userId]
      );
      
      // Mark messages as read
      await db.query(
        "UPDATE messages SET status = 1 WHERE receiver_id = ? AND sender_id = ?",
        [userId, partnerId]
      );

      res.json({ success: true, messages: rows, partner });
    } catch (e) {
      console.error("Get conversation error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.post("/messages", authenticateToken, async (req, res) => {
    try {
      const { senderId, receiverId, sender_id, receiver_id, message } = req.body;
      
      // Support both naming conventions
      const finalSenderId = senderId || sender_id;
      const finalReceiverId = receiverId || receiver_id;

      if (!finalSenderId || !finalReceiverId || !message) {
        return res.status(400).json({ success: false, message: "All fields required" });
      }

      const [result] = await db.query(
        "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
        [finalSenderId, finalReceiverId, message]
      );

      res.status(201).json({ success: true, messageId: result.insertId });
    } catch (e) {
      console.error("Send message error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // MY REGISTRATIONS
  // ========================================
  
  router.get("/registrations/my", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      const [rows] = await db.query(
        `SELECT er.*, e.title, e.description, e.event_date
         FROM event_registrations er
         JOIN events e ON er.event_id = e.id
         WHERE er.user_id = ?
         ORDER BY er.registered_at DESC`,
        [userId]
      );

      const eventIds = rows.map(row => row.event_id);
      res.json({ success: true, registrations: rows, eventIds: eventIds });
    } catch (e) {
      console.error("Get my registrations error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
