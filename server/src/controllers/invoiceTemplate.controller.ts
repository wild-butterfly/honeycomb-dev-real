import { Request, Response } from "express";
import { pool } from "../db";

// Get all templates for a company
export const getCompanyTemplates = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    console.log("Fetching templates for company:", companyId);
    
    const result = await pool.query(
      `SELECT * FROM invoice_templates
       WHERE company_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [companyId]
    );

    console.log("Found templates:", result.rows.length);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates", details: error.message });
  }
};

// Get a single template
export const getTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    console.log("=== GET TEMPLATE ===");
    console.log("Loading template ID:", id);
    
    const result = await pool.query(
      `SELECT * FROM invoice_templates WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = result.rows[0];
    console.log("Template found. Name:", template.name);
    console.log("Sections in DB (raw):", template.sections);
    console.log("Sections type:", typeof template.sections);
    console.log("=== VISIBILITY COLUMNS FROM DATABASE ===");
    console.log("show_line_items from DB:", template.show_line_items, "type:", typeof template.show_line_items);
    console.log("show_line_quantities from DB:", template.show_line_quantities, "type:", typeof template.show_line_quantities);
    console.log("show_line_prices from DB:", template.show_line_prices, "type:", typeof template.show_line_prices);
    console.log("show_line_totals from DB:", template.show_line_totals, "type:", typeof template.show_line_totals);
    console.log("show_section_totals from DB:", template.show_section_totals, "type:", typeof template.show_section_totals);
    console.log("show_labour_items from DB:", template.show_labour_items, "type:", typeof template.show_labour_items);
    console.log("show_labour_quantities from DB:", template.show_labour_quantities, "type:", typeof template.show_labour_quantities);
    console.log("show_labour_prices from DB:", template.show_labour_prices, "type:", typeof template.show_labour_prices);
    console.log("show_labour_totals from DB:", template.show_labour_totals, "type:", typeof template.show_labour_totals);
    console.log("show_labour_section_totals from DB:", template.show_labour_section_totals, "type:", typeof template.show_labour_section_totals);
    console.log("show_material_items from DB:", template.show_material_items, "type:", typeof template.show_material_items);
    console.log("show_material_quantities from DB:", template.show_material_quantities, "type:", typeof template.show_material_quantities);
    console.log("show_material_prices from DB:", template.show_material_prices, "type:", typeof template.show_material_prices);
    console.log("show_material_totals from DB:", template.show_material_totals, "type:", typeof template.show_material_totals);
    console.log("show_material_section_totals from DB:", template.show_material_section_totals, "type:", typeof template.show_material_section_totals);
    console.log("Full response object keys:", Object.keys(template));
    
    // Parse sections if it's a string
    if (template.sections && typeof template.sections === 'string') {
      try {
        template.sections = JSON.parse(template.sections);
        console.log("Sections parsed successfully:", template.sections);
      } catch (e) {
        console.warn("Could not parse sections JSON:", e);
        template.sections = [];
      }
    }

    console.log("Sending response with sections:", template.sections);
    res.json(template);
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
    header_background_color,
    border_color,
    border_width,
    table_header_background_color,
    table_header_gradient_color,
    table_header_text_color,
    table_header_style,
    description_background_color,
    description_border_color,
    description_text_color,
    show_company_logo,
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
    console.log("=== CREATE TEMPLATE ===");
    console.log("Template name:", name);
    console.log("Sections received:", sections);
    console.log("Sections type:", typeof sections);
    console.log("Sections is array?", Array.isArray(sections));
    console.log("show_company_logo:", show_company_logo);
    console.log("=== VISIBILITY COLUMNS RECEIVED ===");
    console.log("show_line_items (from request):", show_line_items, "type:", typeof show_line_items);
    console.log("show_line_quantities (from request):", show_line_quantities, "type:", typeof show_line_quantities);
    console.log("show_line_prices (from request):", show_line_prices, "type:", typeof show_line_prices);
    console.log("show_line_totals (from request):", show_line_totals, "type:", typeof show_line_totals);
    console.log("show_section_totals (from request):", show_section_totals, "type:", typeof show_section_totals);
    console.log("show_labour_items (from request):", show_labour_items, "type:", typeof show_labour_items);
    console.log("show_labour_quantities (from request):", show_labour_quantities, "type:", typeof show_labour_quantities);
    console.log("show_labour_prices (from request):", show_labour_prices, "type:", typeof show_labour_prices);
    console.log("show_labour_totals (from request):", show_labour_totals, "type:", typeof show_labour_totals);
    console.log("show_labour_section_totals (from request):", show_labour_section_totals, "type:", typeof show_labour_section_totals);
    console.log("show_material_items (from request):", show_material_items, "type:", typeof show_material_items);
    console.log("show_material_quantities (from request):", show_material_quantities, "type:", typeof show_material_quantities);
    console.log("show_material_prices (from request):", show_material_prices, "type:", typeof show_material_prices);
    console.log("show_material_totals (from request):", show_material_totals, "type:", typeof show_material_totals);
    console.log("show_material_section_totals (from request):", show_material_section_totals, "type:", typeof show_material_section_totals);
    
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
        font_size, indent_customer_address, orientation,
        header_background_color, border_color, border_width,
        table_header_background_color, table_header_gradient_color, table_header_text_color, table_header_style,
        description_background_color, description_border_color, description_text_color,
        show_company_logo,
        document_title,
        show_line_quantities, show_line_prices, show_line_totals, show_section_totals, show_line_items,
        show_labour_quantities, show_labour_prices, show_labour_totals, show_labour_section_totals, show_labour_items,
        show_material_quantities, show_material_prices, show_material_totals, show_material_section_totals, show_material_items,
        default_description, default_footer, sections
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40)
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
        header_background_color,
        border_color,
        border_width,
        table_header_background_color,
        table_header_gradient_color,
        table_header_text_color,
        table_header_style,
        description_background_color,
        description_border_color,
        description_text_color,
        show_company_logo !== undefined ? show_company_logo : true,
        document_title,
        show_line_quantities !== undefined ? show_line_quantities : true,
        show_line_prices !== undefined ? show_line_prices : true,
        show_line_totals !== undefined ? show_line_totals : true,
        show_section_totals !== undefined ? show_section_totals : true,
        show_line_items !== undefined ? show_line_items : true,
        show_labour_quantities !== undefined ? show_labour_quantities : true,
        show_labour_prices !== undefined ? show_labour_prices : true,
        show_labour_totals !== undefined ? show_labour_totals : true,
        show_labour_section_totals !== undefined ? show_labour_section_totals : true,
        show_labour_items !== undefined ? show_labour_items : true,
        show_material_quantities !== undefined ? show_material_quantities : true,
        show_material_prices !== undefined ? show_material_prices : true,
        show_material_totals !== undefined ? show_material_totals : true,
        show_material_section_totals !== undefined ? show_material_section_totals : true,
        show_material_items !== undefined ? show_material_items : true,
        default_description,
        default_footer,
        JSON.stringify(sections || []),
      ]
    );

    const template = result.rows[0];
    console.log("Insert complete. Template ID:", template.id);
    console.log("Template name saved:", template.name);
    console.log("Sections saved in DB (raw):", template.sections);
    console.log("Sections saved type:", typeof template.sections);
    console.log("=== VISIBILITY COLUMNS RETURNED FROM CREATE ===");
    console.log("show_line_items returned:", template.show_line_items, "type:", typeof template.show_line_items);
    console.log("show_line_quantities returned:", template.show_line_quantities, "type:", typeof template.show_line_quantities);
    console.log("show_line_prices returned:", template.show_line_prices, "type:", typeof template.show_line_prices);
    console.log("show_line_totals returned:", template.show_line_totals, "type:", typeof template.show_line_totals);
    console.log("show_section_totals returned:", template.show_section_totals, "type:", typeof template.show_section_totals);
    console.log("show_labour_items returned:", template.show_labour_items, "type:", typeof template.show_labour_items);
    console.log("show_labour_quantities returned:", template.show_labour_quantities, "type:", typeof template.show_labour_quantities);
    console.log("show_labour_prices returned:", template.show_labour_prices, "type:", typeof template.show_labour_prices);
    console.log("show_labour_totals returned:", template.show_labour_totals, "type:", typeof template.show_labour_totals);
    console.log("show_labour_section_totals returned:", template.show_labour_section_totals, "type:", typeof template.show_labour_section_totals);
    console.log("show_material_items returned:", template.show_material_items, "type:", typeof template.show_material_items);
    console.log("show_material_quantities returned:", template.show_material_quantities, "type:", typeof template.show_material_quantities);
    console.log("show_material_prices returned:", template.show_material_prices, "type:", typeof template.show_material_prices);
    console.log("show_material_totals returned:", template.show_material_totals, "type:", typeof template.show_material_totals);
    console.log("show_material_section_totals returned:", template.show_material_section_totals, "type:", typeof template.show_material_section_totals);
    console.log("Full response keys:", Object.keys(template));
    
    // Parse sections if it's a string
    if (template.sections && typeof template.sections === 'string') {
      try {
        template.sections = JSON.parse(template.sections);
        console.log("Sections parsed successfully:", template.sections);
      } catch (e) {
        console.warn("Could not parse sections JSON:", e);
        template.sections = [];
      }
    }

    console.log("Sending response with sections:", template.sections);
    res.status(201).json(template);
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
    header_background_color,
    border_color,
    border_width,
    table_header_background_color,
    table_header_gradient_color,
    table_header_text_color,
    table_header_style,
    description_background_color,
    description_border_color,
    description_text_color,
    show_company_logo,
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
    console.log("=== UPDATE TEMPLATE ===");
    console.log("Template ID:", id);
    console.log("Template name:", name);
    console.log("Sections received:", sections);
    console.log("Sections type:", typeof sections);
    console.log("=== VISIBILITY COLUMNS RECEIVED IN UPDATE ===");
    console.log("show_line_items (from request):", show_line_items, "type:", typeof show_line_items);
    console.log("show_line_quantities (from request):", show_line_quantities, "type:", typeof show_line_quantities);
    console.log("show_line_prices (from request):", show_line_prices, "type:", typeof show_line_prices);
    console.log("show_line_totals (from request):", show_line_totals, "type:", typeof show_line_totals);
    console.log("show_section_totals (from request):", show_section_totals, "type:", typeof show_section_totals);
    console.log("show_labour_items (from request):", show_labour_items, "type:", typeof show_labour_items);
    console.log("show_labour_quantities (from request):", show_labour_quantities, "type:", typeof show_labour_quantities);
    console.log("show_labour_prices (from request):", show_labour_prices, "type:", typeof show_labour_prices);
    console.log("show_labour_totals (from request):", show_labour_totals, "type:", typeof show_labour_totals);
    console.log("show_labour_section_totals (from request):", show_labour_section_totals, "type:", typeof show_labour_section_totals);
    console.log("show_material_items (from request):", show_material_items, "type:", typeof show_material_items);
    console.log("show_material_quantities (from request):", show_material_quantities, "type:", typeof show_material_quantities);
    console.log("show_material_prices (from request):", show_material_prices, "type:", typeof show_material_prices);
    console.log("show_material_totals (from request):", show_material_totals, "type:", typeof show_material_totals);
    console.log("show_material_section_totals (from request):", show_material_section_totals, "type:", typeof show_material_section_totals);
    console.log("Sections is array?", Array.isArray(sections));
    console.log("show_company_logo:", show_company_logo);
    
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
        header_background_color = $10, border_color = $11, border_width = $12,
        table_header_background_color = $13, table_header_gradient_color = $14,
        table_header_text_color = $15, table_header_style = $16,
        description_background_color = $17, description_border_color = $18,
        description_text_color = $19, show_company_logo = $20,
        document_title = $21, show_line_quantities = $22, show_line_prices = $23,
        show_line_totals = $24, show_section_totals = $25, show_line_items = $26,
        show_labour_quantities = $27, show_labour_prices = $28, show_labour_totals = $29,
        show_labour_section_totals = $30, show_labour_items = $31,
        show_material_quantities = $32, show_material_prices = $33, show_material_totals = $34,
        show_material_section_totals = $35, show_material_items = $36,
        default_description = $37, default_footer = $38, sections = $39,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $40
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
        header_background_color,
        border_color,
        border_width,
        table_header_background_color,
        table_header_gradient_color,
        table_header_text_color,
        table_header_style,
        description_background_color,
        description_border_color,
        description_text_color,
        show_company_logo !== undefined ? show_company_logo : true,
        document_title,
        show_line_quantities !== undefined ? show_line_quantities : true,
        show_line_prices !== undefined ? show_line_prices : true,
        show_line_totals !== undefined ? show_line_totals : true,
        show_section_totals !== undefined ? show_section_totals : true,
        show_line_items !== undefined ? show_line_items : true,
        show_labour_quantities !== undefined ? show_labour_quantities : true,
        show_labour_prices !== undefined ? show_labour_prices : true,
        show_labour_totals !== undefined ? show_labour_totals : true,
        show_labour_section_totals !== undefined ? show_labour_section_totals : true,
        show_labour_items !== undefined ? show_labour_items : true,
        show_material_quantities !== undefined ? show_material_quantities : true,
        show_material_prices !== undefined ? show_material_prices : true,
        show_material_totals !== undefined ? show_material_totals : true,
        show_material_section_totals !== undefined ? show_material_section_totals : true,
        show_material_items !== undefined ? show_material_items : true,
        default_description,
        default_footer,
        JSON.stringify(sections || []),
        id,
      ]
    );

    const template = result.rows[0];
    console.log("Update complete. Template ID:", template.id);
    console.log("Template name saved:", template.name);
    console.log("Sections saved in DB (raw):", template.sections);
    console.log("Sections saved type:", typeof template.sections);
    console.log("=== VISIBILITY COLUMNS RETURNED FROM UPDATE ===");
    console.log("show_line_items returned:", template.show_line_items, "type:", typeof template.show_line_items);
    console.log("show_line_quantities returned:", template.show_line_quantities, "type:", typeof template.show_line_quantities);
    console.log("show_line_prices returned:", template.show_line_prices, "type:", typeof template.show_line_prices);
    console.log("show_line_totals returned:", template.show_line_totals, "type:", typeof template.show_line_totals);
    console.log("show_section_totals returned:", template.show_section_totals, "type:", typeof template.show_section_totals);
    console.log("Full response keys:", Object.keys(template));
    
    // Parse sections if it's a string
    if (template.sections && typeof template.sections === 'string') {
      try {
        template.sections = JSON.parse(template.sections);
        console.log("Sections parsed successfully:", template.sections);
      } catch (e) {
        console.warn("Could not parse sections JSON:", e);
        template.sections = [];
      }
    }

    console.log("Sending response with sections:", template.sections);
    res.json(template);
  } catch (error: any) {
    console.error("Error updating template:", error);
    console.error("Error details:", error.message, error.code, error.detail);
    res.status(500).json({ error: "Failed to update template", details: error.message });
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
