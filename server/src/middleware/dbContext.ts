import { pool } from "../db";
import { Request, Response, NextFunction } from "express";

export const withDbContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();

  try {
    const companyId = 1; 

    await client.query("BEGIN");

    await client.query(
      `SELECT set_config('app.current_company_id', $1, true)`,
      [String(companyId)]
    );

    (req as any).db = client;

    res.on("close", async () => {
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
