// server/controllers/assignments.controller.ts
// Created by Clevermode © 2026
// 🔐 RLS SAFE VERSION

import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import {
  logJobActivity,
  resolveActorName,
  resolveEmployeeName,
} from "../lib/activity";

const formatRange = (startValue: unknown, endValue: unknown) => {
  const startDate = new Date(String(startValue ?? ""));
  const endDate = new Date(String(endValue ?? ""));

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "";
  }

  const toLabel = (date: Date) =>
    date.toISOString().replace("T", " ").slice(0, 16);

  return `${toLabel(startDate)} - ${toLabel(endDate)}`;
};

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
 source,
 company_id
)
SELECT
 a.job_id,
 a.id,
 a.employee_id,
 a.start_time,
 a.end_time,
 $2,
 0,
 $2,
 $3,
 $4,
 'Auto-generated from completed assignment',
 'auto',
 j.company_id
FROM assignments a
JOIN jobs j ON j.id = a.job_id
WHERE a.id = $1
`,
[
 assignmentId,
 workedHours,
 rate,
 total
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
          a.id,
          a.job_id,
          a.employee_id,
          a.start_time,
          a.end_time,
          a.completed
        FROM assignments a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.job_id = $1 AND (
          current_setting('app.god_mode') = 'true'
          OR j.company_id = current_setting('app.current_company_id')::bigint
        )
        ORDER BY a.start_time ASC
        `,
        [jobId]
      );

      return res.json(result.rows);
    }

    const result = await db.query(
      `
      SELECT
        a.id,
        a.job_id,
        a.employee_id,
        a.start_time,
        a.end_time,
        a.completed
      FROM assignments a
      JOIN jobs j ON j.id = a.job_id
      WHERE CASE
        WHEN current_setting('app.god_mode') = 'true' THEN TRUE
        ELSE j.company_id = current_setting('app.current_company_id')::bigint
      END
      ORDER BY a.start_time ASC
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

    const {
      job_id,
      employee_id,
      start_time,
      end_time
    } = req.body;

    console.log("CREATE ASSIGNMENT:", req.body);

    const result = await db.query(

`
INSERT INTO assignments
(
  job_id,
  employee_id,
  start_time,
  end_time,
  company_id
)
SELECT
  $1,
  $2,
  $3::timestamp,
  $4::timestamp,
  company_id
FROM jobs
WHERE id = $1 AND (
  current_setting('app.god_mode') = 'true'
  OR company_id = current_setting('app.current_company_id')::bigint
)
RETURNING *
`,

[
 job_id,
 employee_id,
 start_time,
 end_time
]

);

    if (!result.rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    const actorName = await resolveActorName(
      db,
      req as AuthRequest
    );
    const employeeName = await resolveEmployeeName(
      db,
      Number(employee_id)
    );

    const rangeLabel = formatRange(start_time, end_time);
    const title = rangeLabel
      ? `Scheduled ${employeeName} (${rangeLabel})`
      : `Scheduled ${employeeName}`;

    await logJobActivity(
      db,
      Number(job_id),
      "assignment_scheduled",
      title,
      actorName
    );

    res.status(201).json(result.rows[0]);

  }
  catch (err: any) {

    console.error(
      "ASSIGNMENT CREATE ERROR FULL:",
      err
    );

    res.status(500).json({
      error: err.message
    });

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

    const existing = await db.query(
      `
      SELECT
        a.start_time,
        a.end_time,
        a.employee_id,
        a.job_id
      FROM assignments a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      `,
      [assignmentId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const previous = existing.rows[0];
    const previousEmployeeId = Number(previous.employee_id);
    const previousStart = previous.start_time;
    const previousEnd = previous.end_time;
    const jobId = Number(previous.job_id);

    const result = await db.query(
      `
      UPDATE assignments
      SET
        employee_id = COALESCE($1, employee_id),
        start_time  = COALESCE($2, start_time),
        end_time    = COALESCE($3, end_time),
        completed   = COALESCE($4, completed)
      WHERE id = $5 AND job_id IN (
        SELECT id FROM jobs WHERE (
          current_setting('app.god_mode') = 'true'
          OR company_id = current_setting('app.current_company_id')::bigint
        )
      )
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

    const actorName = await resolveActorName(
      db,
      req as AuthRequest
    );

    const newEmployeeId = Number(assignment.employee_id);
    const employeeChanged =
      Number.isInteger(newEmployeeId) && newEmployeeId !== previousEmployeeId;

    if (employeeChanged) {
      const fromName = await resolveEmployeeName(db, previousEmployeeId);
      const toName = await resolveEmployeeName(db, newEmployeeId);

      await logJobActivity(
        db,
        jobId,
        "assignment_reassigned",
        `Reassigned from ${fromName} to ${toName}`,
        actorName
      );
    }

    const startProvided =
      Object.prototype.hasOwnProperty.call(req.body, "start_time");
    const endProvided =
      Object.prototype.hasOwnProperty.call(req.body, "end_time");

    if (startProvided || endProvided) {
      const newStart = startProvided ? start_time : previousStart;
      const newEnd = endProvided ? end_time : previousEnd;

      const oldRange = formatRange(previousStart, previousEnd);
      const newRange = formatRange(newStart, newEnd);

      if (oldRange && newRange && oldRange !== newRange) {
        const employeeName = await resolveEmployeeName(
          db,
          newEmployeeId
        );

        await logJobActivity(
          db,
          jobId,
          "assignment_rescheduled",
          `Rescheduled ${employeeName} (${oldRange} → ${newRange})`,
          actorName
        );
      }
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
      AND job_id IN (
        SELECT id FROM jobs WHERE (
          current_setting('app.god_mode') = 'true'
          OR company_id = current_setting('app.current_company_id')::bigint
        )
      )
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

    // ✅ 1. Reopen assignments
    const result = await db.query(
      `
      UPDATE assignments
      SET completed = FALSE
      WHERE id = ANY($1::int[])
      AND job_id IN (
        SELECT id FROM jobs WHERE (
          current_setting('app.god_mode') = 'true'
          OR company_id = current_setting('app.current_company_id')::bigint
        )
      )
      RETURNING job_id
      `,
      [assignmentIds]
    );

    // ✅ 2. DELETE auto-generated labour entries
    await db.query(
      `
      DELETE FROM labour_entries
      WHERE assignment_id = ANY($1::int[])
      AND source = 'auto'
      `,
      [assignmentIds]
    );

    // ✅ 3. Recalculate job status
    const jobIds = [
      ...new Set((result.rows as any[]).map((r) => Number(r.job_id))),
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
      `DELETE FROM assignments 
       WHERE id = $1 
       AND job_id IN (
         SELECT id FROM jobs WHERE (
           current_setting('app.god_mode') = 'true'
           OR company_id = current_setting('app.current_company_id')::bigint
         )
       )
       RETURNING job_id`,
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