// Created by Honeycomb © 2025

import { Request, Response } from "express";
import { pool } from "../db";

/* =========================================================
   GET LABOUR ENTRIES (by job)
========================================================= */

export const getLabourEntries = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
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
  try {
    const { jobId } = req.params;

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

    if (!employee_id) {
      return res.status(400).json({ error: "Employee required" });
    }

    const result = await pool.query(
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
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        jobId,
        assignment_id ?? null,
        employee_id,
        start_time ?? null,
        end_time ?? null,
        worked_hours ?? 0,
        uncharged_hours ?? 0,
        chargeable_hours ?? 0,
        rate ?? 0,
        total ?? 0,
        description ?? null,
      ]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("LABOUR INSERT ERROR:", err);
    res.status(500).json({ error: "Labour add failed" });
  }
};

/* =========================================================
   DELETE LABOUR ENTRY
========================================================= */

export const deleteLabourEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM labour_entries WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("LABOUR DELETE ERROR:", err);
    res.status(500).json({ error: "Labour delete failed" });
  }
};