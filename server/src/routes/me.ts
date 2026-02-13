// server/routes/me.ts
// 🔐 RLS SAFE VERSION

import { Router } from "express";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/* ============================================
   🔐 Attach DB Context (RLS)
============================================ */
router.use(withDbContext);

/**
 * GET /api/me
 * Returns current company from session context
 */
router.get("/", async (req, res) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT current_setting('app.current_company_id')::int AS company_id
      `
    );

    res.json({
      company_id: result.rows[0].company_id,
    });
  } catch (err) {
    console.error("GET /me failed", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

export default router;