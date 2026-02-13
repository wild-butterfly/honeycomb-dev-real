// Created by Honeycomb © 2025
// 🔐 RLS SAFE VERSION

import { Request, Response } from "express";

/* =========================================================
   GET LABOUR ENTRIES (by job)
========================================================= */

export const getLabourEntries = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const jobId = Number(req.params.jobId);

    if (!Number.isInteger(jobId)) {
      return res.status(400).json({ error: "Invalid jobId" });
    }

    const result = await db.query(
      `
      SELECT 
        le.id,
        e.name as employee_name,
        le.chargeable_hours,
        le.total,
        le.rate,
        le.worked_hours,
        le.uncharged_hours,
        le.created_at
      FROM labour_entries le
      JOIN employees e ON e.id = le.employee_id
      WHERE le.job_id = $1
      ORDER BY le.created_at DESC
      `,
      [jobId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error("LABOUR FETCH ERROR:", err);
    res.status(500).json({ error: "Labour fetch failed" });
  }
};

/* =========================================================
   ADD LABOUR ENTRY
========================================================= */

export const addLabourEntry = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const jobId = Number(req.params.jobId);

    const {
      assignment_id,
      employee_id,
      start_time,
      end_time,
      worked_hours,
      uncharged_hours,
      chargeable_hours,
      rate,
      total,
      description,
    } = req.body;

    if (!Number.isInteger(jobId) || !Number.isInteger(Number(employee_id))) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    /*
      RLS guarantees:
      - Job başka company ise SELECT 0 rows
      - Employee başka company ise INSERT fail
      - labour_entries company_id otomatik current_setting'ten gelir
    */

    // 1️⃣ Job exists? (RLS filtered)
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (!jobCheck.rowCount) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Insert
    const result = await db.query(
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
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        current_setting('app.current_company_id')::int
      )
      RETURNING *
      `,
      [
        jobId,
        assignment_id ?? null,
        employee_id,
        start_time ?? null,
        worked_hours ?? 0,
        uncharged_hours ?? 0,
        chargeable_hours ?? 0,
        rate ?? 0,
        total ?? 0,
        description ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("LABOUR INSERT ERROR:", err);
    res.status(500).json({ error: "Labour add failed" });
  }
};

/* =========================================================
   DELETE LABOUR ENTRY
========================================================= */

export const deleteLabourEntry = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid labour id" });
    }

    const result = await db.query(
      `DELETE FROM labour_entries WHERE id = $1 RETURNING id`,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Labour entry not found" });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("LABOUR DELETE ERROR:", err);
    res.status(500).json({ error: "Labour delete failed" });
  }
};