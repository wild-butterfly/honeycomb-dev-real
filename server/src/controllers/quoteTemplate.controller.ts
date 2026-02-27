import { Request, Response } from "express";
import { pool } from "../db";
import { renderInvoicePdf } from "../utils/pdfRenderer";

// All logic is duplicated from invoiceTemplate.controller.ts but uses quote_templates table

let quoteTemplateStyleColumnsEnsured = false;
const ensureQuoteTemplateStyleColumns = async () => {
  if (quoteTemplateStyleColumnsEnsured) return;

  await pool.query(`
    ALTER TABLE IF EXISTS quote_templates
    ADD COLUMN IF NOT EXISTS highlight_color VARCHAR(7) DEFAULT '#fafafa',
    ADD COLUMN IF NOT EXISTS header_background_color VARCHAR(7) DEFAULT '#ffffff',
    ADD COLUMN IF NOT EXISTS border_color VARCHAR(7) DEFAULT '#fbbf24',
    ADD COLUMN IF NOT EXISTS border_width VARCHAR(3) DEFAULT '1px',
    ADD COLUMN IF NOT EXISTS table_header_background_color VARCHAR(7) DEFAULT '#fbbf24',
    ADD COLUMN IF NOT EXISTS table_header_gradient_color VARCHAR(7) DEFAULT '#f59e0b',
    ADD COLUMN IF NOT EXISTS table_header_text_color VARCHAR(7) DEFAULT '#ffffff',
    ADD COLUMN IF NOT EXISTS table_header_style VARCHAR(10) DEFAULT 'solid',
    ADD COLUMN IF NOT EXISTS description_background_color VARCHAR(7) DEFAULT '#fafafa',
    ADD COLUMN IF NOT EXISTS description_border_color VARCHAR(7) DEFAULT '#fbbf24',
    ADD COLUMN IF NOT EXISTS description_text_color VARCHAR(7) DEFAULT '#374151',
    ADD COLUMN IF NOT EXISTS show_company_logo BOOLEAN DEFAULT true;
  `);

  quoteTemplateStyleColumnsEnsured = true;
};

const getQuoteTemplateColumns = async (): Promise<Set<string>> => {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'quote_templates'`
  );
  return new Set(result.rows.map((row: any) => row.column_name));
};

export const getCompanyQuoteTemplates = async (req: Request, res: Response) => {
  const { companyId } = req.params;
  try {
    await ensureQuoteTemplateStyleColumns();
    const result = await pool.query(
      `SELECT * FROM quote_templates WHERE company_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [companyId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch quote templates", details: error.message });
  }
};

export const getQuoteTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await ensureQuoteTemplateStyleColumns();
    const result = await pool.query(
      `SELECT * FROM quote_templates WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quote template not found" });
    }
    const template = result.rows[0];
    if (template.sections && typeof template.sections === 'string') {
      try { template.sections = JSON.parse(template.sections); } catch { template.sections = []; }
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch quote template" });
  }
};

export const createQuoteTemplate = async (req: Request, res: Response) => {
  const body = req.body;
  let sectionsToSave = [];
  if (Array.isArray(body.sections)) sectionsToSave = body.sections;
  else if (typeof body.sections === 'string') {
    try { sectionsToSave = JSON.parse(body.sections); } catch { sectionsToSave = []; }
  }
  else if (!body.sections) sectionsToSave = [];
  if (body.is_default) {
    await pool.query(`UPDATE quote_templates SET is_default = false WHERE company_id = $1`, [body.company_id]);
  }
  try {
    await ensureQuoteTemplateStyleColumns();
    const columns = await getQuoteTemplateColumns();
    const insertColumns: string[] = [
      "company_id",
      "name",
      "is_default",
      "status",
      "main_color",
      "accent_color",
      "text_color",
      "font_size",
      "indent_customer_address",
      "orientation",
      "document_title",
      "show_line_quantities",
      "show_line_prices",
      "show_line_totals",
      "show_section_totals",
      "show_line_items",
      "show_labour_quantities",
      "show_labour_prices",
      "show_labour_totals",
      "show_labour_section_totals",
      "show_labour_items",
      "show_material_quantities",
      "show_material_prices",
      "show_material_totals",
      "show_material_section_totals",
      "show_material_items",
      "default_description",
      "default_footer",
      "sections",
    ];

    const values: any[] = [
      body.company_id,
      body.name || "Quote Template",
      body.is_default || false,
      body.status || "active",
      body.main_color || "#fbbf24",
      body.accent_color || "#ffffff",
      body.text_color || "#1f2937",
      body.font_size || "medium",
      body.indent_customer_address || false,
      body.orientation || "portrait",
      body.document_title || "Quote",
      body.show_line_quantities !== undefined ? body.show_line_quantities : true,
      body.show_line_prices !== undefined ? body.show_line_prices : true,
      body.show_line_totals !== undefined ? body.show_line_totals : true,
      body.show_section_totals !== undefined ? body.show_section_totals : true,
      body.show_line_items !== undefined ? body.show_line_items : true,
      body.show_labour_quantities !== undefined ? body.show_labour_quantities : true,
      body.show_labour_prices !== undefined ? body.show_labour_prices : true,
      body.show_labour_totals !== undefined ? body.show_labour_totals : true,
      body.show_labour_section_totals !== undefined ? body.show_labour_section_totals : true,
      body.show_labour_items !== undefined ? body.show_labour_items : true,
      body.show_material_quantities !== undefined ? body.show_material_quantities : true,
      body.show_material_prices !== undefined ? body.show_material_prices : true,
      body.show_material_totals !== undefined ? body.show_material_totals : true,
      body.show_material_section_totals !== undefined ? body.show_material_section_totals : true,
      body.show_material_items !== undefined ? body.show_material_items : true,
      body.default_description,
      body.default_footer,
      JSON.stringify(sectionsToSave),
    ];

    const addOptionalColumn = (column: string, value: any) => {
      if (columns.has(column)) {
        insertColumns.push(column);
        values.push(value);
      }
    };

    addOptionalColumn("highlight_color", body.highlight_color || "#fafafa");
    addOptionalColumn("header_background_color", body.header_background_color || "#ffffff");
    addOptionalColumn("border_color", body.border_color || body.main_color || "#fbbf24");
    addOptionalColumn("border_width", body.border_width || "1px");
    addOptionalColumn(
      "table_header_background_color",
      body.table_header_background_color || body.main_color || "#fbbf24"
    );
    addOptionalColumn(
      "table_header_gradient_color",
      body.table_header_gradient_color || body.main_color || "#f59e0b"
    );
    addOptionalColumn("table_header_text_color", body.table_header_text_color || "#ffffff");
    addOptionalColumn("description_background_color", body.description_background_color || "#fafafa");
    addOptionalColumn(
      "description_border_color",
      body.description_border_color || body.border_color || body.main_color || "#fbbf24"
    );
    addOptionalColumn("description_text_color", body.description_text_color || "#374151");
    addOptionalColumn("table_header_style", body.table_header_style || "solid");
    addOptionalColumn(
      "show_company_logo",
      body.show_company_logo !== undefined ? body.show_company_logo : true
    );

    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(",");
    const result = await pool.query(
      `INSERT INTO quote_templates (${insertColumns.join(",")})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );
    let template = result.rows[0];
    if (template.sections && typeof template.sections === 'string') {
      try { template.sections = JSON.parse(template.sections); } catch { template.sections = []; }
    }
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create quote template" });
  }
};

