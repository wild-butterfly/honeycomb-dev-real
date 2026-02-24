// pdf.controller.ts
// Production-grade PDF generation for invoices

import { Request, Response } from "express";
import { pool } from "../db";
import { renderInvoicePdf } from "../utils/pdfRenderer";

/**
 * Generate a PDF invoice with full data context
 * GET /api/invoices/:id/pdf
 */
export const generateInvoicePdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const invoiceId = req.params.id;

    console.log(`📥 Downloading invoice PDF: ${invoiceId}`);

    // ===== LOAD INVOICE =====
    const invoiceResult = await pool.query(
      "SELECT * FROM invoices WHERE id = $1",
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const invoice = invoiceResult.rows[0];
    console.log("✅ Invoice fetched (ID", invoice.id, ", Company ID", invoice.company_id, ")");

    // Ensure invoice amounts are numbers
    invoice.subtotal = Number(invoice.subtotal) || 0;
    invoice.tax_amount = Number(invoice.tax_amount) || 0;
    invoice.total_with_tax = Number(invoice.total_with_tax) || 0;

    // ===== LOAD CUSTOMER DATA =====
    console.log("📥 Loading customer data...");
    let customer: any = {};
    if (invoice.customer_id) {
      try {
        const customerResult = await pool.query(
          "SELECT id, name, email, phone, address, suburb, state, postcode FROM customers WHERE id = $1",
          [invoice.customer_id]
        );
        if (customerResult.rows.length > 0) {
          customer = customerResult.rows[0];
          console.log("✅ Customer fetched:", customer.name);
          // Inject customer name into invoice for PDF rendering
          invoice.customer_name = customer.name;
          invoice.customer_email = customer.email;
          invoice.customer_phone = customer.phone;
          invoice.customer_address = customer.address;
          invoice.customer_suburb = customer.suburb;
          invoice.customer_state = customer.state;
          invoice.customer_postcode = customer.postcode;
        }
      } catch (err) {
        console.warn("⚠️  Could not load customer data:", err);
      }
    }

    // ===== LOAD JOB DATA =====
    console.log("📥 Loading job data...");
    let job: any = {};
    if (invoice.job_id) {
      try {
        const jobResult = await pool.query(
          "SELECT id, title, description, location, site_address, suburb, state, postcode FROM jobs WHERE id = $1",
          [invoice.job_id]
        );
        if (jobResult.rows.length > 0) {
          job = jobResult.rows[0];
          console.log("✅ Job fetched (ID", job.id, ", Title", job.title, ")");
          // Inject job info into invoice for PDF rendering
          invoice.job_name = job.title;
          invoice.job_location = job.location;
          invoice.job_site_address = job.site_address;
          invoice.job_suburb = job.suburb;
          invoice.job_state = job.state;
          invoice.job_postcode = job.postcode;
        }
      } catch (err) {
        console.warn("⚠️  Could not load job data:", err);
      }
    }

    // ===== LOAD LINE ITEMS =====
    const itemsResult = await pool.query(
      "SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC",
      [invoiceId]
    );
    console.log("✅ Line items fetched:", itemsResult.rows.length);

    const lineItems = itemsResult.rows.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
      total: Number(item.total) || 0,
      category: item.category || "labour",
    }));

    // ===== LOAD LABOUR ENTRIES (from job) =====
    const hasLabourLineItems = lineItems.some((item: any) => {
      const category = String(item.category || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      return category === "labour" || name.startsWith("labour");
    });

    console.log("📥 Loading labour entries...");
    let labourItems: any[] = [];
    if (invoice.job_id && !hasLabourLineItems) {
      try {
        const labourResult = await pool.query(
          `SELECT 
            le.id,
            e.name AS employee_name,
            le.chargeable_hours::float AS chargeable_hours,
            le.rate::float AS rate,
            le.total::float AS total,
            le.notes AS description
          FROM labour_entries le
          JOIN employees e ON e.id = le.employee_id
          WHERE le.job_id = $1
          ORDER BY le.created_at ASC`,
          [invoice.job_id]
        );
        
        labourItems = labourResult.rows.map((entry: any, idx: number) => ({
          id: `labour-${entry.id || idx}`,
          name: `Labour - ${entry.employee_name || "Unknown"}`,
          description: entry.description || "",
          quantity: Number(entry.chargeable_hours) || 0,
          price: Number(entry.rate) || 0,
          total: Number(entry.total) || 0,
          category: "labour",
        }));
        console.log("✅ Labour entries fetched:", labourItems.length);
      } catch (err) {
        console.warn("⚠️  Could not load labour entries:", (err as Error).message);
      }
    } else if (hasLabourLineItems) {
      console.log("ℹ️  Skipping labour entries load (labour line items already present)");
    }

    // ===== MERGE LINE ITEMS + LABOUR ENTRIES =====
    const allLineItems = [...lineItems, ...labourItems];
    console.log("📊 Total items for PDF (line items + labour):", allLineItems.length);

    // ===== LOAD TEMPLATE =====
    let template: any = null;
    if (invoice.template_id) {
      const templateResult = await pool.query(
        "SELECT * FROM invoice_templates WHERE id = $1",
        [invoice.template_id]
      );
      if (templateResult.rows.length > 0) {
        template = templateResult.rows[0];
        console.log("✅ Template fetched");
      }
    }

    // Parse sections if they exist
    if (template?.sections && typeof template.sections === "string") {
      try {
        template.parsedSections = JSON.parse(template.sections);
        console.log("✅ Template sections parsed:", template.parsedSections.length);
      } catch (err) {
        console.error("❌ Error parsing sections:", err);
        template.parsedSections = [];
      }
    } else if (template?.sections) {
      template.parsedSections = template.sections;
    } else {
      template.parsedSections = [];
    }

    // ===== LOAD COMPANY SETTINGS =====
    console.log("📥 Loading company settings...");
    const settingsResult = await pool.query(
      "SELECT * FROM invoice_settings WHERE company_id = $1",
      [invoice.company_id]
    );

    let settings = settingsResult.rows[0] || {};

    // ===== LOAD COMPANY DATA =====
    console.log("📥 Loading company data...");
    const companyResult = await pool.query(
      `SELECT * FROM companies WHERE id = $1`,
      [invoice.company_id]
    );

    const company = companyResult.rows[0] || {};

    // Merge settings and company data - settings takes precedence, company is fallback
    const companyData = {
      company_name: settings.company_name || company.name || "Company",
      company_address: settings.company_address || company.address || "",
      company_suburb: settings.company_suburb || company.suburb || "",
      company_city: settings.company_city || company.city || "",
      company_state: settings.company_state || company.state || "",
      company_postcode: settings.company_postcode || company.postcode || "",
      company_email: settings.company_email || company.email || "",
      company_phone: settings.company_phone || company.phone || "",
      gst_number: settings.gst_number || company.gst_number || "",
      logo_url: settings.logo_url || company.logo_url || "",
      bank_name: settings.bank_name || company.bank_name || "",
    };

    console.log("📊 PDF Data Ready:");
    console.log("   - Invoice:", invoice.invoice_number);
    console.log("   - Line items:", lineItems.length);
    console.log("   - Template sections:", template?.parsedSections?.length || 0);
    console.log("   - Company:", companyData.company_name);

    console.log("\n✅ All data loaded successfully");
    console.log("   - Invoice amount:", invoice.subtotal);
    console.log("   - Template exists:", !!template);
    console.log("   - Company name:", companyData.company_name);
    console.log("   - Customer name:", customer.name);
    console.log("   - Job name:", job.name);

    console.log("\n🎨 Calling renderInvoicePdf...");

    // Use production PDF renderer
    try {
      await renderInvoicePdf({
        invoice,
        lineItems: allLineItems,
        template: template || {},
        settings: companyData || {},
        company: companyData || {},
        customer: customer || {},
        job: job || {},
        res,
      });
      console.log("✅ PDF rendering completed");
    } catch (pdfErr) {
      console.error("❌ PDF Rendering Error:", pdfErr);
      console.error("   Error type:", (pdfErr as Error).constructor.name);
      console.error("   Error message:", (pdfErr as Error).message);
      if (!res.headersSent) {
        res.status(500).json({
          error: "PDF rendering failed",
          details: (pdfErr as Error).message,
        });
      }
    }
  } catch (err) {
    console.error("❌ Invoice PDF Download Error:", err);
    console.error("   Error type:", (err as Error).constructor.name);
    console.error("   Error message:", (err as Error).message);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate PDF",
        details: (err as Error).message,
      });
    }
  }
};
