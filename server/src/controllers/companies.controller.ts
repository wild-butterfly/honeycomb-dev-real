import { pool } from "../db";

/* GET ALL */
export const getAll = async (_req: any, res: any) => {
  const result = await pool.query("SELECT * FROM companies ORDER BY id ASC");
  res.json(result.rows);
};

/* CREATE */
export const create = async (req: any, res: any) => {
  const { name } = req.body;

  await pool.query(
    "INSERT INTO companies (name) VALUES ($1)",
    [name]
  );

  res.json({ success: true });
};

/* GET EMPLOYEES OF COMPANY */
export const getEmployees = async (req: any, res: any) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT * FROM employees WHERE company_id = $1 ORDER BY id ASC",
    [id]
  );

  res.json(result.rows);
};