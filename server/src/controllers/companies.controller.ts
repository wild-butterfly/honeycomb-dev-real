import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { pool } from "../db";

export const getAll = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    if (req.user?.role === "superadmin")
    {

      const result = await pool.query(
        `
        SELECT id, name
        FROM companies
        ORDER BY name
        `
      );

      return res.json(result.rows);

    }

    if (!req.user?.company_id)
    {
      return res.json([]);
    }

    const result = await pool.query(
      `
      SELECT id, name
      FROM companies
      WHERE id = $1
      `,
      [req.user.company_id]
    );

    res.json(result.rows);

  }
  catch (err)
  {

    console.error(err);

    res.status(500).json({
      error: "Failed to load companies"
    });

  }

};