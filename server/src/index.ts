import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { pool } from "./db";
import { ensureUploadDir, logStorageConfig, storageConfig } from "./config/storage";

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
import employeeNotesRoutes from "./routes/employeeNotes";
import filesRoutes from "./routes/files";
import invoiceRoutes from "./routes/invoices";
import invoiceSettingsRoutes from "./routes/invoiceSettings";
import pdfRoutes from "./routes/pdf";
import serviceCatalogsRoutes from "./routes/serviceCatalogs";
import generalSettingsRoutes from "./routes/generalSettings";

dotenv.config();

const app = express();

/* GLOBAL */

// Enable CORS with proper configuration
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-Company-Id",
      "x-Employee-Id",
    ],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

/* STATIC FILES - Serve uploaded files */
if (storageConfig.type === "local" && storageConfig.local) {
  app.use("/uploads", express.static(storageConfig.local.uploadDir));
}

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

app.use("/api", employeeNotesRoutes);

app.use("/api", filesRoutes);

app.use("/api", invoiceRoutes);

app.use("/api", invoiceSettingsRoutes);

app.use("/api", pdfRoutes);

app.use("/api", serviceCatalogsRoutes);

app.use("/api/general-settings", requireAuth, withDbContext, generalSettingsRoutes);

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

// Initialize storage before starting server
(async () => {
  try {
    logStorageConfig();
    await ensureUploadDir();
    
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
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
