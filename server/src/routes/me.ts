import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET /api/me
 * Returns current session/company info
 */
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id AS company_id
       FROM companies
       ORDER BY id
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No company found" });
    }

    res.json({
      company_id: result.rows[0].company_id,
    });
  } catch (err) {
    console.error("GET /me failed", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

export default router;