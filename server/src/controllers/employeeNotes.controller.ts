// employeeNotes.controller.ts
// Created by Honeycomb © 2026
// Employee notes on jobs - contact changes, special instructions, etc.

import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { resolveActorName } from "../lib/activity";

/* ===============================
   GET ALL NOTES FOR A JOB
================================ */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { jobId } = req.params;

  try {
    const result = await db.query(
      `
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
      `,
      [jobId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("employeeNotes.getAll error:", err);
    return res.status(500).json({ error: "Failed to fetch employee notes" });
  }
};

/* ===============================
   CREATE A NEW NOTE
================================ */
export const create = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { jobId } = req.params;
  const { note } = req.body;
  const employeeId = (req as AuthRequest).user?.employee_id || null;

  if (!note || note.trim() === "") {
    return res.status(400).json({ error: "Note content is required" });
  }

  try {
    // Get actor name (handles superadmin/admin without employee_id)
    const actorName = await resolveActorName(db, req as AuthRequest);

    const result = await db.query(
      `
      INSERT INTO employee_notes (job_id, employee_id, note, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING
        id,
        job_id,
        employee_id,
        note,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
      `,
      [jobId, employeeId, note.trim()]
    );

    const noteWithName = {
      ...result.rows[0],
      employee_name: actorName,
    };

    return res.status(201).json(noteWithName);
  } catch (err) {
    console.error("employeeNotes.create error:", err);
    return res.status(500).json({ error: "Failed to create note" });
  }
};

/* ===============================
   DELETE A NOTE (Optional)
================================ */
export const remove = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { id } = req.params;
  const employeeId = (req as AuthRequest).user?.employee_id;

  try {
    // Only allow deletion if the note was created by this employee or if admin
    const result = await db.query(
      `
      DELETE FROM employee_notes
      WHERE id = $1 AND employee_id = $2
      RETURNING id
      `,
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found or unauthorized" });
    }

    return res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("employeeNotes.remove error:", err);
    return res.status(500).json({ error: "Failed to delete note" });
  }
};
