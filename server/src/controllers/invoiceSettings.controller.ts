// invoiceSettings.controller.ts
// Invoice settings management - company branding, details, and configuration

import { Request, Response } from "express";
import { pool } from "../db";

export interface InvoiceSettings {
  id: number;
  company_id: number;
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  company_logo_url?: string;
  tax_registration_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string;
  bank_code?: string;
  iban?: string;
  swift_code?: string;
  custom_invoice_notes?: string;
  payment_terms?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * GET /api/invoice-settings/:companyId
 * Get invoice settings for a company
 */
export const getByCompanyId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params;

    const result = await pool.query(
      `SELECT * FROM public.invoice_settings WHERE company_id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invoice settings not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching invoice settings:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/invoice-settings
 * Create or update invoice settings for a company
 */
export const createOrUpdate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      company_id,
      company_name,
      company_address,
      company_city,
      company_state,
      company_postal_code,
      company_phone,
      company_email,
      company_website,
      company_logo_url,
      tax_registration_number,
      bank_name,
      bank_account_number,
      bank_sort_code,
      bank_code,
      iban,
      swift_code,
      custom_invoice_notes,
      payment_terms,
    } = req.body;

    if (!company_id) {
      res.status(400).json({ error: "company_id is required" });
      return;
    }

    // Check if settings already exist
    const existingResult = await pool.query(
      `SELECT id FROM public.invoice_settings WHERE company_id = $1`,
      [company_id]
    );

    let result;

    if (existingResult.rows.length > 0) {
      // UPDATE existing settings
      result = await pool.query(
        `UPDATE public.invoice_settings SET
          company_name = $1,
          company_address = $2,
          company_city = $3,
          company_state = $4,
          company_postal_code = $5,
          company_phone = $6,
          company_email = $7,
          company_website = $8,
          company_logo_url = $9,
          tax_registration_number = $10,
          bank_name = $11,
          bank_account_number = $12,
          bank_sort_code = $13,
          bank_code = $14,
          iban = $15,
          swift_code = $16,
          custom_invoice_notes = $17,
          payment_terms = $18,
          updated_at = CURRENT_TIMESTAMP
        WHERE company_id = $19
        RETURNING *`,
        [
          company_name,
          company_address,
          company_city,
          company_state,
          company_postal_code,
          company_phone,
          company_email,
          company_website,
          company_logo_url,
          tax_registration_number,
          bank_name,
          bank_account_number,
          bank_sort_code,
          bank_code,
          iban,
          swift_code,
          custom_invoice_notes,
          payment_terms,
          company_id,
        ]
      );
    } else {
      // INSERT new settings
      result = await pool.query(
        `INSERT INTO public.invoice_settings (
          company_id,
          company_name,
          company_address,
          company_city,
          company_state,
          company_postal_code,
          company_phone,
          company_email,
          company_website,
          company_logo_url,
          tax_registration_number,
          bank_name,
          bank_account_number,
          bank_sort_code,
          bank_code,
          iban,
          swift_code,
          custom_invoice_notes,
          payment_terms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          company_id,
          company_name,
          company_address,
          company_city,
          company_state,
          company_postal_code,
          company_phone,
          company_email,
          company_website,
          company_logo_url,
          tax_registration_number,
          bank_name,
          bank_account_number,
          bank_sort_code,
          bank_code,
          iban,
          swift_code,
          custom_invoice_notes,
          payment_terms,
        ]
      );
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error saving invoice settings:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/invoice-settings/:companyId
 * Update invoice settings for a company
 */
export const update = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const updates = req.body;

    // Whitelist allowed fields
    const allowedFields = [
      "company_name",
      "company_address",
      "company_city",
      "company_state",
      "company_postal_code",
      "company_phone",
      "company_email",
      "company_website",
      "company_logo_url",
      "tax_registration_number",
      "bank_name",
      "bank_account_number",
      "bank_sort_code",
      "bank_code",
      "iban",
      "swift_code",
      "custom_invoice_notes",
      "payment_terms",
    ];

    const updateEntries = Object.entries(updates)
      .filter(([key]) => allowedFields.includes(key))
      .map(([key, value]) => [key, value]);

    if (updateEntries.length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const columns = updateEntries.map(
      ([key], idx) => `${key} = $${idx + 1}`
    );
    const values = updateEntries.map(([, value]) => value);

    const result = await pool.query(
      `UPDATE public.invoice_settings SET
        ${columns.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = $${values.length + 1}
      RETURNING *`,
      [...values, companyId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invoice settings not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating invoice settings:", error);
    res.status(500).json({ error: error.message });
  }
};
