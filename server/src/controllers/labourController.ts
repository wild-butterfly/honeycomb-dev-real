// server/controllers/labour.controller.ts
// FINAL CLEAN VERSION
// GOD MODE SAFE
// FK SAFE
// RLS SAFE

import { Request, Response } from "express";


/* =========================================================
   GET LABOUR ENTRIES
========================================================= */

export const getLabourEntries = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const jobId = Number(req.params.jobId);

    const { rows } = await db.query(
`
SELECT 
 le.id,
 le.employee_id,
 le.assignment_id,
 e.name AS employee_name,
 le.start_time,
 le.end_time,
 le.worked_hours,
 le.uncharged_hours,
 le.chargeable_hours,
 le.rate,
 le.total,
 le.notes AS description,
 le.created_at,
 le.source
FROM labour_entries le
JOIN employees e ON e.id = le.employee_id
WHERE le.job_id = $1
ORDER BY le.created_at DESC
`,
      [jobId]
    );

    res.json(rows);

  }
  catch (err) {

    console.error("LABOUR FETCH ERROR:", err);

    res.status(500).json({
      error: "Labour fetch failed"
    });

  }

};



/* =========================================================
   ADD LABOUR ENTRY
   GOD MODE SAFE FIX
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
      source = "manual",

    } = req.body;



    const { rows } = await db.query(

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
 j.id,
 $2,
 $3,
 $4,
 $5,
 $6,
 $7,
 $8,
 $9,
 $10,
 $11,
 $12,
 j.company_id
FROM jobs j
WHERE j.id = $1
RETURNING *
`,
      [
        jobId,
        assignment_id ?? null,
        employee_id,
        start_time,
        end_time,
        worked_hours ?? 0,
        uncharged_hours ?? 0,
        chargeable_hours ?? 0,
        rate ?? 0,
        total ?? 0,
        description ?? null,
        source
      ]

    );


    if (!rows.length) {

      return res.status(404).json({
        error: "Job not found"
      });

    }


    res.status(201).json(rows[0]);


  }
  catch (err) {

    console.error("LABOUR INSERT ERROR:", err);

    res.status(500).json({
      error: "Labour add failed"
    });

  }

};



/* =========================================================
   DELETE
========================================================= */

export const deleteLabourEntry = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const id = Number(req.params.id);

    await db.query(
`
DELETE FROM labour_entries
WHERE id = $1
`,
      [id]
    );

    res.json({
      success: true
    });

  }
  catch (err) {

    console.error("LABOUR DELETE ERROR:", err);

    res.status(500).json({
      error: "Labour delete failed"
    });

  }

};
