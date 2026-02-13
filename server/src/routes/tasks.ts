// server/routes/tasks.ts
// 🔐 RLS SAFE VERSION

import { Router } from "express";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/* ============================================
   🔐 Attach RLS DB Context
============================================ */
router.use(withDbContext);

/* ============================================
   GET ALL TASKS
============================================ */
router.get("/", async (req, res) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT *
      FROM tasks
      ORDER BY created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET tasks error:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

/* ============================================
   CREATE TASK
============================================ */
router.post("/", async (req, res) => {
  const db = (req as any).db;

  try {
    const { description, assigned, due } = req.body;

    const result = await db.query(
      `
      INSERT INTO tasks
      (description, assigned, due, company_id, status)
      VALUES
      (
        $1,
        $2,
        $3,
        current_setting('app.current_company_id')::int,
        'pending'
      )
      RETURNING *
      `,
      [description, assigned ?? [], due]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE task error:", err);
    res.status(500).json({ error: "Task create failed" });
  }
});

/* ============================================
   DELETE ALL COMPLETED
============================================ */
router.delete("/completed", async (req, res) => {
  const db = (req as any).db;

  try {
    await db.query(
      `
      DELETE FROM tasks
      WHERE status = 'completed'
      `
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE completed tasks error:", err);
    res.status(500).json({ error: "Clean failed" });
  }
});

/* ============================================
   COMPLETE TASK
============================================ */
router.put("/:id/complete", async (req, res) => {
  const db = (req as any).db;

  try {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE tasks
      SET status = 'completed'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("COMPLETE task error:", err);
    res.status(500).json({ error: "Complete failed" });
  }
});

/* ============================================
   DELETE SINGLE TASK
============================================ */
router.delete("/:id", async (req, res) => {
  const db = (req as any).db;

  try {
    await db.query(
      `
      DELETE FROM tasks
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE task error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;