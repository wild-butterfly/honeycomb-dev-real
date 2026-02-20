"use strict";
// server/src/controllers/files.controller.ts
// File upload, listing, and deletion for job files
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = listFiles;
exports.uploadFiles = uploadFiles;
exports.removeFile = removeFile;
exports.removeFiles = removeFiles;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const storage_1 = require("../config/storage");
// GET /api/jobs/:jobId/files
// List all files for a job (with optional folder filter)
async function listFiles(req, res) {
    const { jobId } = req.params;
    const { folder } = req.query;
    const { db, user } = req;
    if (!db || !user) {
        return res.status(500).json({ error: "Database or user not available" });
    }
    try {
        let query = `
      SELECT 
        jf.*,
        COALESCE(e.name, 'System') as uploaded_by_name
      FROM job_files jf
      LEFT JOIN employees e ON jf.uploaded_by = e.id
      WHERE jf.job_id = $1
    `;
        const params = [jobId];
        if (folder && folder !== "all") {
            query += ` AND jf.folder = $2`;
            params.push(folder);
        }
        query += ` ORDER BY jf.uploaded_at DESC`;
        const result = await db.query(query, params);
        // Add full URLs to files
        const files = result.rows.map((row) => ({
            ...row,
            file_url: (0, storage_1.getFileUrl)(row.file_path),
        }));
        res.json(files);
    }
    catch (err) {
        console.error("Error listing files:", err);
        res.status(500).json({ error: "Failed to list files" });
    }
}
// POST /api/jobs/:jobId/files
// Upload one or more files to a job
async function uploadFiles(req, res) {
    const { jobId } = req.params;
    const { folder = "documents" } = req.body;
    const { db, user } = req;
    if (!db || !user) {
        return res.status(500).json({ error: "Database or user not available" });
    }
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }
    try {
        // Get employee_id for current user
        const employeeResult = await db.query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [user.id]);
        const employeeId = employeeResult.rows[0]?.id || null;
        // Create job folder if it doesn't exist (local storage only)
        if (storage_1.storageConfig.type === "local" && storage_1.storageConfig.local) {
            const jobFolderPath = path_1.default.join(storage_1.storageConfig.local.uploadDir, "jobs", String(jobId), folder);
            await promises_1.default.mkdir(jobFolderPath, { recursive: true });
        }
        // Insert each file into database
        const insertedFiles = [];
        for (const file of files) {
            // Generate storage path
            const timestamp = Date.now();
            const safeFilename = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const storagePath = (0, storage_1.getStoragePath)(Number(jobId), folder, safeFilename);
            // Move file to destination (local storage)
            if (storage_1.storageConfig.type === "local" && storage_1.storageConfig.local) {
                const destPath = path_1.default.join(storage_1.storageConfig.local.uploadDir, storagePath);
                await promises_1.default.rename(file.path, destPath);
            }
            // Insert metadata into database
            const result = await db.query(`INSERT INTO job_files (
          job_id, filename, original_filename, file_path, 
          file_size, file_type, folder, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`, [
                jobId,
                safeFilename,
                file.originalname,
                storagePath,
                file.size,
                file.mimetype,
                folder,
                employeeId,
            ]);
            const insertedFile = result.rows[0];
            insertedFiles.push({
                ...insertedFile,
                uploaded_by_name: null, // Will be populated on next fetch
                file_url: (0, storage_1.getFileUrl)(storagePath),
            });
        }
        res.status(201).json({
            message: `${files.length} file(s) uploaded successfully`,
            files: insertedFiles,
        });
    }
    catch (err) {
        console.error("Error uploading files:", err);
        // Clean up uploaded files on error
        if (files) {
            for (const file of files) {
                try {
                    await promises_1.default.unlink(file.path);
                }
                catch (unlinkErr) {
                    console.error("Error cleaning up file:", unlinkErr);
                }
            }
        }
        res.status(500).json({ error: "Failed to upload files" });
    }
}
// DELETE /api/files/:id
// Delete a file by ID
async function removeFile(req, res) {
    const { id } = req.params;
    const { db, user } = req;
    if (!db || !user) {
        return res.status(500).json({ error: "Database or user not available" });
    }
    try {
        // Get file info
        const fileResult = await db.query(`SELECT * FROM job_files WHERE id = $1`, [id]);
        if (fileResult.rows.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }
        const file = fileResult.rows[0];
        // Delete from storage
        await (0, storage_1.deleteFile)(file.file_path);
        // Delete from database
        await db.query(`DELETE FROM job_files WHERE id = $1`, [id]);
        res.json({ message: "File deleted successfully" });
    }
    catch (err) {
        console.error("Error deleting file:", err);
        res.status(500).json({ error: "Failed to delete file" });
    }
}
// DELETE /api/jobs/:jobId/files/batch
// Delete multiple files by IDs
async function removeFiles(req, res) {
    const { jobId } = req.params;
    const { ids } = req.body;
    const { db, user } = req;
    if (!db || !user) {
        return res.status(500).json({ error: "Database or user not available" });
    }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No file IDs provided" });
    }
    try {
        // Get files info
        const filesResult = await db.query(`SELECT * FROM job_files WHERE id = ANY($1) AND job_id = $2`, [ids, jobId]);
        const files = filesResult.rows;
        if (files.length === 0) {
            return res.status(404).json({ error: "No files found" });
        }
        // Delete from storage
        for (const file of files) {
            try {
                await (0, storage_1.deleteFile)(file.file_path);
            }
            catch (err) {
                console.error(`Failed to delete file ${file.id}:`, err);
                // Continue with other files
            }
        }
        // Delete from database
        const result = await db.query(`DELETE FROM job_files WHERE id = ANY($1) AND job_id = $2`, [ids, jobId]);
        res.json({
            message: `${result.rowCount} file(s) deleted successfully`,
            deleted: result.rowCount,
        });
    }
    catch (err) {
        console.error("Error deleting files:", err);
        res.status(500).json({ error: "Failed to delete files" });
    }
}
