import { Request, Response } from "express";
import { pool } from "../db";

// Get all templates for a company
export const getCompanyTemplates = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, company_id, name, status, is_default, main_color, accent_color, 
              text_color, font_size, orientation, created_at
       FROM invoice_templates
       WHERE company_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

// Get a single template
export const getTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM invoice_templates WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
};

// Create a new template
export const createTemplate = async (req: Request, res: Response) => {
  const {
    company_id,
    name,
    is_default,
    status,
    main_color,
    accent_color,
    text_color,
    font_size,
    indent_customer_address,
    orientation,
    document_title,
    show_line_quantities,
    show_line_prices,
    show_line_totals,
    show_section_totals,
    show_line_items,
    show_labour_quantities,
    show_labour_prices,
    show_labour_totals,
    show_labour_section_totals,
    show_labour_items,
    show_material_quantities,
    show_material_prices,
    show_material_totals,
    show_material_section_totals,
    show_material_items,
    default_description,
    default_footer,
    sections,
  } = req.body;

  try {
    // If this is set as default, unset other defaults
    if (is_default) {
      await pool.query(
        `UPDATE invoice_templates SET is_default = false WHERE company_id = $1`,
        [company_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO invoice_templates (
        company_id, name, is_default, status, main_color, accent_color, text_color,
        font_size, indent_customer_address, orientation, document_title,
        show_line_quantities, show_line_prices, show_line_totals, show_section_totals, show_line_items,
        show_labour_quantities, show_labour_prices, show_labour_totals, show_labour_section_totals, show_labour_items,
        show_material_quantities, show_material_prices, show_material_totals, show_material_section_totals, show_material_items,
        default_description, default_footer, sections
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        company_id,
        name,
        is_default || false,
        status || "active",
        main_color,
        accent_color,
        text_color,
        font_size,
        indent_customer_address || false,
        orientation || "portrait",
        document_title,
        show_line_quantities,
        show_line_prices,
        show_line_totals,
        show_section_totals,
        show_line_items,
        show_labour_quantities,
        show_labour_prices,
        show_labour_totals,
        show_labour_section_totals,
        show_labour_items,
        show_material_quantities,
        show_material_prices,
        show_material_totals,
        show_material_section_totals,
        show_material_items,
        default_description,
        default_footer,
        JSON.stringify(sections || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
};

// Update an existing template
export const updateTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    is_default,
    status,
    main_color,
    accent_color,
    text_color,
    font_size,
    indent_customer_address,
    orientation,
    document_title,
    show_line_quantities,
    show_line_prices,
    show_line_totals,
    show_section_totals,
    show_line_items,
    show_labour_quantities,
    show_labour_prices,
    show_labour_totals,
    show_labour_section_totals,
    show_labour_items,
    show_material_quantities,
    show_material_prices,
    show_material_totals,
    show_material_section_totals,
    show_material_items,
    default_description,
    default_footer,
    sections,
  } = req.body;

  try {
    // Get template's company_id
    const templateResult = await pool.query(
      `SELECT company_id FROM invoice_templates WHERE id = $1`,
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const company_id = templateResult.rows[0].company_id;

    // If this is set as default, unset other defaults
    if (is_default) {
      await pool.query(
        `UPDATE invoice_templates SET is_default = false WHERE company_id = $1 AND id != $2`,
        [company_id, id]
      );
    }

    const result = await pool.query(
      `UPDATE invoice_templates SET
        name = $1, is_default = $2, status = $3, main_color = $4, accent_color = $5,
        text_color = $6, font_size = $7, indent_customer_address = $8, orientation = $9,
        document_title = $10, show_line_quantities = $11, show_line_prices = $12,
        show_line_totals = $13, show_section_totals = $14, show_line_items = $15,
        show_labour_quantities = $16, show_labour_prices = $17, show_labour_totals = $18,
        show_labour_section_totals = $19, show_labour_items = $20,
        show_material_quantities = $21, show_material_prices = $22, show_material_totals = $23,
        show_material_section_totals = $24, show_material_items = $25,
        default_description = $26, default_footer = $27, sections = $28,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $29
       RETURNING *`,
      [
        name,
        is_default,
        status,
        main_color,
        accent_color,
        text_color,
        font_size,
        indent_customer_address,
        orientation,
        document_title,
        show_line_quantities,
        show_line_prices,
        show_line_totals,
        show_section_totals,
        show_line_items,
        show_labour_quantities,
        show_labour_prices,
        show_labour_totals,
        show_labour_section_totals,
        show_labour_items,
        show_material_quantities,
        show_material_prices,
        show_material_totals,
        show_material_section_totals,
        show_material_items,
        default_description,
        default_footer,
        JSON.stringify(sections || []),
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
};

// Delete a template
export const deleteTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM invoice_templates WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
};
