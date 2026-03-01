// src/controllers/jobFinancials.controller.ts

import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";

/**
 * GET job financials by job ID
 */
export const getJobFinancials = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { jobId } = req.params;

  try {
    const result = await db.query(
      `
      SELECT
        jf.*
      FROM job_financials jf
      INNER JOIN jobs j ON j.id = jf.job_id
      WHERE jf.job_id = $1
        AND (
          current_setting('app.god_mode') = 'true'
          OR j.company_id = current_setting('app.current_company_id')::bigint
        )
      `,
      [jobId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Job financials not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("getJobFinancials error:", err);
    return res.status(500).json({ error: "Failed to fetch job financials" });
  }
};

/**
 * CREATE job financials record
 */
export const createJobFinancials = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { jobId } = req.params;
  const {
    labour_cost = 0,
    material_cost = 0,
    other_cost = 0,
    revenue = 0,
  } = req.body;

  try {
    // Verify job exists and user has access
    const jobCheck = await db.query(
      `
      SELECT id FROM jobs
      WHERE id = $1
        AND (
          current_setting('app.god_mode') = 'true'
          OR company_id = current_setting('app.current_company_id')::bigint
        )
      `,
      [jobId]
    );

    if (!jobCheck.rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Insert financials (trigger will calculate totals)
    const result = await db.query(
      `
      INSERT INTO job_financials
      (job_id, labour_cost, material_cost, other_cost, revenue)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [jobId, labour_cost, material_cost, other_cost, revenue]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createJobFinancials error:", err);
    return res.status(500).json({ error: "Failed to create job financials" });
  }
};

/**
 * UPDATE job financials
 */
export const updateJobFinancials = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { jobId } = req.params;
  const {
    labour_cost,
    material_cost,
    other_cost,
    revenue,
  } = req.body;

  try {
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (labour_cost !== undefined) {
      fields.push(`labour_cost = $${paramIndex++}`);
      values.push(labour_cost);
    }
    if (material_cost !== undefined) {
      fields.push(`material_cost = $${paramIndex++}`);
      values.push(material_cost);
    }
    if (other_cost !== undefined) {
      fields.push(`other_cost = $${paramIndex++}`);
      values.push(other_cost);
    }
    if (revenue !== undefined) {
      fields.push(`revenue = $${paramIndex++}`);
      values.push(revenue);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Add job ID and company check
    values.push(jobId);
    const jobParam = paramIndex;

    const result = await db.query(
      `
      UPDATE job_financials
      SET ${fields.join(", ")}
      WHERE job_id = $${jobParam}
        AND job_id IN (
          SELECT id FROM jobs
          WHERE company_id = current_setting('app.current_company_id')::bigint
            OR current_setting('app.god_mode') = 'true'
        )
      RETURNING *
      `,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Job financials not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("updateJobFinancials error:", err);
    return res.status(500).json({ error: "Failed to update job financials" });
  }
};

/**
 * GET gauge data: all jobs grouped by phase with financial summaries
 * Used for dashboard gauges
 */
export const getGaugeData = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(`
      SELECT
        j.phase,
        COUNT(DISTINCT j.id) as job_count,
        COALESCE(SUM(jf.revenue), 0) as total_value,
        json_agg(
          json_build_object(
            'status', j.status,
            'count', COUNT(*)
          )
        ) FILTER (WHERE j.status IS NOT NULL) as status_breakdown
      FROM jobs j
      LEFT JOIN job_financials jf ON jf.job_id = j.id
      WHERE
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      GROUP BY j.phase
      ORDER BY
        CASE
          WHEN j.phase = 'new' THEN 1
          WHEN j.phase = 'quoting' THEN 2
          WHEN j.phase = 'scheduled' THEN 3
          WHEN j.phase = 'in_progress' THEN 4
          WHEN j.phase = 'completed' THEN 5
          WHEN j.phase = 'invoicing' THEN 6
          WHEN j.phase = 'paid' THEN 7
          ELSE 8
        END
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error("getGaugeData error:", err);
    return res.status(500).json({ error: "Failed to fetch gauge data" });
  }
};
