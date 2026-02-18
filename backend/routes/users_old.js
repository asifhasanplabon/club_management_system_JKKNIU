const express = require("express");
const db = require("../db");
const bcrypt = require("bcrypt");
const router = express.Router();

const saltRounds = 10;

// Get all users
router.get("/", (req, res) => {
  db.query("SELECT id, name, email, role, created_at FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Register user - SECURITY FIX: Hash password before storing
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // SECURITY: Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    // SECURITY: Hash password before storing
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "student"],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User registered successfully", userId: result.insertId });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Update password endpoint
router.post("/update-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }
    
    // Get current user password from database
    db.query("SELECT password FROM users WHERE id = ?", [userId], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const user = results[0];
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password in database
      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedNewPassword, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Update error:", updateErr);
            return res.status(500).json({ error: "Failed to update password" });
          }
          
          res.json({ message: "Password updated successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ error: "Password update failed" });
  }
});

module.exports = router;
