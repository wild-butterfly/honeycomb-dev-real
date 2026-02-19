import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

/* =====================================================
   GET ALL COMPANIES
   superadmin → all
   admin → own company
===================================================== */

export const getAll = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const db = (req as any).db;

    if (!db) {
      return res.status(500).json({
        error: "DB not initialized"
      });
    }

    const result = await db.query(`
      SELECT id, name
      FROM companies
      ORDER BY name
    `);

    res.json(result.rows);

  }
  catch (err) {

    console.error("getAll companies error:", err);

    res.status(500).json({
      error: "Failed to load companies"
    });

  }

};


/* =====================================================
   CREATE COMPANY
   admin / superadmin
===================================================== */

export const create = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const db = (req as any).db;

    if (!db) {
      return res.status(500).json({
        error: "DB not initialized"
      });
    }

    const { name } = req.body;

    if (!name) {

      return res.status(400).json({
        error: "Company name required"
      });

    }

    const result = await db.query(
      `
      INSERT INTO companies (name)
      VALUES ($1)
      RETURNING id, name
      `,
      [name]
    );

    res.status(201).json(
      result.rows[0]
    );

  }
  catch (err) {

    console.error("create company error:", err);

    res.status(500).json({
      error: "Failed to create company"
    });

  }

};