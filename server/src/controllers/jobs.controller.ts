//jobs.controller.ts
import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import {
  logJobActivity,
  resolveActorName,
  resolveEmployeeName,
} from "../lib/activity";

/* ===============================
   GET ALL JOBS + ASSIGNMENTS + ASSIGNEES
================================ */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(`
      SELECT
        j.*,
        to_char(j.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at_iso,

        /* scheduled assignments (calendar) */
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
          '[]'::json
        ) AS assignments,

        /* scheduled employees (dashboard wants these) */
        COALESCE(
          array_agg(DISTINCT a.employee_id) FILTER (WHERE a.employee_id IS NOT NULL),
          '{}'::int[]
        ) AS "scheduledEmployeeIds",

        /* watchers / manually assigned */
        COALESCE(
          array_agg(DISTINCT ja.employee_id) FILTER (WHERE ja.employee_id IS NOT NULL),
          '{}'::int[]
        ) AS "assignedEmployeeIds",

        /* optional: full assignee objects (from job_assignees) */
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', e.id, 'name', e.name)
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'::json
        ) AS assignees

      FROM jobs j
      LEFT JOIN assignments a ON a.job_id = j.id
      LEFT JOIN job_assignees ja ON ja.job_id = j.id
      LEFT JOIN employees e ON e.id = ja.employee_id
      WHERE CASE 
        WHEN current_setting('app.god_mode') = 'true' THEN TRUE
        ELSE j.company_id = current_setting('app.current_company_id')::bigint
      END
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error("jobs.getAll error:", err);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
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
        to_char(j.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at_iso,
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
      WHERE j.id = $1 AND (
        current_setting('app.god_mode') = 'true' 
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
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
   ✅ FINAL ENTERPRISE SAFE VERSION
================================ */

export const create = async (
  req: Request,
  res: Response
) => {

  const db = (req as any).db;

  try {

    const { title, status = "active" } = req.body;

    if (!title)
      return res.status(400)
        .json({
          error: "Title required"
        });


    /* ===================================================
       GET COMPANY FROM DB CONTEXT
    =================================================== */

    const ctx =
      await db.query(`
        SELECT
          current_setting(
            'app.current_company_id',
            true
          ) AS company_id
      `);


    const companyId =
      ctx.rows[0]?.company_id;


    if (!companyId)
      return res.status(400)
        .json({
          error:
            "No company selected"
        });


    /* ===================================================
       INSERT
    =================================================== */

    const result =
      await db.query(
        `
        INSERT INTO jobs
        (
          title,
          status,
          company_id
        )
        VALUES
        (
          $1,
          $2,
          $3
        )
        RETURNING *
        `,
        [
          title,
          status,
          companyId
        ]
      );

    const actorName = await resolveActorName(
      db,
      req as AuthRequest
    );

    await logJobActivity(
      db,
      Number(result.rows[0].id),
      "job_created",
      "Job created",
      actorName
    );


    res.json(
      result.rows[0]
    );

  }
  catch (err)
  {

    console.error(err);

    res.status(500)
      .json({
        error: "Create failed"
      });

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

    const existing = await db.query(
      `
      SELECT notes, status
      FROM jobs
      WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      `,
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    const notesProvided =
      Object.prototype.hasOwnProperty.call(req.body, "notes");
    const statusProvided =
      Object.prototype.hasOwnProperty.call(req.body, "status");

    const previousNotes = existing.rows[0]?.notes ?? null;
    const notesChanged = notesProvided && notes !== previousNotes;
    const previousStatus = existing.rows[0]?.status ?? null;
    const statusChanged = statusProvided && status !== previousStatus;

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
        contact_phone = COALESCE($9, contact_phone),
        updated_at = NOW()
      WHERE id = $10 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
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

    const actorName = await resolveActorName(
      db,
      req as AuthRequest
    );

    const formatNotes = (value: unknown) => {
      const text = String(value ?? "").replace(/\s+/g, " ").trim();
      if (!text) return "empty";
      return text.length > 60 ? `${text.slice(0, 57)}...` : text;
    };

    if (notesChanged) {
      await logJobActivity(
        db,
        Number(id),
        "notes_updated",
        `Notes changed from "${formatNotes(previousNotes)}" to "${formatNotes(notes)}"`,
        actorName
      );
    }

    if (statusChanged) {
      await logJobActivity(
        db,
        Number(id),
        "status_changed",
        `Status changed from "${previousStatus ?? "none"}" to "${status ?? "none"}"`,
        actorName
      );
    }

    if (!notesChanged && !statusChanged) {
      await logJobActivity(
        db,
        Number(id),
        "job_updated",
        "Job updated",
        actorName
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE job error", err);
    res.status(500).json({ error: "Job update failed" });
  }
};


/* ===============================
   DELETE JOB  ✅ FIXED
================================ */
export const remove = async (req: Request, res: Response) => {
  const db = (req as any).db; // 🔐 request-scoped connection

  try {
    const jobId = Number(req.params.id);

    if (!Number.isInteger(jobId)) {
      return res.status(400).json({ error: "Invalid job id" });
    }

    // ✅ Transaction = no half-deletes
    await db.query("BEGIN");

    // ✅ Verify job belongs to current company FIRST
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )`,
      [jobId]
    );
    
    if (!jobCheck.rowCount) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found" });
    }

    // ✅ Delete dependent rows first (prevents FK errors + orphan rows)
    await db.query(`DELETE FROM labour_entries WHERE job_id = $1`, [jobId]);
    await db.query(`DELETE FROM job_assignees  WHERE job_id = $1`, [jobId]);
    await db.query(`DELETE FROM assignments    WHERE job_id = $1`, [jobId]);

    const result = await db.query(
      `DELETE FROM jobs WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )`,
      [jobId]
    );

    if (!result.rowCount) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found" });
    }

    await db.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    try {
      await (req as any).db.query("ROLLBACK");
    } catch {}

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

    const result = await db.query(
      `
      DELETE FROM job_assignees
      WHERE job_id = $1 AND employee_id = $2
      RETURNING employee_id
      `,
      [jobId, employee_id]
    );

    if (result.rows.length) {
      const actorName = await resolveActorName(
        db,
        req as AuthRequest
      );
      const employeeName = await resolveEmployeeName(
        db,
        Number(employee_id)
      );

      await logJobActivity(
        db,
        jobId,
        "staff_unassigned",
        `Unassigned ${employeeName}`,
        actorName
      );
    }

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
      JOIN jobs j ON j.id = l.job_id
      WHERE l.job_id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
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

 

    // 1️⃣ Job exists? (company-scoped)
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )`,
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

    const actorName = await resolveEmployeeName(
      db,
      Number(employee_id)
    );

    await logJobActivity(
      db,
      jobId,
      "labour_added",
      "Labour added",
      actorName
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

    // 1️⃣ Job exists? (company-scoped)
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1 AND company_id = current_setting('app.current_company_id')::bigint`,
      [jobId]
    );

    if (!jobCheck.rowCount) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Insert — company_id from DB context
    const result = await db.query(
      `
      INSERT INTO job_assignees (job_id, employee_id, company_id)
      VALUES ($1, $2, current_setting('app.current_company_id')::int)
      ON CONFLICT DO NOTHING
      RETURNING employee_id
      `,
      [jobId, employee_id]
    );

    if (result.rows.length) {
      const actorName = await resolveActorName(
        db,
        req as AuthRequest
      );
      const employeeName = await resolveEmployeeName(
        db,
        Number(employee_id)
      );

      await logJobActivity(
        db,
        jobId,
        "staff_assigned",
        `Assigned ${employeeName}`,
        actorName
      );
    }

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
   GET JOB ACTIVITY ⭐ FINAL ENTERPRISE
