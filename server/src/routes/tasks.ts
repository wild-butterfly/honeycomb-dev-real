import { Router } from "express";
import { pool } from "../db";

const router = Router();

/* =====================================================
   GET ALL TASKS
===================================================== */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
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

/* =====================================================
   CREATE TASK
===================================================== */
router.post("/", async (req, res) => {
  try {
    const { description, assigned, due } = req.body;

    const result = await pool.query(
      `
      INSERT INTO tasks (description, assigned, due, company_id, status)
      VALUES ($1,$2,$3,$4,'pending')
      RETURNING *
      `,
      [description, assigned ?? [], due, 1]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE task error:", err);
    res.status(500).json({ error: "Task create failed" });
  }
});

/* =====================================================
   ⚠️ IMPORTANT: SPECIFIC ROUTES FIRST
===================================================== */

/* DELETE ALL COMPLETED */
router.delete("/completed", async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE status='completed'");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Clean failed" });
  }
});
/* =====================================================
   COMPLETE TASK  (PUT matches frontend)
===================================================== */
router.put("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE tasks
      SET status='completed'
      WHERE id=$1
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

/* =====================================================
   DELETE SINGLE TASK
===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;