import { pool } from "../db";

/* ================= GET ALL ================= */
export const getAll = async (_req: any, res: any) => {
  const result = await pool.query(
    "SELECT * FROM tasks ORDER BY due ASC"
  );

  res.json(result.rows);
};

/* ================= CREATE ================= */
export const create = async (req: any, res: any) => {
  const { desc, assigned, due, status } = req.body;

  const result = await pool.query(
    `INSERT INTO tasks (desc, assigned, due, status)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [desc, assigned, due, status]
  );

  res.json(result.rows[0]);
};

/* ================= COMPLETE ================= */
export const complete = async (req: any, res: any) => {
  const { id } = req.params;

  await pool.query(
    "UPDATE tasks SET status='complete' WHERE id=$1",
    [id]
  );

  res.json({ success: true });
};

/* ================= DELETE ================= */
export const remove = async (req: any, res: any) => {
  const { id } = req.params;

  await pool.query(
    "DELETE FROM tasks WHERE id=$1",
    [id]
  );

  res.json({ success: true });
};