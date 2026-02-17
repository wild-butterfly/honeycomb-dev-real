//jobs.controller.ts
import { Request, Response } from "express";

/* ===============================
   GET ALL JOBS + ASSIGNMENTS
================================ */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  const result = await db.query(`
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
  const db = (req as any).db;

  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        j.*,
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
  const db = (req as any).db;

  try {
    const { title, status = "active" } = req.body;

    const result = await db.query(
      `
      INSERT INTO jobs (title, status, company_id)
      VALUES ($1, $2, current_setting('app.current_company_id')::int)
      RETURNING *
      `,
      [title, status]
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
    const db = (req as any).db;   // 🔐 request-scoped connection

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

    const result = await db.query(
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
    const db = (req as any).db;   // 🔐 request-scoped connection

    const { id } = req.params;

    await db.query(
      `DELETE FROM assignments WHERE job_id = $1`,
      [id]
    );

    const result = await db.query(
      `DELETE FROM jobs WHERE id = $1`,
      [id]
    );

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
    const db = (req as any).db;   // 🔐 request-scoped db

    const jobId = Number(req.params.id);
    const { employee_id } = req.body;

    if (
      !Number.isInteger(jobId) ||
      !Number.isInteger(Number(employee_id))
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await db.query(
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
    const db = (req as any).db;   // 🔐 request-scoped db

    const { id } = req.params;
    const { assignment_id } = req.query;

    let query = `
      SELECT
        l.id,
        l.assignment_id,
        l.employee_id,
        e.name AS employee_name,

        l.start_time,
        l.end_time,
        l.created_at,

        l.worked_hours::float        AS worked_hours,
        l.uncharged_hours::float     AS uncharged_hours,
        l.chargeable_hours::float    AS chargeable_hours,
        l.rate::float                AS rate,
        l.total::float               AS total,

        l.notes
      FROM labour_entries l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.job_id = $1
    `;

    const values: any[] = [id];

    if (assignment_id) {
      query += ` AND l.assignment_id = $2`;
      values.push(assignment_id);
    }

    query += ` ORDER BY l.created_at DESC`;

    const result = await db.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error("GET job labour error", err);
    res.status(500).json({ error: "Labour load failed" });
  }
};

/* ===============================
   ADD JOB LABOUR (RLS SAFE)
================================ */
export const addLabour = async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;   // 🔐 request-scoped transaction

    const jobId = Number(req.params.id);

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

    /*
      RLS sayesinde:
      - Job başka company ise SELECT 0 rows döner
      - Employee başka company ise INSERT fail olur
      - Assignment başka company ise SELECT 0 rows döner
    */

    // 1️⃣ Job exists? (RLS filtered)
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (!jobCheck.rowCount) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Optional assignment validation (RLS filtered)
    if (assignment_id) {
      const assignmentCheck = await db.query(
        `SELECT id FROM assignments WHERE id = $1 AND job_id = $2`,
        [assignment_id, jobId]
      );

      if (!assignmentCheck.rowCount) {
        return res.status(400).json({ error: "Invalid assignment for this job" });
      }
    }

    // 3️⃣ Insert (company_id otomatik RLS scope'tan gelir)
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
              current_setting('app.current_company_id')::int)
      RETURNING
        id,
        assignment_id,
        employee_id,
        start_time,
        end_time,
        worked_hours::float     AS worked_hours,
        uncharged_hours::float  AS uncharged_hours,
        chargeable_hours::float AS chargeable_hours,
        rate::float             AS rate,
        total::float            AS total,
        notes
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

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("ADD job labour error", err);
    res.status(500).json({ error: "Labour add failed" });
  }
};

/* ===============================
   ASSIGN EMPLOYEE TO JOB (RLS SAFE)
   PUT /jobs/:id/assign
================================ */
export const assignEmployee = async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;   // 🔐 request-scoped db

    const jobId = Number(req.params.id);
    const { employee_id } = req.body;

    if (
      !Number.isInteger(jobId) ||
      !Number.isInteger(Number(employee_id))
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 1️⃣ Job exists? (RLS filtered)
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (!jobCheck.rowCount) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Insert — company_id DB context'ten gelir
    await db.query(
      `
      INSERT INTO job_assignees (job_id, employee_id, company_id)
      VALUES ($1, $2, current_setting('app.current_company_id')::int)
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

/* ===============================
   UPDATE LABOUR ENTRY
================================ */
export const updateLabour = async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;  // 🔐 request-scoped transaction

    const { labourId } = req.params;

    const result = await db.query(
      `
      UPDATE labour_entries
      SET
        start_time = $1,
        end_time = $2,
        worked_hours = $3,
        uncharged_hours = $4,
        chargeable_hours = $5,
        rate = $6,
        total = $7,
        notes = $8
      WHERE id = $9
      RETURNING *
      `,
      [
        req.body.start_time,
        req.body.end_time,
        req.body.worked_hours,
        req.body.uncharged_hours,
        req.body.chargeable_hours,
        req.body.rate,
        req.body.total,
        req.body.description ?? null,
        labourId,
      ]
    );

    /*
      RLS sayesinde:
      - Başka company'ye ait labour update edilemez
      - SELECT/UPDATE otomatik company filter'lıdır
    */

    if (!result.rowCount) {
      return res.status(404).json({ error: "Labour entry not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("UPDATE labour error", err);
    res.status(500).json({ error: "Update labour failed" });
  }
};
/* ===============================
   DELETE LABOUR ENTRY
================================ */
export const deleteLabour = async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;  // 🔐 request-scoped transaction

    const { labourId } = req.params;

    const result = await db.query(
      `DELETE FROM labour_entries WHERE id = $1 RETURNING id`,
      [labourId]
    );



    if (!result.rowCount) {
      return res.status(404).json({ error: "Labour entry not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE labour error", err);
    res.status(500).json({ error: "Delete labour failed" });
  }
};

/* ===============================
   GET JOB ACTIVITY
================================ */
/* ===============================
   GET JOB ACTIVITY ⭐ FINAL ENTERPRISE
================================ */
export const getActivity = async (req: Request, res: Response) => {

  try {

    const db = (req as any).db;
    const { id } = req.params;

    const result = await db.query(`

      SELECT * FROM (

        /* LABOUR ADDED */

        SELECT
          'labour_added' AS type,
          'Labour added' AS title,
          e.name AS user_name,
          l.created_at AS date
        FROM labour_entries l
        JOIN employees e ON e.id = l.employee_id
        WHERE l.job_id = $1


        UNION ALL


        /* STAFF ASSIGNED */

        SELECT
          'assigned' AS type,
          'Staff assigned' AS title,
          e.name AS user_name,
          ja.created_at AS date
        FROM job_assignees ja
        JOIN employees e ON e.id = ja.employee_id
        WHERE ja.job_id = $1


        UNION ALL


        /* JOB CREATED */

        SELECT
          'job_created' AS type,
          'Job created' AS title,
          'System' AS user_name,
          j.created_at AS date
        FROM jobs j
        WHERE j.id = $1


        UNION ALL


        /* JOB UPDATED */

        SELECT
          'job_updated' AS type,
          'Job updated' AS title,
          'System' AS user_name,
          j.updated_at AS date
        FROM jobs j
        WHERE j.id = $1
        AND j.updated_at IS NOT NULL


      ) activity

      ORDER BY date DESC

      LIMIT 100

    `, [id]);

    res.json(result.rows);

  }
  catch (err) {

    console.error("Activity error:", err);

    res.status(500).json({
      error: "Activity load failed"
    });

  }

};

