const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");

const saltRounds = 10;

const fileURL = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

const sanitizeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

module.exports = (db, authenticateToken, strictLimiter, upload) => {
  const router = express.Router();

  // ========================================
  // CLUB MEMBER LOGIN
  // ========================================
  router.post("/club_members/login", strictLimiter, async (req, res) => {
    try {
      const { email, password, clubId } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }
      
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }
      
      if (!clubId || clubId === "") {
        return res.status(400).json({ success: false, message: "Please select a club." });
      }
      
      const sql = `
        SELECT cm.id, cm.club_id, cm.name, cm.email, cm.password, cm.role, 
               cm.description, cm.photo, cm.contact_no, cm.gender, cm.dept, 
               cm.session, cm.joined_at, cm.position, c.name AS club_name
        FROM club_members cm
        LEFT JOIN clubs c ON cm.club_id = c.id
        WHERE cm.email=? AND cm.club_id=?`;
      const [rows] = await db.query(sql, [email, clubId]);
      
      if (!rows.length) {
        return res.status(401).json({ success: false, message: "Email not found for this club." });
      }
      
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      
      if (!match) {
        return res.status(401).json({ success: false, message: "Invalid password." });
      }
      
      user.photo = fileURL(req, user.photo);
      const sanitizedUser = sanitizeUser(user);
      const { generateToken } = require('../middleware/auth');
      const token = generateToken(sanitizedUser);
      return res.json({ success: true, user: sanitizedUser, token });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // USER REGISTRATION
  // ========================================
  router.post("/users/register", async (req, res) => {
    try {
      const { name, email, password, clubId } = req.body;

      if (!name || !email || !password || !clubId) {
        return res.status(400).json({ success: false, message: "All fields are required." });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await db.query(
        "INSERT INTO profile (name, email, password, role, club_id, approval_status) VALUES (?, ?, ?, 'member', ?, 'pending')",
        [name, email, hashedPassword, clubId]
      );

      res.json({ success: true, message: "Registration successful. Waiting for admin approval." });
    } catch (e) {
      console.error("Registration error:", e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: "Email already registered." });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET PENDING USERS
  // ========================================
  router.get("/users/pending/:clubId", authenticateToken, async (req, res) => {
    try {
      const { clubId } = req.params;
      // Note: profile table doesn't have club_id or approval_status in schema
      // This feature appears to be deprecated or not implemented in current schema
      // Return empty array for now
      res.json({ success: true, pending: [] });
    } catch (e) {
      console.error("Get pending users error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // APPROVE USER
  // ========================================
  router.post("/users/approve/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await db.query("SELECT * FROM profile WHERE id = ?", [id]);
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const user = rows[0];

      await db.query(
        "INSERT INTO club_members (club_id, name, email, password, role) VALUES (?, ?, ?, ?, 'member')",
        [user.club_id, user.name, user.email, user.password]
      );

      await db.query("UPDATE profile SET approval_status = 'approved' WHERE id = ?", [id]);

      res.json({ success: true, message: "User approved successfully" });
    } catch (e) {
      console.error("Approve user error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // REJECT USER
  // ========================================
  router.post("/users/reject/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await db.query("UPDATE profile SET approval_status = 'rejected' WHERE id = ?", [id]);
      res.json({ success: true, message: "User rejected" });
    } catch (e) {
      console.error("Reject user error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET CURRENT USER
  // ========================================
  router.get("/me", authenticateToken, async (req, res) => {
    try {
      const userId = req.query.id;
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      const [rows] = await db.query(
        `SELECT cm.id, cm.club_id, cm.name, cm.email, cm.role, cm.description, 
                cm.photo, cm.contact_no, cm.gender, cm.dept, cm.session, 
                cm.joined_at, cm.position, c.name AS club_name
         FROM club_members cm
         LEFT JOIN clubs c ON cm.club_id = c.id
         WHERE cm.id = ?`,
        [userId]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const user = rows[0];
      user.photo = fileURL(req, user.photo);

      res.json({ success: true, user: sanitizeUser(user) });
    } catch (e) {
      console.error("Get me error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET USER BY ID (Profile & Users)
  // ========================================
  const fetchMemberById = async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query(
        `SELECT cm.id, cm.club_id, cm.name, cm.email, cm.role, cm.description, 
                cm.photo, cm.contact_no, cm.gender, cm.dept, cm.session, 
                cm.joined_at, cm.position, c.name AS club_name
         FROM club_members cm
         LEFT JOIN clubs c ON cm.club_id = c.id
         WHERE cm.id = ?`,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const user = rows[0];
      user.photo = fileURL(req, user.photo);

      res.json({ success: true, user: sanitizeUser(user) });
    } catch (e) {
      console.error("Fetch member error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  router.get("/profile/:id", authenticateToken, fetchMemberById);
  router.get("/users/:id", authenticateToken, fetchMemberById);

  // ========================================
  // UPDATE USER
  // ========================================
  router.put("/users/:id", authenticateToken, upload.single("photo"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, contact_no, gender, dept, session, position, description, password } = req.body;
      const photo = req.file ? req.file.filename : null;
      
      const [rows] = await db.query("SELECT email, club_id FROM club_members WHERE id=?", [id]);
      
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      const email = rows[0].email;
      const clubId = rows[0].club_id;
      
      // Check authorization: user can only update their own profile UNLESS they are authority/admin
      const [requestingUserRows] = await db.query(
        "SELECT id, role, club_id FROM club_members WHERE email = ?",
        [req.user.email]
      );
      
      if (!requestingUserRows.length) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
      
      const requestingUser = requestingUserRows[0];
      
      // Allow if: user is updating their own profile OR user is authority OR user is admin of same club
      const canUpdate = 
        requestingUser.id.toString() === id.toString() ||
        requestingUser.role === 'authority' ||
        (requestingUser.role === 'admin' && requestingUser.club_id === clubId);
      
      if (!canUpdate) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to update this profile" 
        });
      }

      const fields = [], params = [];
      if (name !== undefined) { fields.push("name=?"); params.push(name); }
      if (contact_no !== undefined) { fields.push("contact_no=?"); params.push(contact_no); }
      if (gender !== undefined) { fields.push("gender=?"); params.push(gender); }
      if (dept !== undefined) { fields.push("dept=?"); params.push(dept); }
      if (session !== undefined) { fields.push("session=?"); params.push(session); }
      if (position !== undefined) { fields.push("position=?"); params.push(position); }
      if (description !== undefined) { fields.push("description=?"); params.push(description); }
      if (password && String(password).trim()) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        fields.push("password=?");
        params.push(hashedPassword);
      }
      if (photo) { fields.push("photo=?"); params.push(photo); }

      if (fields.length) {
        params.push(id);
        params.push(clubId);
        await db.query(`UPDATE club_members SET ${fields.join(", ")} WHERE id=? AND club_id=?`, params);
      }

      const [rows2] = await db.query(
        `SELECT cm.id, cm.club_id, cm.name, cm.email, cm.role, cm.description, 
                cm.photo, cm.contact_no, cm.gender, cm.dept, cm.session, 
                cm.joined_at, cm.position, c.name AS club_name
         FROM club_members cm
         LEFT JOIN clubs c ON cm.club_id = c.id
         WHERE cm.id=?`, [id]
      );

      const field = [], prams = [];
      if (name !== undefined) { field.push("name=?"); prams.push(name); }
      if (contact_no !== undefined) { field.push("contact_no=?"); prams.push(contact_no); }
      if (gender !== undefined) { field.push("gender=?"); prams.push(gender); }
      if (dept !== undefined) { field.push("dept=?"); prams.push(dept); }
      if (session !== undefined) { field.push("session=?"); prams.push(session); }
      if (photo) { field.push("photo=?"); prams.push(photo); }

      if (field.length) {
        prams.push(email);
        // Profile table doesn't have club_id column
        await db.query(`UPDATE profile SET ${field.join(", ")} WHERE email=?`, prams);
      }

      const updated = rows2[0];
      updated.photo = fileURL(req, updated.photo);
      res.json({ success: true, user: sanitizeUser(updated) });
    } catch (e) {
      console.error("Update user error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // UPDATE PASSWORD
  // ========================================
  router.post("/users/update-password", authenticateToken, async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const [rows] = await db.query("SELECT password FROM club_members WHERE id = ?", [userId]);
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const match = await bcrypt.compare(currentPassword, rows[0].password);
      if (!match) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      await db.query("UPDATE club_members SET password = ? WHERE id = ?", [hashedPassword, userId]);

      const [profileRows] = await db.query("SELECT id FROM profile WHERE id = ?", [userId]);
      if (profileRows.length) {
        await db.query("UPDATE profile SET password = ? WHERE id = ?", [hashedPassword, userId]);
      }

      res.json({ success: true, message: "Password updated successfully" });
    } catch (e) {
      console.error("Update password error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // GET MEMBER COUNT
  // ========================================
  router.get("/members/count", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      const [userRows] = await db.query("SELECT role FROM club_members WHERE id = ?", [userId]);
      if (!userRows.length || userRows[0].role !== 'authority') {
        return res.status(403).json({ success: false, message: "You do not have permission." });
      }

      const [countRows] = await db.query("SELECT COUNT(id) AS total FROM club_members");
      res.json({ success: true, total: countRows[0].total || 0 });

    } catch (e) {
      console.error("Member count error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // UPDATE MEMBER ROLE
  // ========================================
  router.put("/members/:memberId/role", authenticateToken, async (req, res) => {
    try {
      const { memberId } = req.params;
      const { role } = req.body;

      if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }

      // Get the member's club
      const [memberRows] = await db.query(
        "SELECT club_id FROM club_members WHERE id = ?",
        [memberId]
      );
      
      if (!memberRows.length) {
        return res.status(404).json({ success: false, message: "Member not found" });
      }
      
      // Get the requesting user's info
      const [userRows] = await db.query(
        "SELECT id, club_id, role FROM club_members WHERE email = ?",
        [req.user.email]
      );
      
      if (!userRows.length) {
        return res.status(403).json({ success: false, message: "User not found" });
      }
      
      const requestingUser = userRows[0];
      const targetMember = memberRows[0];
      
      // Only authority OR admin of same club can change roles
      if (requestingUser.role !== 'authority' && 
          !(requestingUser.role === 'admin' && requestingUser.club_id === targetMember.club_id)) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to change member roles" 
        });
      }

      await db.query("UPDATE club_members SET role = ? WHERE id = ?", [role, memberId]);
      res.json({ success: true, message: "Role updated successfully" });
    } catch (e) {
      console.error("Update role error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // ========================================
  // DELETE MEMBER
  // ========================================
  router.delete("/members/:memberId", authenticateToken, async (req, res) => {
    try {
      const { memberId } = req.params;
      
      // Get the member to be deleted
      const [memberRows] = await db.query(
        "SELECT club_id FROM club_members WHERE id = ?",
        [memberId]
      );
      
      if (!memberRows.length) {
        return res.status(404).json({ success: false, message: "Member not found" });
      }
      
      // Get the requesting user's info from the database using the email from token
      const [userRows] = await db.query(
        "SELECT id, club_id, role FROM club_members WHERE email = ?",
        [req.user.email]
      );
      
      if (!userRows.length) {
        return res.status(403).json({ success: false, message: "User not found" });
      }
      
      const requestingUser = userRows[0];
      const memberToDelete = memberRows[0];
      
      // Only allow if user is authority OR (admin of the same club)
      if (requestingUser.role !== 'authority' && 
          !(requestingUser.role === 'admin' && requestingUser.club_id === memberToDelete.club_id)) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to delete this member" 
        });
      }
      
      await db.query("DELETE FROM club_members WHERE id = ?", [memberId]);
      res.json({ success: true, message: "Member deleted successfully" });
    } catch (e) {
      console.error("Delete member error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
