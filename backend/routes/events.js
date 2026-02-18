const express = require("express");

module.exports = (db, authenticateToken) => {
  const router = express.Router();

  // ========================================
  // GET ALL EVENTS (Public)
  // ========================================
  router.get("/", async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT e.id, e.title, e.description, e.event_date, c.name AS club_name
         FROM events e
         LEFT JOIN clubs c ON e.club_id = c.id
         ORDER BY e.event_date DESC`
      );
      res.json({ success: true, events: rows });
    } catch (e) {
      console.error("Get events error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET UPCOMING EVENTS (Public)
  // ========================================
  router.get("/upcoming", async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT e.id, e.title, e.description, e.event_date, c.name AS club_name
         FROM events e
         LEFT JOIN clubs c ON e.club_id = c.id
         WHERE e.event_date >= CURDATE()
         ORDER BY e.event_date ASC
         LIMIT 10`
      );
      res.json({ success: true, events: rows });
    } catch (e) {
      console.error("Get upcoming events error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET SINGLE EVENT (Public)
  // ========================================
  router.get("/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      const [rows] = await db.query(
        `SELECT e.*, c.name AS club_name, c.id AS club_id
         FROM events e
         LEFT JOIN clubs c ON e.club_id = c.id
         WHERE e.id = ?`,
        [eventId]
      );
      
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      
      res.json({ success: true, event: rows[0] });
    } catch (e) {
      console.error("Get event error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // REGISTER FOR EVENT (Authenticated)
  // ========================================
  router.post("/:eventId/register", authenticateToken, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId, name, email } = req.body;

      if (!userId || !name || !email) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      await db.query(
        "INSERT INTO event_registrations (event_id, user_id, user_name, user_email) VALUES (?, ?, ?, ?)",
        [eventId, userId, name, email]
      );

      res.json({ success: true, message: "Registered for event successfully" });
    } catch (e) {
      console.error("Register for event error:", e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: "Already registered for this event" });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // UNREGISTER FROM EVENT
  // ========================================
  router.delete("/:eventId/register", authenticateToken, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      await db.query(
        "DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?",
        [eventId, userId]
      );

      res.json({ success: true, message: "Unregistered from event" });
    } catch (e) {
      console.error("Unregister from event error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET EVENT REGISTRATIONS (Authenticated)
  // ========================================
  router.get("/:eventId/registrations", authenticateToken, async (req, res) => {
    try {
      const { eventId } = req.params;
      const [rows] = await db.query(
        `SELECT er.user_id, er.registered_at, cm.name, cm.email
         FROM event_registrations er
         LEFT JOIN club_members cm ON er.user_id = cm.id
         WHERE er.event_id = ?
         ORDER BY er.registered_at DESC`,
        [eventId]
      );

      res.json({ success: true, registrations: rows, attendees: rows });
    } catch (e) {
      console.error("Get registrations error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
