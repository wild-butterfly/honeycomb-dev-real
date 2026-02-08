// server/src/index.ts
import express from "express";
import cors from "cors";
import meRoutes from "./routes/me";


/* ROUTES */
import employeeRoutes from "./routes/employees";
import companyRoutes from "./routes/companies";
import jobRoutes from "./routes/jobs";
import assignmentRoutes from "./routes/assignments";
import tasksRoutes from "./routes/tasks";

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());


/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (_req, res) => {
  res.send("Honeycomb API running 🚀");
});


/* ===============================
   API ROUTES (IMPORTANT)
   All routes under /api/*
================================ */

app.use("/api/me", meRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/tasks", tasksRoutes);

/* ===============================
   404 FALLBACK
================================ */
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ===============================
   SERVER START
================================ */
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Honeycomb API running on http://localhost:${PORT}`);
});