export const updateQuoteTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  let sectionsToSave = [];
  if (Array.isArray(body.sections)) sectionsToSave = body.sections;
  else if (typeof body.sections === 'string') {
    try { sectionsToSave = JSON.parse(body.sections); } catch { sectionsToSave = []; }
  }
  else if (!body.sections) sectionsToSave = [];
  await ensureQuoteTemplateStyleColumns();
  const templateResult = await pool.query(`SELECT * FROM quote_templates WHERE id = $1`, [id]);
  if (templateResult.rows.length === 0) return res.status(404).json({ error: "Quote template not found" });
  const existing = templateResult.rows[0];
  const company_id = existing.company_id;
  if (body.is_default) {
    await pool.query(`UPDATE quote_templates SET is_default = false WHERE company_id = $1 AND id != $2`, [company_id, id]);
  }
  try {
    const columns = await getQuoteTemplateColumns();
    const merged = { ...existing, ...body };
    const setParts: string[] = [];
    const values: any[] = [];

    const addSet = (column: string, value: any) => {
      if (!columns.has(column)) return;
      values.push(value);
      setParts.push(`${column} = $${values.length}`);
    };

    addSet("name", merged.name || "Quote Template");
    addSet("is_default", merged.is_default ?? false);
    addSet("status", merged.status || "active");
    addSet("main_color", merged.main_color || "#fbbf24");
    addSet("accent_color", merged.accent_color || "#ffffff");
    addSet("text_color", merged.text_color || "#1f2937");
    addSet("font_size", merged.font_size || "medium");
    addSet("indent_customer_address", merged.indent_customer_address || false);
    addSet("orientation", merged.orientation || "portrait");
    addSet("document_title", merged.document_title || "Quote");
    addSet("show_line_quantities", merged.show_line_quantities ?? true);
    addSet("show_line_prices", merged.show_line_prices ?? true);
    addSet("show_line_totals", merged.show_line_totals ?? true);
    addSet("show_section_totals", merged.show_section_totals ?? true);
    addSet("show_line_items", merged.show_line_items ?? true);
    addSet("show_labour_quantities", merged.show_labour_quantities ?? true);
    addSet("show_labour_prices", merged.show_labour_prices ?? true);
    addSet("show_labour_totals", merged.show_labour_totals ?? true);
    addSet("show_labour_section_totals", merged.show_labour_section_totals ?? true);
    addSet("show_labour_items", merged.show_labour_items ?? true);
    addSet("show_material_quantities", merged.show_material_quantities ?? true);
    addSet("show_material_prices", merged.show_material_prices ?? true);
    addSet("show_material_totals", merged.show_material_totals ?? true);
    addSet("show_material_section_totals", merged.show_material_section_totals ?? true);
    addSet("show_material_items", merged.show_material_items ?? true);
    addSet("default_description", merged.default_description ?? null);
    addSet("default_footer", merged.default_footer ?? null);
    let mergedSections: any[] = sectionsToSave;
    if (Array.isArray(merged.sections)) {
      mergedSections = merged.sections;
    } else if (typeof merged.sections === "string") {
      try {
        mergedSections = JSON.parse(merged.sections || "[]");
      } catch {
        mergedSections = sectionsToSave;
      }
    }
    addSet("sections", JSON.stringify(mergedSections));
    addSet("highlight_color", merged.highlight_color || "#fafafa");
    addSet("header_background_color", merged.header_background_color || "#ffffff");
    addSet("border_color", merged.border_color || merged.main_color || "#fbbf24");
    addSet("border_width", merged.border_width || "1px");
    addSet(
      "table_header_background_color",
      merged.table_header_background_color || merged.main_color || "#fbbf24"
    );
    addSet(
      "table_header_gradient_color",
      merged.table_header_gradient_color || merged.main_color || "#f59e0b"
    );
    addSet("table_header_text_color", merged.table_header_text_color || "#ffffff");
    addSet("description_background_color", merged.description_background_color || "#fafafa");
    addSet(
      "description_border_color",
      merged.description_border_color || merged.border_color || merged.main_color || "#fbbf24"
    );
    addSet("description_text_color", merged.description_text_color || "#374151");
    addSet("table_header_style", merged.table_header_style || "solid");
    addSet("show_company_logo", merged.show_company_logo ?? true);

    values.push(id);
    const idParam = `$${values.length}`;
    const result = await pool.query(
      `UPDATE quote_templates SET
        ${setParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ${idParam} RETURNING *`,
      values
    );
    let template = result.rows[0];
    if (template.sections && typeof template.sections === 'string') {
      try { template.sections = JSON.parse(template.sections); } catch { template.sections = []; }
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update quote template" });
  }
};

