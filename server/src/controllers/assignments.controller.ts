// server/controllers/assignments.controller.ts
// Created by Clevermode © 2026

import { Request, Response } from "express";
import { pool } from "../db";

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
    const { employee_id, start_time, end_time } = req.body;

    if (!Number.isInteger(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment id" });
    }

    const result = await pool.query(
      `
      UPDATE assignments
      SET
        employee_id = $1,
        start_time  = $2,
        end_time    = $3
      WHERE id = $4
      RETURNING *
      `,
      [employee_id, start_time, end_time, assignmentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("assignments.update", err);
    res.status(500).json({ error: "Assignment update failed" });
  }
};

/* ===============================
   DELETE ASSIGNMENT
================================ */
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const assignmentId = Number(req.params.id);

    if (!Number.isInteger(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment id" });
    }

    const result = await pool.query(
      `DELETE FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("assignments.delete", err);
    res.status(500).json({ error: "Assignment delete failed" });
  }
};