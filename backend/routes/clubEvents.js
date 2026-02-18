const express = require("express");

module.exports = (db, authenticateToken) => {
  const router = express.Router();

  // ========================================
  // CREATE EVENT FOR CLUB
  // ========================================
  router.post("/:clubId/events", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      const { title, description, event_date } = req.body;

      if (!title || !event_date) {
        return res.status(400).json({ success: false, message: "Title and date required" });
      }

      await db.query(
        "INSERT INTO events (club_id, title, description, event_date) VALUES (?, ?, ?, ?)",
        [clubId, title, description || "", event_date]
      );

      res.json({ success: true, message: "Event created successfully" });
    } catch (e) {
      console.error("Create event error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET CLUB EVENTS
  // ========================================
  router.get("/:clubId/events", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      const [rows] = await db.query(
        "SELECT * FROM events WHERE club_id = ? ORDER BY event_date DESC",
        [clubId]
      );
      res.json({ success: true, events: rows });
    } catch (e) {
      console.error("Get club events error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
