// server/controllers/employees.controller.ts
// Created by Clevermode © 2026

import { Request, Response } from "express";
import { pool } from "../db";

/* ===============================
   GET ALL EMPLOYEES
================================ */
export const getAll = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
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
  try {
    const { id } = req.params;

    const result = await pool.query(
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
  try {
    const { name, hourly_rate = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO employees (name, hourly_rate, active)
      VALUES ($1, $2, true)
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
  try {
    const { id } = req.params;
    const { name, hourly_rate, active } = req.body;

    const result = await pool.query(
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
  try {
    const { id } = req.params;

    // 🔒 Block delete if assignments exist
    const check = await pool.query(
      `SELECT 1 FROM assignments WHERE employee_id = $1 LIMIT 1`,
      [id]
    );

    if (check.rows.length) {
      return res.status(400).json({
        error: "Employee has assignments and cannot be deleted",
      });
    }

    const result = await pool.query(
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