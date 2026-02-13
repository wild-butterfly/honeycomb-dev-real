// server/controllers/companies.controller.ts
// 🔐 RLS SAFE VERSION

import { Request, Response } from "express";

/* ===============================
   GET ALL COMPANIES (ADMIN ONLY)
   
================================ */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT *
      FROM companies
      ORDER BY id ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("companies.getAll", err);
    res.status(500).json({ error: "Companies load failed" });
  }
};

/* ===============================
   CREATE COMPANY
================================ */
export const create = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Company name required" });
    }

    const result = await db.query(
      `
      INSERT INTO companies (name)
      VALUES ($1)
      RETURNING *
      `,
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("companies.create", err);
    res.status(500).json({ error: "Company create failed" });
  }
};

/* ===============================
   GET EMPLOYEES OF CURRENT COMPANY
   ⚠️ IMPORTANT: We DO NOT trust URL id
================================ */
export const getEmployees = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {

    const result = await db.query(
      `
      SELECT *
      FROM employees
      ORDER BY id ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("companies.getEmployees", err);
    res.status(500).json({ error: "Employees load failed" });
  }
};
