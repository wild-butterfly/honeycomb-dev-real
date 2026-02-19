// server/controllers/tasks.controller.ts
// 🔐 RLS SAFE + DB STRUCTURE MATCHED

import { Request, Response } from "express";

/* ================= GET ALL ================= */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(`
      SELECT *
      FROM tasks
      ORDER BY created_at DESC
    `);

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
    const { description, assigned, due } = req.body;

    const cleanAssigned = Array.isArray(assigned)
  ? assigned
      .filter((id) => id !== "" && id !== null && id !== undefined)
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id))
  : [];

    const result = await db.query(
      `
      INSERT INTO tasks
      (description, assigned, due, status, company_id)
      VALUES
      ($1, $2, $3, 'pending',
       current_setting('app.current_company_id')::int)
      RETURNING *
      `,
      [
        description,
        cleanAssigned,
        due || null
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("tasks.create error:", err);
    res.status(500).json({ error: "Task create failed" });
    
  }
};

/* ================= COMPLETE ================= */
export const complete = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);

    const result = await db.query(
      `
      UPDATE tasks
      SET status = 'completed'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("tasks.complete", err);
    res.status(500).json({ error: "Task complete failed" });
  }
};

/* ================= DELETE ALL COMPLETED ================= */
export const deleteCompleted = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    await db.query(`
      DELETE FROM tasks
      WHERE status = 'completed'
    `);

    res.json({ success: true });
  } catch (err) {
    console.error("tasks.deleteCompleted", err);
    res.status(500).json({ error: "Task delete failed" });
  }
};

/* ================= DELETE SINGLE ================= */
export const remove = async (req: Request, res: Response) => {
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
    console.error("tasks.remove", err);
    res.status(500).json({ error: "Task delete failed" });
  }
};