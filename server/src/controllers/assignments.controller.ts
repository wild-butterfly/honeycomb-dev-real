// server/controllers/assignments.controller.ts
// Created by Clevermode © 2026
// 🔐 RLS SAFE VERSION

import { Request, Response } from "express";

/* ===============================
   INTERNAL: Recalculate job status
================================ */
const recalcJobStatus = async (db: any, jobId: number) => {
  const result = await db.query(
    `
    SELECT COUNT(*) FILTER (WHERE completed = false) AS incomplete
    FROM assignments
    WHERE job_id = $1
    `,
    [jobId]
  );

  const incompleteCount = Number(result.rows[0]?.incomplete ?? 0);

  await db.query(
    `
    UPDATE jobs
    SET status = $2
    WHERE id = $1
    `,
    [jobId, incompleteCount === 0 ? "completed" : "active"]
  );
};


/* ===============================
   INTERNAL: Auto-generate labour
================================ */
const generateLabourForAssignment = async (db: any, assignmentId: number) => {

  const existsCheck = await db.query(
    `SELECT id FROM labour_entries WHERE assignment_id = $1`,
    [assignmentId]
  );

  if (existsCheck.rowCount) return;

  const result = await db.query(
    `
    SELECT
      a.id,
      a.job_id,
      a.employee_id,
      a.start_time,
      a.end_time,
      e.rate
    FROM assignments a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.id = $1
    `,
    [assignmentId]
  );

  if (!result.rowCount) return;

  const a = result.rows[0];

  const start = new Date(a.start_time);
  const end = new Date(a.end_time);

  let diff = end.getTime() - start.getTime();
  if (diff <= 0) diff += 24 * 60 * 60 * 1000;

  const workedHours = Math.round((diff / 36e5) * 4) / 4;

  const rate = Number(a.rate ?? 0);
  const total = workedHours * rate;

  await db.query(
    `
    INSERT INTO labour_entries
    (
      job_id,
      assignment_id,
      employee_id,
      start_time,
      end_time,
      worked_hours,
      uncharged_hours,
      chargeable_hours,
      rate,
      total,
      notes,
      company_id
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,0,$6,$7,$8,
      'Auto-generated from completed assignment',
      current_setting('app.current_company_id')::int
    )
    `,
    [
      a.job_id,
      a.id,
      a.employee_id,
      a.start_time,
      a.end_time,
      workedHours,
      rate,
      total,
    ]
  );
};


/* ===============================
   GET ASSIGNMENTS
================================ */
export const getAllAssignments = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const jobIdRaw = req.query.job_id;

    if (jobIdRaw !== undefined) {
      const jobId = Number(jobIdRaw);

      if (!Number.isInteger(jobId)) {
        return res.status(400).json({ error: "Invalid job_id" });
      }

      const result = await db.query(
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

    const result = await db.query(
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
  const db = (req as any).db;

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

    const result = await db.query(
      `
      INSERT INTO assignments
      (job_id, employee_id, start_time, end_time, company_id)
      VALUES
      ($1, $2, $3, $4, current_setting('app.current_company_id')::int)
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
  const db = (req as any).db;

  try {
    const assignmentId = Number(req.params.id);
    const { employee_id, start_time, end_time, completed } = req.body;

    if (!Number.isInteger(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment id" });
    }

    const result = await db.query(
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

    await recalcJobStatus(db, assignment.job_id);

    if (assignment.completed === true) {
      await generateLabourForAssignment(db, assignment.id);
    }

    res.json(assignment);
  } catch (err) {
    console.error("assignments.update", err);
    res.status(500).json({ error: "Assignment update failed" });
  }
};


/* ===============================
   COMPLETE ASSIGNMENTS (BULK)
================================ */
export const completeAssignments = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const { assignmentIds } = req.body;

    if (
      !Array.isArray(assignmentIds) ||
      assignmentIds.length === 0 ||
      !assignmentIds.every((id) => Number.isInteger(Number(id)))
    ) {
      return res.status(400).json({ error: "Invalid assignmentIds" });
    }

    const result = await db.query(
      `
      UPDATE assignments
      SET completed = TRUE
      WHERE id = ANY($1::int[])
      RETURNING job_id, id
      `,
      [assignmentIds]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "No assignments updated" });
    }

   const jobIds: number[] = [
  ...new Set(
    (result.rows as any[]).map(r => Number(r.job_id))
  )
];

    for (const row of result.rows as any[]) {
  await generateLabourForAssignment(db, Number(row.id));
}

    for (const jobId of jobIds) {
      await recalcJobStatus(db, jobId);
    }

    res.json({ updated: result.rows.length });
  } catch (err) {
    console.error("assignments.complete", err);
    res.status(500).json({ error: "Assignment completion failed" });
  }
};


/* ===============================
   REOPEN ASSIGNMENTS (BULK)
================================ */
export const reopenAssignments = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const { assignmentIds } = req.body;

    if (
      !Array.isArray(assignmentIds) ||
      assignmentIds.length === 0 ||
      !assignmentIds.every((id) => Number.isInteger(Number(id)))
    ) {
      return res.status(400).json({ error: "Invalid assignmentIds" });
    }

    const result = await db.query(
      `
      UPDATE assignments
      SET completed = FALSE
      WHERE id = ANY($1::int[])
      RETURNING job_id
      `,
      [assignmentIds]
    );

    const jobIds = [
  ...new Set(
    (result.rows as any[]).map(r => Number(r.job_id))
  )
];

    for (const jobId of jobIds) {
      await recalcJobStatus(db, jobId);
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
  const db = (req as any).db;

  try {
    const assignmentId = Number(req.params.id);

    const result = await db.query(
      `DELETE FROM assignments WHERE id = $1 RETURNING job_id`,
      [assignmentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const jobId = Number(result.rows[0].job_id);
    await recalcJobStatus(db, jobId);

    res.status(204).send();
  } catch (err) {
    console.error("assignments.delete", err);
    res.status(500).json({ error: "Assignment delete failed" });
  }
};