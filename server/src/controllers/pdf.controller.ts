// pdf.controller.ts
// PDF generation for invoices

import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db";
import * as path from "path";

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

    // Convert invoice numeric fields from string to number
    let invoice: Invoice = invoiceResult.rows[0];
    invoice = {
      ...invoice,
      subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal,
      tax_amount: typeof invoice.tax_amount === 'string' ? parseFloat(invoice.tax_amount) : invoice.tax_amount,
      total_with_tax: typeof invoice.total_with_tax === 'string' ? parseFloat(invoice.total_with_tax) : invoice.total_with_tax,
      amount_paid: typeof invoice.amount_paid === 'string' ? parseFloat(invoice.amount_paid) : invoice.amount_paid,
      amount_unpaid: typeof invoice.amount_unpaid === 'string' ? parseFloat(invoice.amount_unpaid) : invoice.amount_unpaid,
    };

    // Fetch invoice line items
    const lineItemsResult = await pool.query(
      `SELECT * FROM public.invoice_line_items WHERE invoice_id = $1 ORDER BY id`,
      [id]
    );

    // Convert string values to numbers
    const lineItems: InvoiceLineItem[] = lineItemsResult.rows.map((item: any) => ({
      ...item,
      quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
      cost: typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      markup: typeof item.markup === 'string' ? parseFloat(item.markup) : item.markup,
      tax: typeof item.tax === 'string' ? parseFloat(item.tax) : item.tax,
      discount: typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount,
      total: typeof item.total === 'string' ? parseFloat(item.total) : item.total,
    }));

    // Fetch invoice settings for the company
    let settings: InvoiceSettings = {};
    let template: any = null;
    let company: any = null;
    
    if (invoice.company_id) {
      // First try to get the default invoice template
      const templateResult = await pool.query(
        `SELECT * FROM public.invoice_templates WHERE company_id = $1 AND is_default = true ORDER BY created_at DESC LIMIT 1`,
        [invoice.company_id]
      );
      
      if (templateResult.rows.length > 0) {
        template = templateResult.rows[0];
        console.log("✅ Using invoice template for PDF generation:", template.name);
        console.log("   - show_company_logo:", template.show_company_logo);
        console.log("   - table_header_background_color:", template.table_header_background_color);
        console.log("   - show_line_items:", template.show_line_items);
        
        // Parse template sections if they exist
        if (template.sections) {
          try {
            const templateSections = typeof template.sections === 'string' 
              ? JSON.parse(template.sections)
              : template.sections;
            console.log(`📋 Template has ${templateSections.length} custom sections`);
            // Store parsed sections in template for later use
            template.parsedSections = templateSections;
          } catch (parseError) {
            console.error("❌ Error parsing template sections:", parseError);
            template.parsedSections = [];
          }
        } else {
          console.log("ℹ️  Template has no custom sections, will use invoice line items");
          template.parsedSections = [];
        }
      } else {
        console.log("⚠️  No default template found for company_id:", invoice.company_id);
      }
      
      // Fetch company details (including logo)
      const companyResult = await pool.query(
        `SELECT id, name, logo_url FROM public.companies WHERE id = $1`,
        [invoice.company_id]
      );
      if (companyResult.rows.length > 0) {
        company = companyResult.rows[0];
        console.log("✅ Loaded company:", company.name, "Logo URL:", company.logo_url);
      }
      
      // Also fetch legacy invoice settings for company info (as fallback)
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

    // Colors (Use template colors if available, otherwise default to Honeycomb theme)
    const primaryColor = template?.table_header_background_color || "#ffe066";
    const darkColor = template?.text_color || "#1a1a1a";
    const lightGray = "#f3f4f6";
    const borderColor = template?.border_color || "#e5e7eb";
    const headerBgColor = template?.header_background_color || "#fffef7";
    const tableHeaderTextColor = template?.table_header_text_color || "#ffffff";
    const descBgColor = template?.description_background_color || "#fffef7";
    const descBorderColor = template?.description_border_color || "#fbbf24";
    const descTextColor = template?.description_text_color || "#374151";

    // Page width and height
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margins = 50;
    const contentWidth = pageWidth - margins * 2;

    // ===== HEADER SECTION =====
    let yPosition = 50;

    // Company Logo (if available and enabled in template)
    const showLogo = template?.show_company_logo !== false; // Default to true if template not specified
    const logoUrl = company?.logo_url || settings?.company_logo_url; // Try company logo first, then settings
    
    if (showLogo && logoUrl) {
      try {
        // Convert relative path to absolute path for PDFKit
        // logoUrl is like: /uploads/logos/logo-1771747130895-5lq3ph.png
        // Need to convert to: C:/...server/uploads/logos/logo-1771747130895-5lq3ph.png
        const logoPath = logoUrl.startsWith('/') 
          ? path.join(__dirname, '..', '..', logoUrl)
          : logoUrl;
        
        console.log("📸 Rendering company logo from:", company?.logo_url ? "companies table" : "invoice_settings");
        console.log("   Logo URL:", logoUrl);
        console.log("   Logo absolute path:", logoPath);
        doc.image(logoPath, margins, yPosition, {
          width: 80,
          height: 80,
        });
      } catch (e) {
        console.warn("⚠️  Failed to load logo:", (e as Error).message);
        // Logo failed to load, continue without it
      }
    } else {
      console.log("ℹ️  Logo not rendered - showLogo:", showLogo, "logoUrl:", !!logoUrl);
    }

    // Company name and details (right side) - use company name, address from settings
    const companyName = company?.name || settings?.company_name || "Company";
    const companyAddress = settings?.company_address || "";
    const companyCity = settings?.company_city || "";
    const companyPhone = settings?.company_phone || "";
    const companyEmail = settings?.company_email || "";
    
    const headerRightX = pageWidth - margins - 200;
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text(companyName, headerRightX, yPosition, {
        width: 200,
        align: "right",
      });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text(companyAddress, headerRightX, yPosition + 35, {
        width: 200,
        align: "right",
      });

    if (companyCity) {
      const cityState =
        [companyCity, settings?.company_state]
          .filter(Boolean)
          .join(", ") + (settings?.company_postal_code ? ` ${settings.company_postal_code}` : "");
      doc.text(cityState, headerRightX, yPosition + 48, {
        width: 200,
        align: "right",
      });
    }

    if (companyPhone || companyEmail) {
      doc.text(companyPhone, headerRightX, yPosition + 61, {
        width: 200,
        align: "right",
      });
      doc.text(companyEmail, headerRightX, yPosition + 74, {
        width: 200,
        align: "right",
      });
    }

    yPosition += 110;

    // ===== Query for customer and job details =====
    let customer: any = null;
    let job: any = null;
    
    if (invoice.customer_id) {
      try {
        const customerResult = await pool.query(
          `SELECT * FROM public.customers WHERE id = $1`,
          [invoice.customer_id]
        );
        if (customerResult.rows.length > 0) {
          customer = customerResult.rows[0];
          console.log("✅ Loaded customer:", customer.name);
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    }

    if (invoice.job_id) {
      try {
        const jobResult = await pool.query(
          `SELECT * FROM public.jobs WHERE id = $1`,
          [invoice.job_id]
        );
        if (jobResult.rows.length > 0) {
          job = jobResult.rows[0];
          console.log("✅ Loaded job:", job.job_number);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      }
    }

    // === BILL TO, SITE ADDRESS, AND INVOICE INFO GRID ===
    const gridStartY = yPosition;
    const col1X = margins;
    const col2X = margins + (contentWidth / 3);
    const col3X = margins + (contentWidth * 2 / 3);
    
    // Column 1: BILL TO / Customer Info
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("BILL TO:", col1X, gridStartY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333");
    
    let billToY = gridStartY + 18;
    if (customer) {
      if (customer.name || invoice.customer_name) {
        doc.text(customer.name || invoice.customer_name, col1X, billToY);
        billToY += 14;
      }
      if (customer.address) {
        doc.text(customer.address, col1X, billToY);
        billToY += 14;
      }
      if (customer.suburb) {
        doc.text(customer.suburb, col1X, billToY);
        billToY += 14;
      }
      if (customer.city || customer.state || customer.postcode) {
        const cityLine = [customer.city, customer.postcode].filter(Boolean).join(', ');
        if (cityLine) {
          doc.text(cityLine, col1X, billToY);
          billToY += 14;
        }
        if (customer.state) {
          doc.text(customer.state, col1X, billToY);
          billToY += 14;
        }
      }
      if (customer.email) {
        doc.text(customer.email, col1X, billToY);
        billToY += 14;
      }
      if (customer.phone) {
        doc.text(customer.phone, col1X, billToY);
        billToY += 14;
      }
    } else {
      doc.text(invoice.customer_name || "Customer", col1X, billToY);
      billToY += 14;
    }

    // Column 2: SITE ADDRESS / Job Location
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("SITE ADDRESS:", col2X, gridStartY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333");
    
    let siteY = gridStartY + 18;
    if (job) {
      if (job.site_address) {
        doc.text(job.site_address, col2X, siteY);
        siteY += 14;
      }
      if (job.site_suburb) {
        doc.text(job.site_suburb, col2X, siteY);
        siteY += 14;
      }
      if (job.site_city || job.site_postcode) {
        const siteCityLine = [job.site_city, job.site_postcode].filter(Boolean).join(', ');
        if (siteCityLine) {
          doc.text(siteCityLine, col2X, siteY);
          siteY += 14;
        }
      }
      if (job.site_state) {
        doc.text(job.site_state, col2X, siteY);
        siteY += 14;
      }
    } else {
      doc.text("Same as customer", col2X, siteY);
      siteY += 14;
    }

    // Column 3: INVOICE METADATA
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("INVOICE DETAILS:", col3X, gridStartY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333");
    
    let metaY = gridStartY + 18;
    
    // Invoice number
    doc.font("Helvetica-Bold").text("Invoice Number: ", col3X, metaY, { continued: true });
    doc.font("Helvetica").text(invoice.invoice_number || id);
    metaY += 14;
    
    // Job number
    if (job?.job_number) {
      doc.font("Helvetica-Bold").text("Job Number: ", col3X, metaY, { continued: true });
      doc.font("Helvetica").text(job.job_number);
      metaY += 14;
    }
    
    // Invoice date
    doc.font("Helvetica-Bold").text("Invoice Date: ", col3X, metaY, { continued: true });
    doc.font("Helvetica").text(
      invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "N/A"
    );
    metaY += 14;
    
    // Due date
    doc.font("Helvetica-Bold").text("Due Date: ", col3X, metaY, { continued: true });
    doc.font("Helvetica").text(
      invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"
    );
    metaY += 14;
    
    // GST number (from settings)
    if (settings && (settings as any).gst_number) {
      doc.font("Helvetica-Bold").text("GST Number: ", col3X, metaY, { continued: true });
      doc.font("Helvetica").text((settings as any).gst_number);
      metaY += 14;
    }

    // Update yPosition to the max of all three columns
    yPosition = Math.max(billToY, siteY, metaY) + 20;

    // ===== INVOICE TITLE =====
    const documentTitle = template?.document_title || "INVOICE";
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text(documentTitle, margins, yPosition);

    yPosition += 40;

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
    
    // Determine which columns to show based on template
    const showQuantity = template ? template.show_line_quantities !== false : true;
    const showPrice = template ? template.show_line_prices !== false : true;
    const showTotal = template ? template.show_line_totals !== false : true;
    
    console.log("PDF Generation - Column Visibility:");
    console.log("  show_line_quantities:", showQuantity);
    console.log("  show_line_prices:", showPrice);
    console.log("  show_line_totals:", showTotal);
    
    // Calculate dynamic column widths based on visible columns
    const colWidths = {
      description: contentWidth * 0.4,
      quantity: showQuantity ? contentWidth * 0.2 : 0,
      price: showPrice ? contentWidth * 0.2 : 0,
      total: showTotal ? contentWidth * 0.2 : 0,
    };

    // Check if we should render custom template sections or invoice line items
    const useTemplateSections = template && template.parsedSections && template.parsedSections.length > 0;
    
    if (useTemplateSections) {
      console.log("🎨 Rendering custom template sections");
      
      // Render each section from the template
      template.parsedSections.forEach((section: any, sectionIndex: number) => {
        // Section header
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(section.name || `Section ${sectionIndex + 1}`, margins, yPosition);
        
        yPosition += 20;
        
        // Section description if it exists
        if (section.description) {
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#666")
            .text(section.description, margins, yPosition, {
              width: contentWidth,
            });
          yPosition += 25;
        }
        
        // Only render items table if section has items
        if (section.items && section.items.length > 0) {
          const sectionTableTop = yPosition;
          
          // Table header for this section
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(tableHeaderTextColor)
            .rect(margins, sectionTableTop, contentWidth, 25)
            .fill(primaryColor);

          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(tableHeaderTextColor);
          
          let xPos = margins + 5;
          
          // Description header (always shown)
          doc.text("Description", xPos, sectionTableTop + 7, {
            width: colWidths.description - 10,
          });
          xPos += colWidths.description;
          
          // Qty header (conditional)
          if (showQuantity) {
            doc.text("Qty", xPos, sectionTableTop + 7, {
              width: colWidths.quantity - 10,
              align: "right",
            });
            xPos += colWidths.quantity;
          }
          
          // Price header (conditional)
          if (showPrice) {
            doc.text("Price", xPos, sectionTableTop + 7, {
              width: colWidths.price - 10,
              align: "right",
            });
            xPos += colWidths.price;
          }
          
          // Total header (conditional)
          if (showTotal) {
            doc.text("Total", xPos, sectionTableTop + 7, {
              width: colWidths.total - 10,
              align: "right",
            });
          }

          yPosition = sectionTableTop + 30;

          // Render section items
          section.items.forEach((item: any, itemIndex: number) => {
            const rowHeight = 25;
            const isAlternate = itemIndex % 2 === 1;

            // Alternate row background
            if (isAlternate) {
              doc
                .rect(margins, yPosition - 5, contentWidth, rowHeight)
                .fill(lightGray);
            }

            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor("#333");
            
            let rowXPos = margins + 5;
            
            // Description (always shown)
            const itemDescription = item.description || item.name || "";
            doc.text(itemDescription, rowXPos, yPosition, {
              width: colWidths.description - 10,
            });
            rowXPos += colWidths.description;
            
            // Quantity (conditional)
            if (showQuantity) {
              const qty = item.quantity || 0;
              doc.text(qty.toString(), rowXPos, yPosition, {
                width: colWidths.quantity - 10,
                align: "right",
              });
              rowXPos += colWidths.quantity;
            }
            
            // Price (conditional)
            if (showPrice) {
              const price = item.price || 0;
              doc.text(`$${price.toFixed(2)}`, rowXPos, yPosition, {
                width: colWidths.price - 10,
                align: "right",
              });
              rowXPos += colWidths.price;
            }
            
            // Total (conditional)
            if (showTotal) {
              const qty = item.quantity || 0;
              const price = item.price || 0;
              const total = qty * price;
              doc.text(`$${total.toFixed(2)}`, rowXPos, yPosition, {
                width: colWidths.total - 10,
                align: "right",
              });
            }

            yPosition += rowHeight;
          });
          
          yPosition += 15; // Space after section
        }
        
        yPosition += 10; // Space between sections
      });
      
    } else {
      console.log("📄 Rendering invoice line items from database");
      
      // Original logic: render invoice line items from database
      // Table header
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(tableHeaderTextColor)
        .rect(margins, tableTop, contentWidth, 25)
        .fill(primaryColor);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(tableHeaderTextColor);
      
      let xPos = margins + 5;
      
      // Description header (always shown)
      doc.text("Description", xPos, tableTop + 7, {
        width: colWidths.description - 10,
      });
      xPos += colWidths.description;
      
      // Qty header (conditional)
      if (showQuantity) {
        doc.text("Qty", xPos, tableTop + 7, {
          width: colWidths.quantity - 10,
          align: "right",
        });
        xPos += colWidths.quantity;
      }
      
      // Price header (conditional)
      if (showPrice) {
        doc.text("Price", xPos, tableTop + 7, {
          width: colWidths.price - 10,
          align: "right",
        });
        xPos += colWidths.price;
      }
      
      // Total header (conditional)
      if (showTotal) {
        doc.text("Total", xPos, tableTop + 7, {
          width: colWidths.total - 10,
          align: "right",
        });
      }

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
          .fillColor("#333");
        
        let rowXPos = margins + 5;
        
        // Description (always shown)
        doc.text(item.name || item.description || "", rowXPos, yPosition, {
          width: colWidths.description - 10,
        });
        rowXPos += colWidths.description;
        
        // Quantity (conditional)
        if (showQuantity) {
          doc.text(item.quantity.toString(), rowXPos, yPosition, {
            width: colWidths.quantity - 10,
            align: "right",
          });
          rowXPos += colWidths.quantity;
        }
        
        // Price (conditional)
        if (showPrice) {
          doc.text(`$${item.price.toFixed(2)}`, rowXPos, yPosition, {
            width: colWidths.price - 10,
            align: "right",
          });
          rowXPos += colWidths.price;
        }
        
        // Total (conditional)
        if (showTotal) {
          doc.text(`$${item.total.toFixed(2)}`, rowXPos, yPosition, {
            width: colWidths.total - 10,
            align: "right",
          });
        }

        yPosition += rowHeight;
      });
    }

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

    // Use template's custom_invoice_notes if available, otherwise use settings
    const invoiceNotes = template?.default_description || settings.custom_invoice_notes;
    if (invoiceNotes) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(descTextColor)
        .text(invoiceNotes, margins, yPosition, {
          width: contentWidth,
        });

      yPosition += 30;
    }

    // ===== FOOTER WITH BANK DETAILS & TEMPLATE FOOTER =====
    let footerY = pageHeight - 80;
    
    // Use template's default_footer if available, otherwise use settings footer
    const footerText = template?.default_footer || settings.payment_terms;
    if (footerText) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(descTextColor)
        .text(footerText, margins, footerY, {
          width: contentWidth,
        });
      footerY -= 40;
    }
    
    if (
      settings.bank_name ||
      settings.bank_account_number ||
      settings.iban
    ) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text("Bank Details:", margins, footerY);

      let bankY = footerY - 15;

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