================================ */
export const getActivity = async (req: Request, res: Response) => {

  try {

    const db = (req as any).db;
    const { id } = req.params;

    const limitRaw = Number(req.query.limit ?? 100);
    const offsetRaw = Number(req.query.offset ?? 0);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 100;
    const offset = Number.isFinite(offsetRaw)
      ? Math.max(offsetRaw, 0)
      : 0;

    const result = await db.query(
      `
      SELECT * FROM (
        SELECT
          type,
          title,
          user_name,
          to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS date
        FROM job_activity
        WHERE job_id = $1 AND (
          current_setting('app.god_mode') = 'true'
          OR company_id = current_setting('app.current_company_id')::bigint
        )

        UNION ALL

        SELECT
          'job_created' AS type,
          'Job created' AS title,
          'System' AS user_name,
          to_char(j.created_at, 'YYYY-MM-DD HH24:MI:SS') AS date
        FROM jobs j
        WHERE j.id = $1 AND (
          current_setting('app.god_mode') = 'true'
          OR j.company_id = current_setting('app.current_company_id')::bigint
        )
        AND NOT EXISTS (
          SELECT 1 FROM job_activity a
          WHERE a.job_id = j.id AND a.type = 'job_created'
        )
      ) activity
      ORDER BY date DESC
      LIMIT $2
      OFFSET $3
      `,
      [id, limit, offset]
    );

    res.json(result.rows);

  }
  catch (err) {

    console.error("Activity error:", err);

    res.status(500).json({
      error: "Activity load failed"
    });

  }

};

