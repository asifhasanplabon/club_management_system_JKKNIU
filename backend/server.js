// server.js - Optimized with organized routes
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
require("dotenv").config();

// Import database connection
const db = require('./db');

// Import middleware
const { authenticateToken, generateToken } = require('./middleware/auth');

const app = express();

// ═══════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// ═══════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, 
  message: { success: false, message: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ═══════════════════════════════════════════════════════════════════
// STATIC FILES & FILE UPLOAD
// ═══════════════════════════════════════════════════════════════════

const IMAGES_DIR = path.join(__dirname, "images");
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use("/images", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(IMAGES_DIR));

app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) =>
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (_, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Invalid file type"));
  }
});

// ═══════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════

// Import route modules
const usersRoutes = require('./routes/users')(db, authenticateToken, strictLimiter, upload);
const clubsRoutes = require('./routes/clubs')(db, authenticateToken, upload);
const eventsRoutes = require('./routes/events')(db, authenticateToken);
const clubEventsRoutes = require('./routes/clubEvents')(db, authenticateToken);
const miscRoutes = require('./routes/misc')(db, authenticateToken, strictLimiter, upload);
const authorityRoutes = require('./routes/authority')(db, authenticateToken);

// Mount routes with correct paths
// Users routes (includes /club_members/login, /register, /users/*, /members/*)
app.use('/api', usersRoutes);

// Club routes
app.use('/api/clubs', clubsRoutes);
app.use('/api/clubs', clubEventsRoutes);

// Event routes
app.use('/api/events', eventsRoutes);

// Misc routes (announcements, gallery, messages, auth, registrations)
app.use('/api', miscRoutes);

// Authority routes
app.use('/api/authority', authorityRoutes);

// ═══════════════════════════════════════════════════════════════════
// ROOT & HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

app.get("/", (_req, res) => {
  res.json({ 
    success: true, 
    message: "Club Management System API", 
    version: "2.0",
    endpoints: {
      users: "/api/users/*",
      clubs: "/api/clubs/*",
      events: "/api/events/*",
      authority: "/api/authority/*",
      announcements: "/api/announcements",
      gallery: "/api/gallery",
      messages: "/api/messages/*"
    }
  });
});

app.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, status: "healthy", database: "connected" });
  } catch (e) {
    res.status(500).json({ success: false, status: "unhealthy", database: "disconnected", error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// ═══════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  🚀 Club Management System API Server                   ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  ➤ Server running on: http://localhost:${PORT}`.padEnd(59) + "║");
  console.log(`║  ➤ Environment: ${process.env.NODE_ENV || 'development'}`.padEnd(59) + "║");
  console.log("║  ➤ Routes organized and optimized                       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
});

module.exports = app;
