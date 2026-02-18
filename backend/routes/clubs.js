const express = require("express");
const bcrypt = require("bcrypt");

const saltRounds = 10;

// Helper functions
const fileURL = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

const origin = (req) => `${req.protocol}://${req.get('host')}`;

module.exports = (db, authenticateToken, upload) => {
  const router = express.Router();
  
  // ========================================
  // GET ALL CLUBS (Public)
  // ========================================
  router.get("/", async (_req, res) => {
    try {
      const [rows] = await db.query("SELECT id, name, description FROM clubs ORDER BY id DESC");
      res.json({ success: true, clubs: rows });
    } catch (e) {
      console.error("Get clubs error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET SINGLE CLUB (Public)
  // ========================================
  router.get("/:clubId", async (req, res) => {
    try {
      const { clubId } = req.params;
      const [rows] = await db.query("SELECT id, name, description FROM clubs WHERE id=? LIMIT 1", [clubId]);
      if (!rows.length) return res.status(404).json({ success: false, message: "Club not found" });
      res.json({ success: true, club: rows[0] });
    } catch (e) {
      console.error("Get club error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // UPDATE CLUB (Admin or Authority)
  // ========================================
  router.put("/:clubId", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      const { name, description, userId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }
      
      const [userRows] = await db.query("SELECT role, club_id FROM club_members WHERE id = ?", [userId]);
      if (!userRows.length) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
      
      const user = userRows[0];
      const isAuthority = user.role === 'authority';
      const isAdminOfThisClub = user.role === 'admin' && user.club_id.toString() === clubId;

      if (!isAuthority && !isAdminOfThisClub) {
        return res.status(403).json({ success: false, message: "You do not have permission to edit this club." });
      }
      
      if (!name || !description) {
        return res.status(400).json({ success: false, message: "Club name and description are required." });
      }

      await db.query(
        "UPDATE clubs SET name = ?, description = ? WHERE id = ?",
        [name, description, clubId]
      );

      res.json({ success: true, message: "Club updated successfully." });

    } catch (e) {
      console.error("Update club error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET CLUB DETAILS (Authenticated)
  // ========================================
  router.get("/:clubId/details", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;

      const [clubRows] = await db.query("SELECT id, name, description FROM clubs WHERE id = ?", [clubId]);
      if (!clubRows.length) return res.status(404).json({ success: false, message: "Club not found" });
      const clubInfo = clubRows[0];

      const EC_POS = ["President", "Vice President", "General Secretary", "Joint Secretary", "Treasurer", "Organizing Secretary", "Media & PR", "Event Coordinator", "Executive Member"];
      const posIndex = (p) => {
        const i = EC_POS.findIndex((x) => x.toLowerCase() === String(p || "").toLowerCase());
        return i === -1 ? 999 : i;
      };
      
      const [execRows] = await db.query(
        `SELECT id, name, email, photo, position FROM club_members
         WHERE club_id = ? AND LOWER(TRIM(position)) IN (
           'president','vice president','general secretary','joint secretary',
           'treasurer','organizing secretary','media & pr','event coordinator','executive member'
         )`, [clubId]
      );
      
      const executives = execRows
        .map((r) => ({ ...r, photo: fileURL(req, r.photo) }))
        .sort((a, b) => posIndex(a.position) - posIndex(b.position));

      const [eventRows] = await db.query(
        "SELECT id, title, description, event_date AS date FROM events WHERE club_id = ? AND event_date >= CURDATE() ORDER BY event_date ASC LIMIT 5",
        [clubId]
      );

      const [imageRows] = await db.query(
        "SELECT id, caption, filename, created_at FROM gallery_images WHERE club_id = ? ORDER BY created_at DESC LIMIT 6",
        [clubId]
      );
      
      const images = imageRows.map((r) => ({ ...r, url: `${origin(req)}/uploads/${r.filename}` }));

      res.json({
        success: true,
        details: {
          info: clubInfo,
          executives: executives,
          events: eventRows,
          images: images,
        },
      });
    } catch (e) {
      console.error("Get club details error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET CLUB MEMBERS (Authenticated)
  // ========================================
  router.get("/:clubId/members", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      const [members] = await db.query(
        `SELECT id, name, email, photo, contact_no, gender, dept, session, role, position, joined_at
         FROM club_members WHERE club_id = ? ORDER BY joined_at DESC`,
        [clubId]
      );
      
      const sanitized = members.map((m) => ({
        ...m,
        photo: fileURL(req, m.photo),
        password: undefined,
      }));
      
      res.json({ success: true, members: sanitized });
    } catch (e) {
      console.error("Get members error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // UPDATE MEMBER POSITIONS (Authenticated)
  // ========================================
  router.put("/:clubId/members/positions", authenticateToken, async (req, res) => {
    try {
      const { positions } = req.body;
      if (!Array.isArray(positions)) {
        return res.status(400).json({ success: false, message: "Invalid positions data" });
      }

      for (const { id, position } of positions) {
        await db.query("UPDATE club_members SET position = ? WHERE id = ?", [position, id]);
      }

      res.json({ success: true, message: "Positions updated successfully" });
    } catch (e) {
      console.error("Update positions error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET EXECUTIVE COMMITTEE (Authenticated)
  // ========================================
  router.get("/:clubId/executive-committee/view", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      const EC_POS = [
        "President", "Vice President", "General Secretary", "Joint Secretary",
        "Treasurer", "Organizing Secretary", "Media & PR", "Event Coordinator", "Executive Member"
      ];

      const [rows] = await db.query(
        `SELECT id, name, email, photo, position FROM club_members
         WHERE club_id = ? AND LOWER(TRIM(position)) IN (
           'president','vice president','general secretary','joint secretary',
           'treasurer','organizing secretary','media & pr','event coordinator','executive member'
         )`,
        [clubId]
      );

      const posIndex = (p) => {
        const i = EC_POS.findIndex((x) => x.toLowerCase() === String(p || "").toLowerCase());
        return i === -1 ? 999 : i;
      };

      const executives = rows
        .map((r) => ({ ...r, photo: fileURL(req, r.photo) }))
        .sort((a, b) => posIndex(a.position) - posIndex(b.position));

      res.json({ success: true, executives, committee: executives }); // Support both field names
    } catch (e) {
      console.error("Get EC error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
