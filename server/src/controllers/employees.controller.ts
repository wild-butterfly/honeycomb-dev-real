// server/controllers/employees.controller.ts
// Created by Clevermode © 2026
// 🔐 RLS SAFE VERSION

import { Request, Response } from "express";

/* ===============================
   GET ALL EMPLOYEES
================================ */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        hourly_rate,
        active
      FROM employees
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("employees.getAll", err);
    res.status(500).json({ error: "Employees load failed" });
  }
};

/* ===============================
   GET ONE EMPLOYEE
================================ */
export const getOne = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);

    const result = await db.query(
      `
      SELECT id, name, hourly_rate, active
      FROM employees
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("employees.getOne", err);
    res.status(500).json({ error: "Employee load failed" });
  }
};

/* ===============================
   CREATE EMPLOYEE
================================ */
export const create = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const { name, hourly_rate = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await db.query(
      `
      INSERT INTO employees (name, hourly_rate, active, company_id)
      VALUES ($1, $2, true, current_setting('app.current_company_id')::int)
      RETURNING id, name, hourly_rate, active
      `,
      [name, hourly_rate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("employees.create", err);
    res.status(500).json({ error: "Employee create failed" });
  }
};

/* ===============================
   UPDATE EMPLOYEE
================================ */
export const update = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);
    const { name, hourly_rate, active } = req.body;

    const result = await db.query(
      `
      UPDATE employees
      SET
        name        = COALESCE($1, name),
        hourly_rate = COALESCE($2, hourly_rate),
        active      = COALESCE($3, active)
      WHERE id = $4
      RETURNING id, name, hourly_rate, active
      `,
      [name, hourly_rate, active, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("employees.update", err);
    res.status(500).json({ error: "Employee update failed" });
  }
};

/* ===============================
   DELETE EMPLOYEE (SAFE)
================================ */
export const remove = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const id = Number(req.params.id);

    // 🔒 Block delete if assignments exist
    const check = await db.query(
      `SELECT 1 FROM assignments WHERE employee_id = $1 LIMIT 1`,
      [id]
    );

    if (check.rows.length) {
      return res.status(400).json({
        error: "Employee has assignments and cannot be deleted",
      });
    }

    const result = await db.query(
      `DELETE FROM employees WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("employees.remove", err);
    res.status(500).json({ error: "Employee delete failed" });
  }
};