export const deleteQuoteTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM quote_templates WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quote template not found" });
    }
    res.json({ message: "Quote template deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete quote template" });
  }
};

export const previewQuoteTemplatePdf = async (req: Request, res: Response) => {
  try {
    const { template, company } = req.body || {};
    if (!template) {
      return res.status(400).json({ error: "Template data is required" });
    }
    const toNumber = (value: any, fallback = 0) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    };

    const sections =
      typeof template.sections === "string"
        ? (() => {
            try {
              return JSON.parse(template.sections);
            } catch {
              return [];
            }
          })()
        : Array.isArray(template.sections)
          ? template.sections
          : [];

    const sectionItems = sections.flatMap((section: any) => {
      const items = Array.isArray(section?.items) ? section.items : [];
      return items.map((item: any) => {
        const quantity = toNumber(item?.quantity, 1);
        const price = toNumber(item?.price, 0);
        const providedTotal = toNumber(item?.total, quantity * price);
        return {
          name: item?.name || item?.description || section?.name || "Line Item",
          description: item?.description || "",
          quantity,
          price,
          total: providedTotal,
        };
      });
    });

    const previewLineItems =
      sectionItems.length > 0
        ? sectionItems
        : [
            { name: "Service Callout", description: "Standard service callout", quantity: 1, price: 120, total: 120 },
            { name: "Labour", description: "2 hours", quantity: 2, price: 95, total: 190 },
            { name: "Materials", description: "Parts and fittings", quantity: 1, price: 75, total: 75 },
          ];

    const previewSubtotal = previewLineItems.reduce(
      (sum: number, item: any) => sum + toNumber(item.total, 0),
      0
    );
    const previewTax = previewSubtotal * 0.1;
    const previewTotal = previewSubtotal + previewTax;

    const settings = {
      business_name: company?.business_name || "Your Company",
      company_name: company?.business_name || "Your Company",
      company_address: company?.company_address || "5a Harmeet Close",
      company_suburb: company?.company_suburb || "",
      company_city: company?.company_city || "Mulgrave",
      company_state: company?.company_state || "VIC",
      company_postcode: company?.company_postal_code || "3170",
      company_postal_code: company?.company_postal_code || "3170",
      company_email: company?.company_email || "info@company.com",
      company_phone: company?.company_phone || "1300 303 750",
      abn: company?.abn || "",
      gst_number: company?.abn || "",
      logo_url: company?.logo_url || "",
      bank_name: "Demo Bank",
      bsb: "013 231",
      bank_account: "1078 53001",
    };

    // Use the same PDF rendering logic as invoices
    await renderInvoicePdf({
      invoice: {
        invoice_number: "QUOTE-DRAFT",
        created_at: new Date().toISOString(),
        due_date: new Date().toISOString(),
        status: "draft",
        subtotal: previewSubtotal,
        tax_amount: previewTax,
        total_with_tax: previewTotal,
      },
      lineItems: previewLineItems,
      template: {
        ...template,
        document_type: "quote",
      },
      settings,
      company: settings,
      customer: { name: "Sample Customer" },
      job: { job_number: "JOB-QUOTE" },
      res,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate preview PDF" });
  }
};
