import { pool } from "../db";
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export const withDbContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  const client = await pool.connect();

  try {

    if (!req.user)
    {
      client.release();

      return res.status(401).json({
        error: "Unauthorized"
      });
    }


    const {
      company_id,
      role,
      employee_id
    } = req.user;


    const headerCompanyId =
      req.headers["x-company-id"] as string | undefined;


    await client.query("BEGIN");


    /* =====================================================
       SUPERADMIN
    ===================================================== */

   if (role === "superadmin")
{

  await client.query(
    `SELECT set_config('app.current_role', $1, true)`,
    [role]
  );


  /* ============================================
     ONLY HEADER COMPANY
     DO NOT FALLBACK TO USER COMPANY
  ============================================ */

  if (
    headerCompanyId &&
    headerCompanyId !== "" &&
    headerCompanyId !== "null"
  )
  {

    await client.query(
      `SELECT set_config(
        'app.current_company_id',
        $1,
        true
      )`,
      [headerCompanyId]
    );


    await client.query(
      `SELECT set_config('app.god_mode', 'false', true)`
    );

  }
  else
  {

    /* GOD MODE TRUE */

    await client.query(
      `SELECT set_config('app.god_mode', 'true', true)`
    );

    /* CLEAR company context */

    await client.query(
      `SELECT set_config(
        'app.current_company_id',
        '',
        true
      )`
    );

  }


  if (employee_id)
  {

    await client.query(
      `SELECT set_config(
        'app.current_employee_id',
        $1,
        true
      )`,
      [String(employee_id)]
    );

  }


  (req as any).db = client;


  res.on("finish", async () =>
  {
    try { await client.query("COMMIT"); }
    catch { await client.query("ROLLBACK"); }
    finally { client.release(); }
  });


  return next();

}


    /* =====================================================
       NORMAL USER
    ===================================================== */


    if (!company_id)
    {
      client.release();

      return res.status(401).json({
        error: "Company required"
      });
    }


    await client.query(
      `SELECT set_config(
        'app.current_company_id',
        $1,
        true
      )`,
      [String(company_id)]
    );


    await client.query(
      `SELECT set_config(
        'app.current_role',
        $1,
        true
      )`,
      [role]
    );


    await client.query(
      `SELECT set_config(
        'app.god_mode',
        'false',
        true
      )`
    );


    if (employee_id)
    {
      await client.query(
        `SELECT set_config(
          'app.current_employee_id',
          $1,
          true
        )`,
        [String(employee_id)]
      );
    }


    (req as any).db = client;


    res.on("finish", async () =>
    {
      try { await client.query("COMMIT"); }
      catch { await client.query("ROLLBACK"); }
      finally { client.release(); }
    });


    next();


  }
  catch (err)
  {

    try { await client.query("ROLLBACK"); }
    finally { client.release(); }

    next(err);

  }

};