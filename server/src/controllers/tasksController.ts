// server/controllers/tasks.controller.ts
// 🔐 RLS SAFE VERSION

import { Request, Response } from "express";

/* ================= GET ALL ================= */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT *
      FROM tasks
      ORDER BY due ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("tasks.getAll", err);
    res.status(500).json({ error: "Tasks load failed" });
  }
};

/* ================= CREATE ================= */
export const create = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const { desc, assigned, due, status = "pending" } = req.body;

    if (!desc) {
      return res.status(400).json({ error: "Task description required" });
    }

    const result = await db.query(
      `
      INSERT INTO tasks
      (
        desc,
        assigned,
        due,
        status,
        company_id
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        current_setting('app.current_company_id')::int
      )
      RETURNING *
      `,
      [desc, assigned ?? null, due ?? null, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("tasks.create", err);
    res.status(500).json({ error: "Task create failed" });
  }
};

/* ================= COMPLETE ================= */
export const complete = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const result = await db.query(
      `
      UPDATE tasks
      SET status = 'complete'
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("tasks.complete", err);
    res.status(500).json({ error: "Task complete failed" });
  }
};

/* ================= DELETE ================= */
export const remove = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const result = await db.query(
      `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("tasks.remove", err);
    res.status(500).json({ error: "Task delete failed" });
  }
};
