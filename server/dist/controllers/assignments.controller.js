"use strict";
// server/controllers/assignments.controller.ts
// Created by Clevermode © 2026
// 🔐 RLS SAFE VERSION
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAssignment = exports.reopenAssignments = exports.completeAssignments = exports.updateAssignment = exports.createAssignment = exports.getAllAssignments = void 0;
const activity_1 = require("../lib/activity");
const formatRange = (startValue, endValue) => {
    const toLabel = (value) => {
        const raw = String(value ?? "");
        const match = raw.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
        if (!match)
            return "";
        return `${match[1]} ${match[2]}`;
    };
    const startLabel = toLabel(startValue);
    const endLabel = toLabel(endValue);
    if (!startLabel || !endLabel)
        return "";
    return `${startLabel} - ${endLabel}`;
};
/* ===============================
   INTERNAL: Recalculate job status
================================ */
const recalcJobStatus = async (db, jobId) => {
    const result = await db.query(`
    SELECT COUNT(*) FILTER (WHERE completed = false) AS incomplete
    FROM assignments
    WHERE job_id = $1
    `, [jobId]);
    const incompleteCount = Number(result.rows[0]?.incomplete ?? 0);
    await db.query(`
    UPDATE jobs
    SET status = $2
    WHERE id = $1
    `, [jobId, incompleteCount === 0 ? "completed" : "active"]);
};
/* ===============================
   INTERNAL: Auto-generate labour
================================ */
const generateLabourForAssignment = async (db, assignmentId) => {
    const existsCheck = await db.query(`SELECT id FROM labour_entries WHERE assignment_id = $1`, [assignmentId]);
    if (existsCheck.rowCount)
        return;
    const result = await db.query(`
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
    `, [assignmentId]);
    if (!result.rowCount)
        return;
    const a = result.rows[0];
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);
    let diff = end.getTime() - start.getTime();
    if (diff <= 0)
        diff += 24 * 60 * 60 * 1000;
    const workedHours = Math.round((diff / 36e5) * 4) / 4;
    const rate = Number(a.rate ?? 0);
    const total = workedHours * rate;
    await db.query(`
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
`, [
        assignmentId,
        workedHours,
        rate,
        total
    ]);
};
/* ===============================
   GET ASSIGNMENTS
================================ */
const getAllAssignments = async (req, res) => {
    const db = req.db;
    try {
        const jobIdRaw = req.query.job_id;
        if (jobIdRaw !== undefined) {
            const jobId = Number(jobIdRaw);
            if (!Number.isInteger(jobId)) {
                return res.status(400).json({ error: "Invalid job_id" });
            }
            const result = await db.query(`
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
        `, [jobId]);
            return res.json(result.rows);
        }
        const result = await db.query(`
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
      `);
        res.json(result.rows);
    }
    catch (err) {
        console.error("assignments.getAll", err);
        res.status(500).json({ error: "Assignments load failed" });
    }
};
exports.getAllAssignments = getAllAssignments;
/* ===============================
   CREATE ASSIGNMENT
================================ */
const createAssignment = async (req, res) => {
    const db = req.db;
    try {
        const { job_id, employee_id, start_time, end_time } = req.body;
        console.log("CREATE ASSIGNMENT:", req.body);
        const existingAssignments = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM assignments a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.job_id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      `, [job_id]);
        const hadAssignments = Number(existingAssignments.rows[0]?.count ?? 0) > 0;
        const result = await db.query(`
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
`, [
            job_id,
            employee_id,
            start_time,
            end_time
        ]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Job not found" });
        }
        if (hadAssignments) {
            const actorName = await (0, activity_1.resolveActorName)(db, req);
            const employeeName = await (0, activity_1.resolveEmployeeName)(db, Number(employee_id));
            const rangeLabel = formatRange(start_time, end_time);
            const title = rangeLabel
                ? `Scheduled ${employeeName} (${rangeLabel})`
                : `Scheduled ${employeeName}`;
            await (0, activity_1.logJobActivity)(db, Number(job_id), "assignment_scheduled", title, actorName);
        }
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("ASSIGNMENT CREATE ERROR FULL:", err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.createAssignment = createAssignment;
/* ===============================
   UPDATE ASSIGNMENT
================================ */
const updateAssignment = async (req, res) => {
    const db = req.db;
    try {
        const assignmentId = Number(req.params.id);
        const { employee_id, start_time, end_time, completed } = req.body;
        if (!Number.isInteger(assignmentId)) {
            return res.status(400).json({ error: "Invalid assignment id" });
        }
        const existing = await db.query(`
      SELECT
        to_char(a.start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time,
        to_char(a.end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time,
        a.employee_id,
        a.job_id
      FROM assignments a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      `, [assignmentId]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        const previous = existing.rows[0];
        const previousEmployeeId = Number(previous.employee_id);
        const previousStart = previous.start_time;
        const previousEnd = previous.end_time;
        const jobId = Number(previous.job_id);
        const result = await db.query(`
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
      `, [employee_id, start_time, end_time, completed, assignmentId]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        const assignment = result.rows[0];
        await recalcJobStatus(db, assignment.job_id);
        if (assignment.completed === true) {
            await generateLabourForAssignment(db, assignment.id);
        }
        const actorName = await (0, activity_1.resolveActorName)(db, req);
        const newEmployeeId = Number(assignment.employee_id);
        const employeeChanged = Number.isInteger(newEmployeeId) && newEmployeeId !== previousEmployeeId;
        if (employeeChanged) {
            const fromName = await (0, activity_1.resolveEmployeeName)(db, previousEmployeeId);
            const toName = await (0, activity_1.resolveEmployeeName)(db, newEmployeeId);
            await (0, activity_1.logJobActivity)(db, jobId, "assignment_reassigned", `Reassigned from ${fromName} to ${toName}`, actorName);
        }
        const startProvided = Object.prototype.hasOwnProperty.call(req.body, "start_time");
        const endProvided = Object.prototype.hasOwnProperty.call(req.body, "end_time");
        if (startProvided || endProvided) {
            const newStart = startProvided ? start_time : previousStart;
            const newEnd = endProvided ? end_time : previousEnd;
            const oldRange = formatRange(previousStart, previousEnd);
            const newRange = formatRange(newStart, newEnd);
            if (oldRange && newRange && oldRange !== newRange) {
                const scheduleHistory = await db.query(`
          SELECT 1
          FROM job_activity
          WHERE job_id = $1
            AND type IN ('assignment_scheduled', 'assignment_rescheduled')
            AND (
              current_setting('app.god_mode') = 'true'
              OR company_id = current_setting('app.current_company_id')::bigint
            )
          LIMIT 1
          `, [jobId]);
                const hasScheduleHistory = scheduleHistory.rowCount > 0;
                const employeeName = await (0, activity_1.resolveEmployeeName)(db, newEmployeeId);
                if (!hasScheduleHistory) {
                    await (0, activity_1.logJobActivity)(db, jobId, "assignment_scheduled", `Scheduled ${employeeName} (${newRange})`, actorName);
                }
                else {
                    await (0, activity_1.logJobActivity)(db, jobId, "assignment_rescheduled", `Rescheduled ${employeeName} (${oldRange} → ${newRange})`, actorName);
                }
            }
        }
        res.json(assignment);
    }
    catch (err) {
        console.error("assignments.update", err);
        res.status(500).json({ error: "Assignment update failed" });
    }
};
exports.updateAssignment = updateAssignment;
/* ===============================
   COMPLETE ASSIGNMENTS (BULK)
================================ */
const completeAssignments = async (req, res) => {
    const db = req.db;
    try {
        const { assignmentIds } = req.body;
        if (!Array.isArray(assignmentIds) ||
            assignmentIds.length === 0 ||
            !assignmentIds.every((id) => Number.isInteger(Number(id)))) {
            return res.status(400).json({ error: "Invalid assignmentIds" });
        }
        const result = await db.query(`
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
      `, [assignmentIds]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "No assignments updated" });
        }
        const jobIds = [
            ...new Set(result.rows.map(r => Number(r.job_id)))
        ];
        for (const row of result.rows) {
            await generateLabourForAssignment(db, Number(row.id));
        }
        for (const jobId of jobIds) {
            await recalcJobStatus(db, jobId);
        }
        res.json({ updated: result.rows.length });
    }
    catch (err) {
        console.error("assignments.complete", err);
        res.status(500).json({ error: "Assignment completion failed" });
    }
};
exports.completeAssignments = completeAssignments;
/* ===============================
   REOPEN ASSIGNMENTS (BULK)
================================ */
const reopenAssignments = async (req, res) => {
    const db = req.db;
    try {
        const { assignmentIds } = req.body;
        if (!Array.isArray(assignmentIds) ||
            assignmentIds.length === 0 ||
            !assignmentIds.every((id) => Number.isInteger(Number(id)))) {
            return res.status(400).json({ error: "Invalid assignmentIds" });
        }
        // ✅ 1. Reopen assignments
        const result = await db.query(`
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
      `, [assignmentIds]);
        // ✅ 2. DELETE auto-generated labour entries
        await db.query(`
      DELETE FROM labour_entries
      WHERE assignment_id = ANY($1::int[])
      AND source = 'auto'
      `, [assignmentIds]);
        // ✅ 3. Recalculate job status
        const jobIds = [
            ...new Set(result.rows.map((r) => Number(r.job_id))),
        ];
        for (const jobId of jobIds) {
            await recalcJobStatus(db, jobId);
        }
        res.json({ updated: result.rows.length });
    }
    catch (err) {
        console.error("assignments.reopen", err);
        res.status(500).json({ error: "Assignment reopen failed" });
    }
};
exports.reopenAssignments = reopenAssignments;
/* ===============================
   DELETE ASSIGNMENT
================================ */
const deleteAssignment = async (req, res) => {
    const db = req.db;
    try {
        const assignmentId = Number(req.params.id);
        const result = await db.query(`DELETE FROM assignments 
       WHERE id = $1 
       AND job_id IN (
         SELECT id FROM jobs WHERE (
           current_setting('app.god_mode') = 'true'
           OR company_id = current_setting('app.current_company_id')::bigint
         )
       )
       RETURNING job_id`, [assignmentId]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        const jobId = Number(result.rows[0].job_id);
        await recalcJobStatus(db, jobId);
        res.status(204).send();
    }
    catch (err) {
        console.error("assignments.delete", err);
        res.status(500).json({ error: "Assignment delete failed" });
    }
};
exports.deleteAssignment = deleteAssignment;
