import { pool } from "../db";
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const withDbContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      client.release();
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { company_id, role, employee_id } = req.user;

    // 🔥 NEW: header override (superadmin only)
    const headerCompanyId = req.headers["x-company-id"] as string | undefined;

    await client.query("BEGIN");

    /* =====================================================
       SUPERADMIN (IMPERSONATION SUPPORT)
    ===================================================== */

    if (role === "superadmin") {

      // if header provided → impersonate
      const companyToUse = headerCompanyId || "0";

      await client.query(
        `SELECT set_config('app.current_role', $1, true)`,
        [role]
      );

      await client.query(
        `SELECT set_config('app.current_company_id', $1, true)`,
        [String(companyToUse)]
      );

    }

    /* =====================================================
       NORMAL USERS
    ===================================================== */

    else {

      if (!company_id) {
        client.release();
        return res.status(401).json({ error: "Company required" });
      }

      await client.query(
        `SELECT set_config('app.current_company_id', $1, true)`,
        [String(company_id)]
      );

      await client.query(
        `SELECT set_config('app.current_role', $1, true)`,
        [role]
      );

      if (employee_id) {
        await client.query(
          `SELECT set_config('app.current_employee_id', $1, true)`,
          [String(employee_id)]
        );
      }
    }

    (req as any).db = client;

    /* =====================================================
       CLEANUP
    ===================================================== */

    res.on("finish", async () => {
      try {
        await client.query("COMMIT");
      } catch {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    });

    next();

  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    next(err);
  }
};