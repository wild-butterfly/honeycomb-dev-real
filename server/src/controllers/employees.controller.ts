// server/controllers/employees.controller.ts
// GOD MODE SAFE VERSION

import { Request, Response } from "express";

const toInt = (v: any) => Number.parseInt(v, 10);


/* ========================================================
   GET ALL
======================================================== */

export const getAll = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const { rows } = await db.query(
`
SELECT
 id,
 name,
 rate,
 active
FROM employees
WHERE CASE
  WHEN current_setting('app.god_mode') = 'true' THEN TRUE
  ELSE company_id = current_setting('app.current_company_id')::bigint
END
ORDER BY name ASC
`
    );

    res.json(rows);

  }
  catch (err) {

    console.error("employees.getAll:", err);

    res.status(500).json({
      error: "Employees load failed"
    });

  }

};



/* ========================================================
   GET ONE
======================================================== */

export const getOne = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const id = toInt(req.params.id);

    const { rows } = await db.query(
`
SELECT
 id,
 name,
 rate,
 active
FROM employees
WHERE id = $1 AND (
  current_setting('app.god_mode') = 'true'
  OR company_id = current_setting('app.current_company_id')::bigint
)
`,
      [id]
    );

    if (!rows.length) {

      return res.status(404).json({
        error: "Employee not found"
      });

    }

    res.json(rows[0]);

  }
  catch (err) {

    console.error("employees.getOne:", err);

    res.status(500).json({
      error: "Employee load failed"
    });

  }

};



/* ========================================================
   CREATE
   GOD MODE SAFE FIX
======================================================== */

export const create = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const { name, rate = 0 } = req.body;

    if (!name) {

      return res.status(400).json({
        error: "Name is required"
      });

    }


    const { rows } = await db.query(

`
INSERT INTO employees
(
 name,
 rate,
 active,
 company_id
)
VALUES
(
 $1,
 $2,
 true,
 COALESCE(
   NULLIF(current_setting('app.current_company_id', true), '')::int,
   (SELECT company_id FROM users WHERE id =
     NULLIF(current_setting('app.current_user_id', true), '')::int
   )
 )
)
RETURNING
 id,
 name,
 rate,
 active
`,
      [name, rate]

    );


    res.status(201).json(rows[0]);

  }
  catch (err) {

    console.error("employees.create:", err);

    res.status(500).json({
      error: "Employee create failed"
    });

  }

};



/* ========================================================
   UPDATE
======================================================== */

export const update = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const id = toInt(req.params.id);

    const { name, rate, active } = req.body;


    const { rows } = await db.query(
`
UPDATE employees
SET
 name = COALESCE($1, name),
 rate = COALESCE($2, rate),
 active = COALESCE($3, active)
WHERE id = $4 AND (
  current_setting('app.god_mode') = 'true'
  OR company_id = current_setting('app.current_company_id')::bigint
)
RETURNING
 id,
 name,
 rate,
 active
`,
      [name, rate, active, id]
    );


    if (!rows.length) {

      return res.status(404).json({
        error: "Employee not found"
      });

    }

    res.json(rows[0]);

  }
  catch (err) {

    console.error("employees.update:", err);

    res.status(500).json({
      error: "Employee update failed"
    });

  }

};



/* ========================================================
   DELETE
======================================================== */

export const remove = async (req: Request, res: Response) => {

  const db = (req as any).db;

  try {

    const id = toInt(req.params.id);

    const check = await db.query(
`
SELECT 1
FROM assignments a
JOIN jobs j ON j.id = a.job_id
WHERE a.employee_id = $1 AND (
  current_setting('app.god_mode') = 'true'
  OR j.company_id = current_setting('app.current_company_id')::bigint
)
LIMIT 1
`,
      [id]
    );


    if (check.rowCount) {

      return res.status(400).json({

        error:
          "Employee has assignments and cannot be deleted",

      });

    }


    const result = await db.query(
`
DELETE FROM employees
WHERE id = $1 AND (
  current_setting('app.god_mode') = 'true'
  OR company_id = current_setting('app.current_company_id')::bigint
)
RETURNING id
`,
      [id]
    );


    if (!result.rowCount) {

      return res.status(404).json({
        error: "Employee not found"
      });

    }


    res.json({
      success: true
    });

  }
  catch (err) {

    console.error("employees.remove:", err);

    res.status(500).json({
      error: "Employee delete failed"
    });

  }

};