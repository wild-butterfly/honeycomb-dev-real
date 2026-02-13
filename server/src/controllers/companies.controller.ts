// server/controllers/companies.controller.ts
// Created by Clevermode © 2026
// 🔐 PRODUCTION SAFE VERSION (Multi-Tenant SaaS)

import { Request, Response } from "express";

/* =========================================================
   GET CURRENT COMPANY ONLY
   🔐 Returns only company inside RLS scope
========================================================= */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT *
      FROM companies
      WHERE id = current_setting('app.current_company_id')::int
      `
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("companies.getAll", err);
    res.status(500).json({ error: "Company load failed" });
  }
};


/* =========================================================
   CREATE COMPANY
   🔐 Should only be used in register or super-admin context
========================================================= */
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


/* =========================================================
   GET EMPLOYEES OF CURRENT COMPANY
   🔐 Admin → all employees in company
   🔐 Employee → ONLY self (enforced by RLS policy)
========================================================= */
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
