// server/src/controllers/generalSettings.controller.ts
// General Settings Controller - Professional FSM Pattern
// Handles company settings, taxes, and customer sources

import { Request, Response } from "express";
import { pool } from "../db";

/* =========================================================
   GET GENERAL SETTINGS
========================================================= */
export const getGeneralSettings = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Get company settings
    const companyResult = await pool.query(
      `SELECT 
        id,
        name as business_name,
        abn,
        payee_name,
        bsb_number,
        bank_account_number,
        job_number_prefix,
        starting_job_number,
        currency,
        date_format,
        timezone,
        auto_assign_phase,
        show_state_on_invoices,
        auto_archive_unpriced,
        unpriced_jobs_cleanup_days,
        expired_quotes_cleanup_days,
        inactive_jobs_cleanup_days,
        auto_archive_stale_days
      FROM companies 
      WHERE id = $1`,
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Get taxes for this company
    const taxesResult = await pool.query(
      `SELECT id, name, rate 
       FROM taxes 
       WHERE company_id = $1 AND is_active = true
       ORDER BY name`,
      [companyId]
    );

    // Get customer sources for this company
    const sourcesResult = await pool.query(
      `SELECT id, name 
       FROM customer_sources 
       WHERE company_id = $1 AND is_active = true
       ORDER BY usage_count DESC, name`,
      [companyId]
    );

    return res.json({
      settings: companyResult.rows[0],
      taxes: taxesResult.rows,
      customerSources: sourcesResult.rows,
    });
  } catch (error) {
    console.error("Error fetching general settings:", error);
    return res.status(500).json({ error: "Failed to fetch general settings" });
  }
};

/* =========================================================
   UPDATE GENERAL SETTINGS
========================================================= */
export const updateGeneralSettings = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const {
      business_name,
      abn,
      payee_name,
      bsb_number,
      bank_account_number,
      job_number_prefix,
      starting_job_number,
      currency,
      date_format,
      timezone,
      auto_assign_phase,
      show_state_on_invoices,
      auto_archive_unpriced,
      unpriced_jobs_cleanup_days,
      expired_quotes_cleanup_days,
      inactive_jobs_cleanup_days,
      auto_archive_stale_days,
    } = req.body;

    console.log("UpdateGeneralSettings received:", {
      companyId,
      business_name,
      starting_job_number,
      auto_assign_phase,
      unpriced_jobs_cleanup_days,
      inactive_jobs_cleanup_days,
    });

    const result = await pool.query(
      `UPDATE companies SET
        name = COALESCE($1, name),
        abn = COALESCE($2, abn),
        payee_name = COALESCE($3, payee_name),
        bsb_number = COALESCE($4, bsb_number),
        bank_account_number = COALESCE($5, bank_account_number),
        job_number_prefix = COALESCE($6, job_number_prefix),
        starting_job_number = COALESCE($7::INTEGER, starting_job_number),
        currency = COALESCE($8, currency),
        date_format = COALESCE($9, date_format),
        timezone = COALESCE($10, timezone),
        auto_assign_phase = COALESCE($11::BOOLEAN, auto_assign_phase),
        show_state_on_invoices = COALESCE($12::BOOLEAN, show_state_on_invoices),
        auto_archive_unpriced = COALESCE($13::BOOLEAN, auto_archive_unpriced),
        unpriced_jobs_cleanup_days = COALESCE($14::INTEGER, unpriced_jobs_cleanup_days),
        expired_quotes_cleanup_days = COALESCE($15::INTEGER, expired_quotes_cleanup_days),
        inactive_jobs_cleanup_days = $16,
        auto_archive_stale_days = COALESCE($17::INTEGER, auto_archive_stale_days)
      WHERE id = $18
      RETURNING *`,
      [
        business_name,
        abn,
        payee_name,
        bsb_number,
        bank_account_number,
        job_number_prefix,
        starting_job_number,
        currency,
        date_format,
        timezone,
        auto_assign_phase,
        show_state_on_invoices,
        auto_archive_unpriced,
        unpriced_jobs_cleanup_days,
        expired_quotes_cleanup_days,
        inactive_jobs_cleanup_days,
        auto_archive_stale_days,
        companyId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.json({
      message: "General settings updated successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating general settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Detailed error:", errorMessage);
    return res.status(500).json({ error: `Failed to update general settings: ${errorMessage}` });
  }
};

/* =========================================================
   TAXES MANAGEMENT
========================================================= */

// Add tax
export const addTax = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { name, rate } = req.body;

    if (!name || rate === undefined) {
      return res.status(400).json({ error: "Tax name and rate are required" });
    }

    const result = await pool.query(
      `INSERT INTO taxes (company_id, name, rate)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id, name) 
       DO UPDATE SET rate = EXCLUDED.rate, is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [companyId, name, rate]
    );

    return res.status(201).json({
      message: "Tax added successfully",
      tax: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding tax:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to add tax: ${errorMessage}` });
  }
};

// Remove tax (soft delete)
export const removeTax = async (req: Request, res: Response) => {
  try {
    const { companyId, taxId } = req.params;

    const result = await pool.query(
      `UPDATE taxes 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [taxId, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tax not found" });
    }

    return res.json({
      message: "Tax removed successfully",
      tax: result.rows[0],
    });
  } catch (error) {
    console.error("Error removing tax:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to remove tax: ${errorMessage}` });
  }
};

/* =========================================================
   CUSTOMER SOURCES MANAGEMENT
========================================================= */

// Add customer source
export const addCustomerSource = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Source name is required" });
    }

    const result = await pool.query(
      `INSERT INTO customer_sources (company_id, name)
       VALUES ($1, $2)
       ON CONFLICT (company_id, name) 
       DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [companyId, name]
    );

    return res.status(201).json({
      message: "Customer source added successfully",
      source: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding customer source:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to add customer source: ${errorMessage}` });
  }
};

// Remove customer source (soft delete)
export const removeCustomerSource = async (req: Request, res: Response) => {
  try {
    const { companyId, sourceId } = req.params;

    const result = await pool.query(
      `UPDATE customer_sources 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [sourceId, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer source not found" });
    }

    return res.json({
      message: "Customer source removed successfully",
      source: result.rows[0],
    });
  } catch (error) {
    console.error("Error removing customer source:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to remove customer source: ${errorMessage}` });
  }
};

// Increment usage count (when source is used for a new customer)
export const incrementSourceUsage = async (req: Request, res: Response) => {
  try {
    const { companyId, sourceId } = req.params;

    await pool.query(
      `UPDATE customer_sources 
       SET usage_count = usage_count + 1
       WHERE id = $1 AND company_id = $2`,
      [sourceId, companyId]
    );

    return res.json({ message: "Source usage incremented" });
  } catch (error) {
    console.error("Error incrementing source usage:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to update source usage: ${errorMessage}` });
  }
};
