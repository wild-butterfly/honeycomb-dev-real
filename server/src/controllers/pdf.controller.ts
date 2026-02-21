// pdf.controller.ts
// PDF generation for invoices

import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db";

interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  cost: number;
  price: number;
  markup: number;
  tax: number;
  discount: number;
  total: number;
}

interface Invoice {
  id: number;
  invoice_number?: string;
  job_id: number;
  company_id?: number;
  job_name?: string;
  customer_id?: number;
  customer_name?: string;
  type?: string;
  delivery_status?: string;
  status?: string;
  subtotal?: number;
  tax_amount?: number;
  total_with_tax?: number;
  amount_paid?: number;
  amount_unpaid?: number;
  created_at?: string;
  due_date?: string;
  notes?: string;
}

interface InvoiceSettings {
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
  iban?: string;
  swift_code?: string;
  payment_terms?: string;
  custom_invoice_notes?: string;
}

/**
 * Generate a PDF invoice
 * GET /api/invoices/:id/pdf
 */
export const generateInvoicePdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch invoice data
    const invoiceResult = await pool.query(
      `SELECT * FROM public.invoices WHERE id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const invoice: Invoice = invoiceResult.rows[0];

    // Fetch invoice line items
    const lineItemsResult = await pool.query(
      `SELECT * FROM public.invoice_line_items WHERE invoice_id = $1 ORDER BY id`,
      [id]
    );

    const lineItems: InvoiceLineItem[] = lineItemsResult.rows;

    // Fetch invoice settings for the company
    let settings: InvoiceSettings = {};
    if (invoice.company_id) {
      const settingsResult = await pool.query(
        `SELECT * FROM public.invoice_settings WHERE company_id = $1`,
        [invoice.company_id]
      );
      if (settingsResult.rows.length > 0) {
        settings = settingsResult.rows[0];
      }
    }

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    // Prepare response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoice.invoice_number || id}.pdf"`
    );

    doc.pipe(res);

    // Colors (Honeycomb theme)
    const primaryColor = "#ffe066";
    const darkColor = "#1a1a1a";
    const lightGray = "#f3f4f6";
    const borderColor = "#e5e7eb";

    // Page width and height
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margins = 50;
    const contentWidth = pageWidth - margins * 2;

    // ===== HEADER SECTION =====
    let yPosition = 50;

    // Company Logo (if available)
    if (settings.company_logo_url) {
      try {
        doc.image(settings.company_logo_url, margins, yPosition, {
          width: 80,
          height: 80,
        });
      } catch (e) {
        // Logo failed to load, continue without it
      }
    }

    // Company name and details (right side)
    const headerRightX = pageWidth - margins - 200;
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text(settings.company_name || "Company", headerRightX, yPosition, {
        width: 200,
        align: "right",
      });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text(settings.company_address || "", headerRightX, yPosition + 35, {
        width: 200,
        align: "right",
      });

    if (settings.company_city || settings.company_state) {
      const cityState =
        [settings.company_city, settings.company_state]
          .filter(Boolean)
          .join(", ") + (settings.company_postal_code ? ` ${settings.company_postal_code}` : "");
      doc.text(cityState, headerRightX, yPosition + 48, {
        width: 200,
        align: "right",
      });
    }

    if (settings.company_phone || settings.company_email) {
      doc.text(settings.company_phone || "", headerRightX, yPosition + 61, {
        width: 200,
        align: "right",
      });
      doc.text(settings.company_email || "", headerRightX, yPosition + 74, {
        width: 200,
        align: "right",
      });
    }

    yPosition += 110;

    // ===== INVOICE TITLE & INFO =====
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("INVOICE", margins, yPosition);

    yPosition += 35;

    // Invoice details grid
    const detailsColWidth = contentWidth / 2;

    // Left column
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("Invoice #", margins, yPosition);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(invoice.invoice_number || id, margins, yPosition + 16);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("Date", margins, yPosition + 32);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "N/A",
        margins,
        yPosition + 48
      );

    // Right column
    const rightColX = margins + detailsColWidth;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("Due Date", rightColX, yPosition);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A",
        rightColX,
        yPosition + 16
      );

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("Status", rightColX, yPosition + 32);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        invoice.status ? invoice.status.toUpperCase() : "PENDING",
        rightColX,
        yPosition + 48
      );

    yPosition += 80;

    // ===== BILL TO SECTION =====
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("BILL TO:", margins, yPosition);

    yPosition += 20;

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#333")
      .text(invoice.customer_name || "Customer", margins, yPosition);

    yPosition += 20;

    // ===== HORIZONTAL LINE =====
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(margins, yPosition)
      .lineTo(pageWidth - margins, yPosition)
      .stroke();

    yPosition += 20;

    // ===== LINE ITEMS TABLE =====
    const tableTop = yPosition;
    const colWidths = {
      description: contentWidth * 0.4,
      quantity: contentWidth * 0.15,
      price: contentWidth * 0.15,
      total: contentWidth * 0.3,
    };

    // Table header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("white")
      .rect(margins, tableTop, contentWidth, 25)
      .fill(primaryColor);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("Description", margins + 5, tableTop + 7, {
        width: colWidths.description - 10,
      })
      .text("Qty", margins + colWidths.description + 5, tableTop + 7, {
        width: colWidths.quantity - 10,
        align: "right",
      })
      .text("Price", margins + colWidths.description + colWidths.quantity + 5, tableTop + 7, {
        width: colWidths.price - 10,
        align: "right",
      })
      .text(
        "Total",
        margins + colWidths.description + colWidths.quantity + colWidths.price + 5,
        tableTop + 7,
        {
          width: colWidths.total - 10,
          align: "right",
        }
      );

    yPosition = tableTop + 30;

    // Table rows
    lineItems.forEach((item, index) => {
      const rowHeight = 25;
      const isAlternate = index % 2 === 1;

      // Alternate row background
      if (isAlternate) {
        doc
          .rect(margins, yPosition - 5, contentWidth, rowHeight)
          .fill(lightGray);
      }

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333")
        .text(item.name || item.description || "", margins + 5, yPosition, {
          width: colWidths.description - 10,
        })
        .text(item.quantity.toString(), margins + colWidths.description + 5, yPosition, {
          width: colWidths.quantity - 10,
          align: "right",
        })
        .text(`$${item.price.toFixed(2)}`, margins + colWidths.description + colWidths.quantity + 5, yPosition, {
          width: colWidths.price - 10,
          align: "right",
        })
        .text(`$${item.total.toFixed(2)}`, margins + colWidths.description + colWidths.quantity + colWidths.price + 5, yPosition, {
          width: colWidths.total - 10,
          align: "right",
        });

      yPosition += rowHeight;
    });

    yPosition += 10;

    // ===== TOTALS SECTION =====
    const totalsX = margins + contentWidth - 180;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text("Subtotal:", totalsX, yPosition)
      .text(
        `$${(invoice.subtotal || 0).toFixed(2)}`,
        totalsX + 100,
        yPosition,
        { align: "right", width: 70 }
      );

    yPosition += 20;

    doc
      .text("Tax:", totalsX, yPosition)
      .text(
        `$${(invoice.tax_amount || 0).toFixed(2)}`,
        totalsX + 100,
        yPosition,
        { align: "right", width: 70 }
      );

    yPosition += 20;

    // Total box
    doc
      .rect(totalsX, yPosition - 5, 180, 30)
      .fillAndStroke(primaryColor, primaryColor);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("TOTAL:", totalsX + 10, yPosition + 6)
      .text(
        `$${(invoice.total_with_tax || 0).toFixed(2)}`,
        totalsX + 100,
        yPosition + 6,
        { align: "right", width: 70 }
      );

    yPosition += 40;

    // ===== PAYMENT TERMS & NOTES =====
    if (settings.payment_terms) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text("Payment Terms:", margins, yPosition);

      yPosition += 16;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666")
        .text(settings.payment_terms, margins, yPosition, {
          width: contentWidth,
        });

      yPosition += 30;
    }

    if (invoice.notes) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text("Notes:", margins, yPosition);

      yPosition += 16;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666")
        .text(invoice.notes, margins, yPosition, {
          width: contentWidth,
        });

      yPosition += 30;
    }

    if (settings.custom_invoice_notes) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666")
        .text(settings.custom_invoice_notes, margins, yPosition, {
          width: contentWidth,
        });

      yPosition += 30;
    }

    // ===== FOOTER WITH BANK DETAILS =====
    if (
      settings.bank_name ||
      settings.bank_account_number ||
      settings.iban
    ) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text("Bank Details:", margins, pageHeight - 80);

      let bankY = pageHeight - 65;

      if (settings.bank_name) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#666")
          .text(`Bank: ${settings.bank_name}`, margins, bankY);
        bankY += 12;
      }

      if (settings.bank_account_number) {
        doc.text(`Account: ${settings.bank_account_number}`, margins, bankY);
        bankY += 12;
      }

      if (settings.iban) {
        doc.text(`IBAN: ${settings.iban}`, margins, bankY);
        bankY += 12;
      }

      if (settings.swift_code) {
        doc.text(`SWIFT: ${settings.swift_code}`, margins, bankY);
      }
    }

    // Finalize PDF
    doc.end();
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: error.message });
  }
};
