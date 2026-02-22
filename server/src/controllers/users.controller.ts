// server/src/controllers/users.controller.ts
// User Management Controller - Admin creates employee accounts

import { Request, Response } from "express";
import bcrypt from "bcrypt";

/* ========================================================
   CREATE EMPLOYEE ACCOUNT (Admin Only)
   Admin can create employee login accounts for their company
======================================================== */

export const createEmployee = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const adminUser = (req as any).user;

  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  const {
    email,
    password,
    full_name,
    phone,
    job_title
  } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters"
    });
  }

  try {
    // Get admin's company context
    const contextResult = await db.query(`
      SELECT NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id
    `);

    const companyId = contextResult.rows[0]?.current_company_id || adminUser.company_id;

    if (!companyId) {
      return res.status(400).json({
        error: "Company context required"
      });
    }

    // Verify admin belongs to this company (security check)
    if (adminUser.company_id !== companyId) {
      return res.status(403).json({
        error: "You can only create employees for your own company"
      });
    }

    // Check if email already exists
    const existingUser = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee user
    const { rows } = await db.query(
      `
      INSERT INTO users
      (
        company_id,
        email,
        password_hash,
        role,
        full_name,
        phone,
        job_title,
        active
      )
      VALUES ($1, $2, $3, 'employee', $4, $5, $6, true)
      RETURNING 
        id,
        email,
        role,
        full_name,
        phone,
        job_title,
        company_id,
        active,
        created_at
      `,
      [
        companyId,
        email,
        hashedPassword,
        full_name || email.split('@')[0],
        phone || '',
        job_title || 'Employee'
      ]
    );

    const newEmployee = rows[0];

    console.log('✅ Employee account created:', {
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      employee_id: newEmployee.id,
      employee_email: newEmployee.email,
      company_id: companyId
    });

    res.status(201).json({
      message: "Employee account created successfully",
      employee: {
        id: newEmployee.id,
        email: newEmployee.email,
        full_name: newEmployee.full_name,
        role: newEmployee.role,
        company_id: newEmployee.company_id,
        job_title: newEmployee.job_title,
        phone: newEmployee.phone,
        active: newEmployee.active,
        created_at: newEmployee.created_at
      }
    });

  } catch (err) {
    console.error("users.createEmployee ERROR:", err);
    res.status(500).json({
      error: "Failed to create employee account"
    });
  }
};

/* ========================================================
   GET ALL EMPLOYEES (Admin Only)
   List all employee accounts in the company
======================================================== */

export const getCompanyEmployees = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const adminUser = (req as any).user;

  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    // Get admin's company context
    const contextResult = await db.query(`
      SELECT NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id
    `);

    const companyId = contextResult.rows[0]?.current_company_id || adminUser.company_id;

    // Get all employees for this company
    const { rows } = await db.query(
      `
      SELECT
        id,
        email,
        full_name,
        phone,
        job_title,
        department,
        active,
        created_at
      FROM users
      WHERE company_id = $1 
        AND role = 'employee'
        AND active = true
      ORDER BY full_name ASC, created_at DESC
      `,
      [companyId]
    );

    res.json({
      company_id: companyId,
      employees: rows
    });

  } catch (err) {
    console.error("users.getCompanyEmployees ERROR:", err);
    res.status(500).json({
      error: "Failed to load employees"
    });
  }
};

/* ========================================================
   DEACTIVATE EMPLOYEE (Admin Only)
   Soft delete - sets active=false
======================================================== */

export const deactivateEmployee = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const adminUser = (req as any).user;

  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  const employeeId = parseInt(req.params.id, 10);

  try {
    // Get admin's company
    const contextResult = await db.query(`
      SELECT NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id
    `);

    const companyId = contextResult.rows[0]?.current_company_id || adminUser.company_id;

    // Verify employee belongs to same company (security check)
    const employeeCheck = await db.query(
      `SELECT id, company_id, role FROM users WHERE id = $1`,
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = employeeCheck.rows[0];

    if (employee.company_id !== companyId) {
      return res.status(403).json({
        error: "You can only deactivate employees in your own company"
      });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({
        error: "Can only deactivate employee accounts"
      });
    }

    // Deactivate the employee
    await db.query(
      `UPDATE users SET active = false WHERE id = $1`,
      [employeeId]
    );

    console.log('✅ Employee deactivated:', {
      admin_id: adminUser.id,
      employee_id: employeeId,
      company_id: companyId
    });

    res.json({
      message: "Employee account deactivated",
      employee_id: employeeId
    });

  } catch (err) {
    console.error("users.deactivateEmployee ERROR:", err);
    res.status(500).json({
      error: "Failed to deactivate employee"
    });
  }
};
