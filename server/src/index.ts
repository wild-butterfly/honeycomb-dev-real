import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";

import { requireAuth } from "./middleware/authMiddleware";
import { withDbContext } from "./middleware/dbContext";

/* ROUTES */
import meRoutes from "./routes/me";
import employeeRoutes from "./routes/employees";
import companyRoutes from "./routes/companies";
import jobRoutes from "./routes/jobs";
import assignmentRoutes from "./routes/assignments";
import tasksRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();

/* GLOBAL */

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

app.use(express.json());

/* HEALTH */

app.get("/", (_req, res) => {
  res.send("Honeycomb API running 🚀");
});

/* PUBLIC */
app.use("/api/auth", authRoutes);

/* PROTECTED ROUTES */

app.use("/api/me", requireAuth, withDbContext, meRoutes);

app.use("/api/employees", requireAuth, withDbContext, employeeRoutes);

app.use("/api/companies", requireAuth, withDbContext, companyRoutes);

app.use("/api/jobs", requireAuth, withDbContext, jobRoutes);

app.use("/api/assignments", requireAuth, withDbContext, assignmentRoutes);

app.use("/api/tasks", requireAuth, withDbContext, tasksRoutes);

/* 404 */

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ERROR */

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* START */

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, () => {
  console.log(`🚀 Honeycomb API running on http://localhost:${PORT}`);
});

/* SHUTDOWN */

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  server.close(() => {
    process.exit(0);
  });
});
