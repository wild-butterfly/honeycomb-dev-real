"use strict";
// server/src/routes/files.ts
// File upload, listing, and deletion routes
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const dbContext_1 = require("../middleware/dbContext");
const files_controller_1 = require("../controllers/files.controller");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Temporary location - files will be moved in controller
        cb(null, path_1.default.join(__dirname, "../../uploads/temp"));
    },
    filename: (req, file, cb) => {
        // Temporary filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    },
});
// All routes require authentication and database context
router.use(authMiddleware_1.requireAuth, dbContext_1.withDbContext);
// GET /api/jobs/:jobId/files - List files for a job
router.get("/jobs/:jobId/files", files_controller_1.listFiles);
// POST /api/jobs/:jobId/files - Upload files to a job
router.post("/jobs/:jobId/files", upload.array("files", 10), files_controller_1.uploadFiles);
// DELETE /api/files/:id - Delete a single file
router.delete("/files/:id", files_controller_1.removeFile);
// DELETE /api/jobs/:jobId/files/batch - Delete multiple files
router.delete("/jobs/:jobId/files/batch", files_controller_1.removeFiles);
exports.default = router;
