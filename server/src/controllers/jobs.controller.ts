import { Request, Response } from "express";
import { pool } from "../db";

/* ===============================
   GET ALL JOBS + ASSIGNMENTS
================================ */
export const getAll = async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT
      j.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'employee_id', a.employee_id,
            'start_time', to_char(a.start_time, 'YYYY-MM-DD HH24:MI:SS'),
            'end_time',   to_char(a.end_time,   'YYYY-MM-DD HH24:MI:SS'),
            'completed', a.completed
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
      ) AS assignments
    FROM jobs j
    LEFT JOIN assignments a ON a.job_id = j.id
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `);

  res.json(result.rows);
};

/* ===============================
   GET ONE JOB
================================ */
export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        j.*,

        /* ================= ASSIGNMENTS (SCHEDULED) ================= */
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', a.id,
              'employee_id', a.employee_id,
              'start_time', to_char(a.start_time, 'YYYY-MM-DD"T"HH24:MI:SS'),
              'end_time',   to_char(a.end_time,   'YYYY-MM-DD"T"HH24:MI:SS'),
              'completed', a.completed
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS assignments,

        /* ================= ASSIGNEES (NO SCHEDULE) ================= */
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'employee_id', e.id,
              'name', e.name
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS assignees

      FROM jobs j
      LEFT JOIN assignments a ON a.job_id = j.id
      LEFT JOIN job_assignees ja ON ja.job_id = j.id
      LEFT JOIN employees e ON e.id = ja.employee_id
      WHERE j.id = $1
      GROUP BY j.id
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET job error", err);
    res.status(500).json({ error: "Job load failed" });
  }
};

/* ===============================
   CREATE JOB
================================ */
export const create = async (req: Request, res: Response) => {
  try {
    const { title, company_id, status = "active" } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: "company_id is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO jobs (title, company_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [title, company_id, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CREATE job error", err);
    res.status(500).json({ error: "Job create failed" });
  }
};

/* ===============================
   UPDATE JOB
================================ */
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      title,
      client,
      address,
      notes,
      status,
      color,
      contact_name,
      contact_email,
      contact_phone,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE jobs
SET
  title = COALESCE($1, title),
  client = COALESCE($2, client),
  address = COALESCE($3, address),
  notes = COALESCE($4, notes),
  status = COALESCE($5, status),
  color = COALESCE($6, color),
  contact_name = COALESCE($7, contact_name),
  contact_email = COALESCE($8, contact_email),
  contact_phone = COALESCE($9, contact_phone)
WHERE id = $10
RETURNING *;
      `,
      [
        title,
        client,
        address,
        notes,
        status,
        color,
        contact_name,
        contact_email,
        contact_phone,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE job error", err);
    res.status(500).json({ error: "Job update failed" });
  }
};

/* ===============================
   DELETE JOB
================================ */
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM assignments WHERE job_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM jobs WHERE id = $1`, [id]);

    if (!result.rowCount) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE job error", err);
    res.status(500).json({ error: "Job delete failed" });
  }
};

/* ===============================
   UNASSIGN EMPLOYEE FROM JOB
   PUT /jobs/:id/unassign
================================ */
export const unassignEmployee = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    const { employee_id } = req.body;

    if (
      !Number.isInteger(jobId) ||
      !Number.isInteger(Number(employee_id))
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await pool.query(
      `
      DELETE FROM job_assignees
      WHERE job_id = $1 AND employee_id = $2
      `,
      [jobId, employee_id]
    );

    res.status(204).send();
  } catch (err) {
    console.error("JOB UNASSIGN error", err);
    res.status(500).json({ error: "Job unassign failed" });
  }
};

/* ===============================
   GET JOB LABOUR
================================ */
export const getLabour = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        l.id,
        e.name AS employee_name,
        l.chargeable_hours,
        l.total
      FROM labour_entries l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.job_id = $1
      ORDER BY l.created_at DESC
      `,
      [id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET job labour error", err);
    res.status(500).json({ error: "Labour load failed" });
  }
};

/* ===============================
   ADD JOB LABOUR
================================ */
export const addLabour = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      employee_id,
      assignment_start,
      assignment_end,
      worked_hours,
      uncharged_hours,
      chargeable_hours,
      rate,
      total,
      description,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO labour_entries
        (job_id, employee_id,
         assignment_start, assignment_end,
         worked_hours, uncharged_hours,
         chargeable_hours, rate, total, description)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        id,
        employee_id,
        assignment_start,
        assignment_end,
        worked_hours,
        uncharged_hours,
        chargeable_hours,
        rate,
        total,
        description,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("ADD job labour error", err);
    res.status(500).json({ error: "Labour add failed" });
  }
};

/* ===============================
   ASSIGN EMPLOYEE TO JOB (NO SCHEDULE)
   PUT /jobs/:id/assign
================================ */
export const assignEmployee = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    const { employee_id } = req.body;

    if (
      !Number.isInteger(jobId) ||
      !Number.isInteger(Number(employee_id))
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await pool.query(
      `
      INSERT INTO job_assignees (job_id, employee_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [jobId, employee_id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("JOB ASSIGN error", err);
    res.status(500).json({ error: "Job assign failed" });
  }
};