// server/src/index.ts
// Created by Honeycomb © 2026

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import { withDbContext } from "./middleware/dbContext";

/* ROUTES */
import meRoutes from "./routes/me";
import employeeRoutes from "./routes/employees";
import companyRoutes from "./routes/companies";
import jobRoutes from "./routes/jobs";
import assignmentRoutes from "./routes/assignments";
import tasksRoutes from "./routes/tasks";

dotenv.config();

const app = express();

/* =========================================================
   GLOBAL MIDDLEWARE
========================================================= */

// 🔒 Controlled CORS (production ready)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(express.json());

// 🔥 DB Context (RLS per request)
app.use(withDbContext);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (_req, res) => {
  res.send("Honeycomb API running 🚀");
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/me", meRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/tasks", tasksRoutes);

/* =========================================================
   404 FALLBACK
========================================================= */

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* =========================================================
   SERVER START
========================================================= */

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, () => {
  console.log(`🚀 Honeycomb API running on http://localhost:${PORT}`);
});

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});