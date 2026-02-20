"use strict";
// employeeNotes.controller.ts
// Created by Honeycomb © 2026
// Employee notes on jobs - contact changes, special instructions, etc.
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.create = exports.getAll = void 0;
const activity_1 = require("../lib/activity");
/* ===============================
   GET ALL NOTES FOR A JOB
================================ */
const getAll = async (req, res) => {
    const db = req.db;
    const { jobId } = req.params;
    try {
        const result = await db.query(`
      SELECT
        en.id,
        en.job_id,
        en.employee_id,
        en.note,
        to_char(en.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        COALESCE(e.name, 'System') AS employee_name
      FROM employee_notes en
      LEFT JOIN employees e ON e.id = en.employee_id
      WHERE en.job_id = $1
      ORDER BY en.created_at DESC
      `, [jobId]);
        return res.json(result.rows);
    }
    catch (err) {
        console.error("employeeNotes.getAll error:", err);
        return res.status(500).json({ error: "Failed to fetch employee notes" });
    }
};
exports.getAll = getAll;
/* ===============================
   CREATE A NEW NOTE
================================ */
const create = async (req, res) => {
    const db = req.db;
    const { jobId } = req.params;
    const { note } = req.body;
    const employeeId = req.user?.employee_id || null;
    if (!note || note.trim() === "") {
        return res.status(400).json({ error: "Note content is required" });
    }
    try {
        // Get actor name (handles superadmin/admin without employee_id)
        const actorName = await (0, activity_1.resolveActorName)(db, req);
        const result = await db.query(`
      INSERT INTO employee_notes (job_id, employee_id, note, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING
        id,
        job_id,
        employee_id,
        note,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
      `, [jobId, employeeId, note.trim()]);
        const noteWithName = {
            ...result.rows[0],
            employee_name: actorName,
        };
        return res.status(201).json(noteWithName);
    }
    catch (err) {
        console.error("employeeNotes.create error:", err);
        return res.status(500).json({ error: "Failed to create note" });
    }
};
exports.create = create;
/* ===============================
   DELETE A NOTE (Optional)
================================ */
const remove = async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const employeeId = req.user?.employee_id;
    try {
        // Only allow deletion if the note was created by this employee or if admin
        const result = await db.query(`
      DELETE FROM employee_notes
      WHERE id = $1 AND employee_id = $2
      RETURNING id
      `, [id, employeeId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Note not found or unauthorized" });
        }
        return res.json({ message: "Note deleted successfully" });
    }
    catch (err) {
        console.error("employeeNotes.remove error:", err);
        return res.status(500).json({ error: "Failed to delete note" });
    }
};
exports.remove = remove;
