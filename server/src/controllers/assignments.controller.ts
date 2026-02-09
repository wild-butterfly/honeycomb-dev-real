// server/controllers/assignments.controller.ts
// Created by Clevermode © 2026

import { Request, Response } from "express";
import { pool } from "../db";

/* ===============================
   INTERNAL: Recalculate job status
================================ */
const recalcJobStatus = async (jobId: number) => {
  const result = await pool.query(
    `
    SELECT COUNT(*) FILTER (WHERE completed = false) AS incomplete
    FROM assignments
    WHERE job_id = $1
    `,
    [jobId]
  );

  const incompleteCount = Number(result.rows[0]?.incomplete ?? 0);

  await pool.query(
    `
    UPDATE jobs
    SET status = $2
    WHERE id = $1
    `,
    [jobId, incompleteCount === 0 ? "completed" : "active"]
  );
};

/* ===============================
   GET ASSIGNMENTS
   - /assignments              → ALL
   - /assignments?job_id=123   → ONLY that job
================================ */
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const jobIdRaw = req.query.job_id;

    // 🔒 Explicit filtering
    if (jobIdRaw !== undefined) {
      const jobId = Number(jobIdRaw);

      if (!Number.isInteger(jobId)) {
        return res.status(400).json({ error: "Invalid job_id" });
      }

      const result = await pool.query(
        `
        SELECT
          id,
          job_id,
          employee_id,
          start_time,
          end_time,
          completed
        FROM assignments
        WHERE job_id = $1
        ORDER BY start_time ASC
        `,
        [jobId]
      );

      return res.json(result.rows);
    }

    // 🔁 Fallback: return ALL assignments
    const result = await pool.query(
      `
      SELECT
        id,
        job_id,
        employee_id,
        start_time,
        end_time,
        completed
      FROM assignments
      ORDER BY start_time ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("assignments.getAll", err);
    res.status(500).json({ error: "Assignments load failed" });
  }
};

/* ===============================
   CREATE ASSIGNMENT
================================ */
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { job_id, employee_id, start_time, end_time } = req.body;

    if (
      !Number.isInteger(Number(job_id)) ||
      !Number.isInteger(Number(employee_id)) ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({ error: "Invalid assignment payload" });
    }

    const result = await pool.query(
      `
      INSERT INTO assignments (job_id, employee_id, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [job_id, employee_id, start_time, end_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("assignments.create", err);
    res.status(500).json({ error: "Assignment create failed" });
  }
};

/* ===============================
   UPDATE ASSIGNMENT
================================ */
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const assignmentId = Number(req.params.id);
    const { employee_id, start_time, end_time, completed } = req.body;

    if (!Number.isInteger(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment id" });
    }

    const result = await pool.query(
      `
      UPDATE assignments
      SET
        employee_id = COALESCE($1, employee_id),
        start_time  = COALESCE($2, start_time),
        end_time    = COALESCE($3, end_time),
        completed   = COALESCE($4, completed)
      WHERE id = $5
      RETURNING *
      `,
      [employee_id, start_time, end_time, completed, assignmentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const assignment = result.rows[0];

    // 🔥 JOB STATUS RECALC
    await recalcJobStatus(assignment.job_id);

    res.json(assignment);
  } catch (err) {
    console.error("assignments.update", err);
    res.status(500).json({ error: "Assignment update failed" });
  }
};

/* ===============================
   COMPLETE ASSIGNMENTS (BULK)
   PUT /assignments/complete
   body: { assignmentIds: number[] }
================================ */
export const completeAssignments = async (req: Request, res: Response) => {
  try {
    const { assignmentIds } = req.body;

    if (
      !Array.isArray(assignmentIds) ||
      assignmentIds.length === 0 ||
      !assignmentIds.every((id) => Number.isInteger(Number(id)))
    ) {
      return res.status(400).json({ error: "Invalid assignmentIds" });
    }

    const result = await pool.query(
      `
      UPDATE assignments
      SET completed = TRUE
      WHERE id = ANY($1::int[])
      RETURNING job_id
      `,
      [assignmentIds]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "No assignments updated" });
    }

    // 🔥 Affected jobs (unique)
    const jobIds = [...new Set(result.rows.map((r) => r.job_id))];

    for (const jobId of jobIds) {
      await recalcJobStatus(jobId);
    }

    res.json({ updated: result.rows.length });
  } catch (err) {
    console.error("assignments.complete", err);
    res.status(500).json({ error: "Assignment completion failed" });
  }
};

/* ===============================
   REOPEN ASSIGNMENTS (BULK)
   PUT /assignments/reopen
   body: { assignmentIds: number[] }
================================ */
export const reopenAssignments = async (req: Request, res: Response) => {
  try {
    const { assignmentIds } = req.body;

    if (
      !Array.isArray(assignmentIds) ||
      assignmentIds.length === 0 ||
      !assignmentIds.every((id) => Number.isInteger(Number(id)))
    ) {
      return res.status(400).json({ error: "Invalid assignmentIds" });
    }

    const result = await pool.query(
      `
      UPDATE assignments
      SET completed = FALSE
      WHERE id = ANY($1::int[])
      RETURNING job_id
      `,
      [assignmentIds]
    );

    const jobIds = [...new Set(result.rows.map((r) => r.job_id))];

    for (const jobId of jobIds) {
      await recalcJobStatus(jobId);
    }

    res.json({ updated: result.rows.length });
  } catch (err) {
    console.error("assignments.reopen", err);
    res.status(500).json({ error: "Assignment reopen failed" });
  }
};



/* ===============================
   DELETE ASSIGNMENT
================================ */
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const assignmentId = Number(req.params.id);

    const result = await pool.query(
      `DELETE FROM assignments WHERE id = $1 RETURNING job_id`,
      [assignmentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    await recalcJobStatus(result.rows[0].job_id);

    res.status(204).send();
  } catch (err) {
    console.error("assignments.delete", err);
    res.status(500).json({ error: "Assignment delete failed" });
  }
};
