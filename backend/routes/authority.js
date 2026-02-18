// backend/routes/authority.js
const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { generateToken } = require('../middleware/auth');

module.exports = (db, authenticateToken) => {
  const router = express.Router();
  const saltRounds = 10;

  // ═══════════════════════════════════════════════════════════════════
  // AUTHORITY LOGIN
  // ═══════════════════════════════════════════════════════════════════
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }

      const sql = `SELECT * FROM authority_users WHERE email = ?`;
      const [rows] = await db.query(sql, [email]);

      if (!rows.length) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }

      // Update last login
      await db.query("UPDATE authority_users SET last_login = NOW() WHERE id = ?", [user.id]);

      // Generate token
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'authority',
        designation: user.designation,
        photo: user.photo,
        contact_no: user.contact_no
      };

      const token = generateToken(sanitizedUser);

      return res.json({
        success: true,
        user: sanitizedUser,
        token
      });
    } catch (err) {
      console.error("Authority login error:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET AUTHORITY PROFILE
  // ═══════════════════════════════════════════════════════════════════
  router.get("/profile/:id", authenticateToken, async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT id, name, email, photo, contact_no, designation, created_at, last_login FROM authority_users WHERE id = ?",
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Authority user not found" });
      }

      res.json({ success: true, user: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE CLUB (by authority)
  // ═══════════════════════════════════════════════════════════════════
  router.post("/clubs/create", authenticateToken, async (req, res) => {
    try {
      const {
        name,
        description,
        president_name,
        president_email,
        president_password,
        secretary_name,
        secretary_email,
        secretary_password,
      } = req.body;

      // Validate inputs
      if (!name || !description || !president_name || !president_email || !president_password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      if (!validator.isEmail(president_email)) {
        return res.status(400).json({ success: false, message: "Invalid president email" });
      }

      if (secretary_email && !validator.isEmail(secretary_email)) {
        return res.status(400).json({ success: false, message: "Invalid secretary email" });
      }

      // Hash passwords
      const hashedPresidentPassword = await bcrypt.hash(president_password, saltRounds);
      const hashedSecretaryPassword = secretary_password
        ? await bcrypt.hash(secretary_password, saltRounds)
        : null;

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // 1. Create club
        const [clubResult] = await connection.query(
          "INSERT INTO clubs (name, description) VALUES (?, ?)",
          [name, description]
        );
        const clubId = clubResult.insertId;

        // 2. Create president
        await connection.query(
          `INSERT INTO club_members (club_id, name, email, password, role, position) 
           VALUES (?, ?, ?, ?, 'admin', 'President')`,
          [clubId, president_name, president_email, hashedPresidentPassword]
        );

        const [presidentResult] = await connection.query(
          "SELECT id FROM club_members WHERE email = ? AND club_id = ?",
          [president_email, clubId]
        );
        const presidentId = presidentResult[0].id;

        // 3. Create secretary if provided
        if (secretary_name && secretary_email && hashedSecretaryPassword) {
          await connection.query(
            `INSERT INTO club_members (club_id, name, email, password, role, position) 
             VALUES (?, ?, ?, ?, 'admin', 'Secretary')`,
            [clubId, secretary_name, secretary_email, hashedSecretaryPassword]
          );
        }

        // 4. Create profile entries
        await connection.query(
          "INSERT INTO profile (name, email) VALUES (?, ?)",
          [president_name, president_email]
        );

        if (secretary_name && secretary_email ) {
          await connection.query(
            "INSERT INTO profile (name, email) VALUES (?, ?)",
            [secretary_name, secretary_email]
          );
        }

        await connection.commit();
        connection.release();

        res.json({
          success: true,
          message: "Club created successfully",
          clubId,
          clubName: name,
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    } catch (err) {
      console.error("Create club error:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: "Email already exists in the system",
        });
      }

      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET ALL CLUBS (for authority management)
  // ═══════════════════════════════════════════════════════════════════
  router.get("/clubs", authenticateToken, async (req, res) => {
    try {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.created_at,
          COUNT(DISTINCT cm.id) as member_count,
          COUNT(DISTINCT e.id) as event_count
        FROM clubs c
        LEFT JOIN club_members cm ON c.id = cm.club_id
        LEFT JOIN events e ON c.id = e.club_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;

      const [clubs] = await db.query(sql);

      res.json({ success: true, clubs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE CLUB
  // ═══════════════════════════════════════════════════════════════════
  router.put("/clubs/:clubId", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      const { name, description } = req.body;

      if (!name || !description) {
        return res.status(400).json({ success: false, message: "Name and description are required" });
      }

      await db.query(
        "UPDATE clubs SET name = ?, description = ? WHERE id = ?",
        [name, description, clubId]
      );

      res.json({ success: true, message: "Club updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE CLUB
  // ═══════════════════════════════════════════════════════════════════
  router.delete("/clubs/:clubId", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;

      // Check if club exists
      const [clubs] = await db.query("SELECT id FROM clubs WHERE id = ?", [clubId]);
      if (!clubs.length) {
        return res.status(404).json({ success: false, message: "Club not found" });
      }

      // Delete club (CASCADE will handle related records)
       await db.query("DELETE FROM club_members WHERE club_id = ?", [clubId]);
        await db.query("DELETE FROM users WHERE club_id = ?", [clubId]);
      await db.query("DELETE FROM clubs WHERE id = ?", [clubId]);
 
      res.json({ success: true, message: "Club deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMINISTRATIVE ANNOUNCEMENTS
  // ═════════════════════════════════════════════════════════════════ ══

  // Create announcement
  router.post("/announcements", authenticateToken, async (req, res) => {
    try {
      const { title, message, type, target_audience, created_by, specific_clubs } = req.body;

      if (!title || !message || !created_by) {
        return res.status(400).json({ success: false, message: "Title, message, and creator are required" });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Insert announcement
        const [result] = await connection.query(
          `INSERT INTO administrative_announcements (title, message, type, target_audience, created_by) 
           VALUES (?, ?, ?, ?, ?)`,
          [title, message, type || 'general', target_audience || 'all_clubs', created_by]
        );

        const announcementId = result.insertId;

        // If specific clubs are targeted, insert them
        if (target_audience === 'specific_clubs' && specific_clubs && specific_clubs.length > 0) {
          const values = specific_clubs.map(clubId => [announcementId, clubId]);
          await connection.query(
            "INSERT INTO admin_announcement_clubs (announcement_id, club_id) VALUES ?",
            [values]
          );
        }

        await connection.commit();
        connection.release();

        res.json({ success: true, message: "Announcement created successfully", announcementId });
      } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get all announcements
  router.get("/announcements", authenticateToken, async (req, res) => {
    try {
      const sql = `
        SELECT 
          aa.*,
          au.name as creator_name
        FROM administrative_announcements aa
        JOIN authority_users au ON aa.created_by = au.id
        WHERE aa.is_active = 1
        ORDER BY aa.created_at DESC
      `;

      const [announcements] = await db.query(sql);

      res.json({ success: true, announcements });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get public announcements (for students/clubs)
  router.get("/announcements/public", async (req, res) => {
    try {
      const { clubId } = req.query;

      let sql = `
        SELECT 
          aa.id,
          aa.title,
          aa.message,
          aa.type,
          aa.created_at,
          au.name as creator_name
        FROM administrative_announcements aa
        JOIN authority_users au ON aa.created_by = au.id
        WHERE aa.is_active = 1
          AND (aa.target_audience = 'all_clubs' OR aa.target_audience = 'all_students'
      `;

      const params = [];

      if (clubId) {
        sql += ` OR aa.id IN (
          SELECT announcement_id FROM admin_announcement_clubs WHERE club_id = ?
        )`;
        params.push(clubId);
      }

      sql += `) ORDER BY aa.created_at DESC`;

      const [announcements] = await db.query(sql, params);

      res.json({ success: true, announcements });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Update announcement
  router.put("/announcements/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, type, is_active } = req.body;

      const updates = [];
      const values = [];

      if (title) {
        updates.push("title = ?");
        values.push(title);
      }
      if (message) {
        updates.push("message = ?");
        values.push(message);
      }
      if (type) {
        updates.push("type = ?");
        values.push(type);
      }
      if (typeof is_active !== 'undefined') {
        updates.push("is_active = ?");
        values.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: "No fields to update" });
      }

      values.push(id);

      await db.query(
        `UPDATE administrative_announcements SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      res.json({ success: true, message: "Announcement updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Delete announcement
  router.delete("/announcements/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      await db.query("DELETE FROM administrative_announcements WHERE id = ?", [id]);

      res.json({ success: true, message: "Announcement deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get dashboard statistics
  router.get("/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const [clubCount] = await db.query("SELECT COUNT(*) as count FROM clubs");
      const [memberCount] = await db.query("SELECT COUNT(*) as count FROM club_members");
      const [eventCount] = await db.query("SELECT COUNT(*) as count FROM events");
      const [announcementCount] = await db.query(
        "SELECT COUNT(*) as count FROM administrative_announcements WHERE is_active = 1"
      );

      res.json({
        success: true,
        stats: {
          clubs: clubCount[0].count,
          members: memberCount[0].count,
          events: eventCount[0].count,
          announcements: announcementCount[0].count
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
