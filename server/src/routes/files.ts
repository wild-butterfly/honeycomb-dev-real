// server/src/routes/files.ts
// File upload, listing, and deletion routes

import express from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../middleware/authMiddleware";
import { withDbContext } from "../middleware/dbContext";
import {
  listFiles,
  uploadFiles,
  removeFile,
  removeFiles,
} from "../controllers/files.controller";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temporary location - files will be moved in controller
    cb(null, path.join(__dirname, "../../uploads/temp"));
  },
  filename: (req, file, cb) => {
    // Temporary filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "video/mp4",
      "video/quicktime",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// All routes require authentication and database context
router.use(requireAuth, withDbContext);

// GET /api/jobs/:jobId/files - List files for a job
router.get("/jobs/:jobId/files", listFiles);

// POST /api/jobs/:jobId/files - Upload files to a job
router.post("/jobs/:jobId/files", upload.array("files", 10), uploadFiles);

// DELETE /api/files/:id - Delete a single file
router.delete("/files/:id", removeFile);

// DELETE /api/jobs/:jobId/files/batch - Delete multiple files
router.delete("/jobs/:jobId/files/batch", removeFiles);

export default router;
