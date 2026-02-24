// Production-grade PDF renderer for invoices
// Uses ALL template styling, sections, gradients, and settings

import PDFDocument from "pdfkit";
import { Response } from "express";

interface Config {
  invoice: any;
  lineItems: any[];
  template: any;
  settings: any;
  company: any;
  customer?: any;
  job?: any;
  res: Response;
}

/**
 * Map font size string to point value
 */
const getFontSize = (sizeKey?: string): number => {
  const sizeMap: { [key: string]: number } = {
    small: 9,
    medium: 11,
    large: 13,
  };
  return sizeMap[sizeKey || "medium"] || 11;
};

/**
 * Safely convert any value to a number
 */
const toSafeNumber = (val: any, fallback = 0): number => {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Format number as Australian currency
 */
const money = (val: any): string => {
  const num = toSafeNumber(val);
  return `$${num.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` || "$0.00";
};

export const renderInvoicePdf = async ({
  invoice,
  lineItems,
  template,
  settings,
  company,
  customer,
  job,
  res,
}: Config) => {
  const layout = template?.orientation === "landscape" ? "landscape" : "portrait";
  const doc = new PDFDocument({
    size: "A4",
    layout,
    margin: 40,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice-${invoice.invoice_number}.pdf`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const mainColor = template?.main_color || "#f59e0b";
  const borderColor = template?.border_color || "#e5e7eb";
  const borderWidth = parseFloat(template?.border_width || "1") || 1;
  const textColor = template?.text_color || "#111";
  const headerBgColor = template?.header_background_color || "#f9fafb";
  const tableHeaderBg = template?.table_header_background_color || mainColor;
  const tableHeaderGradient = template?.table_header_gradient_color || mainColor;
  const tableHeaderText = template?.table_header_text_color || "#ffffff";
  const descriptionBg = template?.description_background_color || "#fffef7";
  const descriptionBorder = template?.description_border_color || mainColor;
  const descriptionText = template?.description_text_color || "#374151";
  const documentTitle = template?.document_title || "Tax Invoice";
  const baseFontSize = getFontSize(template?.font_size);
  const headerCompany = {
    name:
      settings?.company_name ||
      (settings as any)?.business_name ||
      company?.company_name ||
      company?.business_name ||
      company?.name ||
      "Company",
    address: settings?.company_address || company?.company_address || company?.address || "",
    city:
      settings?.company_city ||
      settings?.company_suburb ||
      company?.company_city ||
      company?.company_suburb ||
      company?.city ||
      company?.suburb ||
      "",
    state: settings?.company_state || company?.company_state || company?.state || "",
    postcode:
      settings?.company_postcode ||
      (settings as any)?.company_postal_code ||
      company?.company_postcode ||
      (company as any)?.company_postal_code ||
      company?.postcode ||
      "",
    email: settings?.company_email || company?.company_email || company?.email || "",
    phone: settings?.company_phone || company?.company_phone || company?.phone || "",
    logoUrl: settings?.logo_url || company?.logo_url || "",
  };

  console.log("=== PDF RENDERER ===");
  console.log("headerCompany object:", JSON.stringify(headerCompany, null, 2));

  let y = margin;

  // ====================================================
  // HEADER SECTION
  // ====================================================
  
  const headerHeight = 140;
  const headerTop = 20;
  const logoBoxWidth = 150;
  const logoBoxHeight = 100;
  const logoBoxPadding = 8;

  doc.rect(0, 0, pageWidth, headerHeight).fill(headerBgColor);
  doc
    .strokeColor(borderColor)
    .lineWidth(borderWidth)
    .moveTo(margin, headerHeight)
    .lineTo(margin + contentWidth, headerHeight)
    .stroke();

  if (template?.show_company_logo !== false) {
    doc
      .rect(margin, headerTop, logoBoxWidth, logoBoxHeight)
      .fill(descriptionBg)
      .strokeColor(mainColor)
      .lineWidth(Math.max(borderWidth, 2))
      .stroke();

    if (headerCompany.logoUrl) {
      try {
        if (headerCompany.logoUrl.startsWith("http")) {
          const axios = require("axios");
          const response = await axios.get(headerCompany.logoUrl, {
            responseType: "arraybuffer"
          });
          doc.image(response.data, margin + logoBoxPadding, headerTop + logoBoxPadding, {
            fit: [logoBoxWidth - logoBoxPadding * 2, logoBoxHeight - logoBoxPadding * 2],
            align: "center",
            valign: "center",
          });
        } else {
          const logoPath = headerCompany.logoUrl.startsWith("/")
            ? require("path").join(__dirname, "..", "..", headerCompany.logoUrl)
            : headerCompany.logoUrl;
          doc.image(logoPath, margin + logoBoxPadding, headerTop + logoBoxPadding, {
            fit: [logoBoxWidth - logoBoxPadding * 2, logoBoxHeight - logoBoxPadding * 2],
            align: "center",
            valign: "center",
          });
        }
      } catch (err) {
        console.warn("⚠️  Logo failed to load:", (err as Error).message);
      }
    }
  }

  // RIGHT: Company details
  const rightX = pageWidth - margin - 280;
  const companyNameY = headerTop + 8; // Align with logo
  doc
    .fontSize(baseFontSize + 2)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(headerCompany.name, rightX, companyNameY, {
      width: 280,
      align: "right",
    });

  doc
    .fontSize(baseFontSize - 1)
    .font("Helvetica")
    .fillColor(textColor);

  let headerY = companyNameY + 18;

  if (headerCompany.address) {
    doc.text(headerCompany.address, rightX, headerY, {
      width: 280,
      align: "right",
    });
    headerY += 12;
  }

  const companyCity = headerCompany.city || "";
  const companyPostcode = headerCompany.postcode || "";
  const companyState = headerCompany.state || "";
  const cityLine = `${companyCity} ${companyPostcode}`.trim();

  if (cityLine) {
    doc.text(cityLine, rightX, headerY, { width: 280, align: "right" });
    headerY += 12;
  }

  if (companyState) {
    doc.text(companyState, rightX, headerY, { width: 280, align: "right" });
    headerY += 12;
  }

  if (headerCompany.phone) {
    doc.text(headerCompany.phone, rightX, headerY, {
      width: 280,
      align: "right",
    });
    headerY += 12;
  }

  if (headerCompany.email) {
    doc.text(headerCompany.email, rightX, headerY, {
      width: 280,
      align: "right",
    });
  }

  y = headerHeight + 24;

  // ====================================================
  // CUSTOMER & SITE ADDRESS SECTION
  // ====================================================

  const infoGap = 20;
  const infoColWidth = (contentWidth - infoGap * 2) / 3;
  const infoStartY = y;
  const infoLineHeight = baseFontSize + 4;
  const customerIndent = template?.indent_customer_address ? 12 : 0;

  const drawInfoBlock = (x: number, title: string, lines: string[]) => {
    let blockY = infoStartY;
    doc.fontSize(baseFontSize).font("Helvetica-Bold").fillColor(textColor);
    doc.text(title, x, blockY, { width: infoColWidth });
    blockY += infoLineHeight;
    doc.fontSize(baseFontSize - 1).font("Helvetica").fillColor(textColor);
    lines.forEach((line) => {
      if (line) {
        doc.text(line, x, blockY, { width: infoColWidth });
        blockY += infoLineHeight;
      }
    });
    return blockY;
  };

  const customerLines = [
    customer?.name || invoice.customer_name || "",
    customer?.address ? `${" ".repeat(customerIndent)}${customer.address}` : "",
    customer?.suburb || customer?.state || customer?.postcode
      ? `${customer?.suburb || ""} ${customer?.state || ""} ${customer?.postcode || ""}`.trim()
      : "",
  ];

  const siteLines = [
    customer?.name || invoice.customer_name || "",
    job?.site_address || "",
    job?.suburb || job?.state || job?.postcode
      ? `${job?.suburb || ""} ${job?.state || ""} ${job?.postcode || ""}`.trim()
      : "",
  ];

  const customerBottom = drawInfoBlock(margin, "Attention Name", customerLines);
  const siteBottom = drawInfoBlock(margin + infoColWidth + infoGap, "Site Address", siteLines);

  let invoiceInfoY = infoStartY;
  const invoiceInfoX = margin + (infoColWidth + infoGap) * 2;
  const drawLabelValue = (label: string, value: string) => {
    if (!value) return;
    doc.fontSize(baseFontSize - 1).font("Helvetica-Bold").fillColor(textColor);
    doc.text(`${label}: `, invoiceInfoX, invoiceInfoY, {
      width: infoColWidth,
      continued: true,
    });
    doc.fontSize(baseFontSize - 1).font("Helvetica").fillColor(textColor);
    doc.text(value, { width: infoColWidth, continued: false });
    invoiceInfoY += infoLineHeight;
  };

  drawLabelValue("Invoice number", invoice.invoice_number || "");
  drawLabelValue("Job number", job?.job_number || "");
  drawLabelValue("Invoice Date", new Date(invoice.created_at).toDateString());
  drawLabelValue("Due Date", invoice.due_date ? new Date(invoice.due_date).toDateString() : "");
  drawLabelValue("ABN", settings?.gst_number || settings?.abn || "");

  const infoBottom = Math.max(customerBottom, siteBottom, invoiceInfoY);
  y = infoBottom + 25;

  // ====================================================
  // TITLE & DESCRIPTION
  // ====================================================

  doc
    .fontSize(baseFontSize + 11)
    .font("Helvetica-Bold")
    .fillColor(mainColor)
    .text(documentTitle, margin, y, { continued: true });

  doc
    .fontSize(baseFontSize + 11)
    .font("Helvetica-Bold")
    .fillColor("#999")
    .text(` | ${invoice.invoice_number}`);

  y += 18;

  // Optional description/tagline
  if (template?.default_description) {
    const descBoxX = margin;
    const descBoxY = y;
    const descBorderWidth = 4;
    const descPaddingX = 12;
    const descPaddingY = 10;
    const descTextWidth = contentWidth - descPaddingX * 2 - descBorderWidth;

    doc
      .fontSize(baseFontSize - 1)
      .font("Helvetica")
      .fillColor(descriptionText);

    const descHeight = doc.heightOfString(template.default_description, {
      width: descTextWidth,
    });
    const descBoxHeight = descHeight + descPaddingY * 2;

    doc.rect(descBoxX, descBoxY, contentWidth, descBoxHeight).fill(descriptionBg);
    doc
      .rect(descBoxX, descBoxY, descBorderWidth, descBoxHeight)
      .fill(descriptionBorder);

    doc
      .fillColor(descriptionText)
      .text(template.default_description, descBoxX + descBorderWidth + descPaddingX, descBoxY + descPaddingY, {
        width: descTextWidth,
      });

    y = descBoxY + descBoxHeight + 18;
  } else {
    y += 10;
  }

  // ====================================================
  // LINE ITEMS TABLE
  // ====================================================

  if (template?.show_line_items !== false) {
    const columns = [
      { key: "description", label: "Item Name", weight: 0.55, align: "left", show: true },
      { key: "quantity", label: "Quantity", weight: 0.15, align: "right", show: template?.show_line_quantities !== false },
      { key: "price", label: "Price", weight: 0.15, align: "right", show: template?.show_line_prices !== false },
      { key: "total", label: "Total", weight: 0.15, align: "right", show: template?.show_line_totals !== false },
    ];

    const visibleColumns = columns.filter((column) => column.show);
    const totalWeight = visibleColumns.reduce((sum, column) => sum + column.weight, 0);
    const columnWidths = visibleColumns.map((column) => ({
      ...column,
      width: (contentWidth * column.weight) / totalWeight,
    }));

    const headerFill = template?.table_header_style === "gradient"
      ? doc.linearGradient(margin, y, margin + contentWidth, y)
          .stop(0, tableHeaderBg)
          .stop(1, tableHeaderGradient)
      : tableHeaderBg;

    doc.rect(margin, y, contentWidth, 22).fill(headerFill as any);
    doc.fontSize(baseFontSize).font("Helvetica-Bold").fillColor(tableHeaderText);

    let headerX = margin;
    columnWidths.forEach((column) => {
      const paddingX = column.key === "description" ? 10 : 6;
      doc.text(column.label, headerX + paddingX, y + 6, {
        width: column.width - paddingX * 2,
        align: column.align as any,
      });
      headerX += column.width;
    });

    y += 25;

    doc.fontSize(baseFontSize - 1).font("Helvetica").fillColor(textColor);

    lineItems.forEach((item, idx) => {
      if (y > pageHeight - 180) {
        doc.addPage();
        y = margin;
      }

      if (idx % 2 === 1) {
        doc.rect(margin, y - 2, contentWidth, 20).fill("#f9fafb");
      }

      doc.fillColor(textColor);

      const rawDescription = (item.description || "").replace(
        /auto-generated from completed assignment/gi,
        ""
      );
      const cleanedDescription = rawDescription.replace(/\s+/g, " ").trim();
      const desc = cleanedDescription
        ? `${item.name || ""} - ${cleanedDescription}`.trim()
        : item.name || "";

      let cellX = margin;
      columnWidths.forEach((column) => {
        if (column.key === "description") {
          doc.text(desc, cellX + 10, y, { width: column.width - 20 });
        }
        if (column.key === "quantity") {
          doc.text((item.quantity || 0).toString(), cellX + 6, y, {
            width: column.width - 12,
            align: "right",
          });
        }
        if (column.key === "price") {
          doc.text(money(item.price || 0), cellX + 6, y, {
            width: column.width - 12,
            align: "right",
          });
        }
        if (column.key === "total") {
          doc.text(money(item.total || 0), cellX + 6, y, {
            width: column.width - 12,
            align: "right",
          });
        }
        cellX += column.width;
      });

      doc
        .strokeColor(tableHeaderBg)
        .lineWidth(0.5)
        .moveTo(margin, y + 18)
        .lineTo(margin + contentWidth, y + 18)
        .stroke();

      y += 20;
    });

    y += 15;
  }

  // ====================================================
  // TOTALS BOX (right-aligned)
  // ====================================================

  // Page break prevention
  if (y + 100 > pageHeight - 80) {
    doc.addPage();
    y = margin;
  }

  if (template?.show_section_totals !== false) {
    const totalsBoxWidth = Math.min(320, contentWidth);
    const totalsBoxHeight = 90;
    const totalsBoxX = margin + contentWidth - totalsBoxWidth;

    doc
      .rect(totalsBoxX, y, totalsBoxWidth, totalsBoxHeight)
      .fill(descriptionBg);
    doc
      .rect(totalsBoxX, y, totalsBoxWidth, totalsBoxHeight)
      .strokeColor(borderColor)
      .lineWidth(borderWidth)
      .stroke();

  const subtotal = toSafeNumber(invoice.subtotal);
  const taxAmount = toSafeNumber(invoice.tax_amount);
  const totalWithTax = toSafeNumber(invoice.total_with_tax);

    let totalY = y + 12;

    doc.fontSize(baseFontSize).font("Helvetica").fillColor(textColor);
    doc.text("Subtotal", totalsBoxX + 15, totalY);
    doc.text(money(subtotal), totalsBoxX + 15, totalY, {
      width: totalsBoxWidth - 30,
      align: "right",
    });

    totalY += 18;
    doc.text("GST Amount", totalsBoxX + 15, totalY);
    doc.text(money(taxAmount), totalsBoxX + 15, totalY, {
      width: totalsBoxWidth - 30,
      align: "right",
    });

    totalY += 16;
    doc
      .strokeColor(mainColor)
      .lineWidth(Math.max(borderWidth, 2))
      .moveTo(totalsBoxX + 12, totalY)
      .lineTo(totalsBoxX + totalsBoxWidth - 12, totalY)
      .stroke();

    totalY += 10;
    doc.fontSize(baseFontSize + 4).font("Helvetica-Bold").fillColor(mainColor);
    doc.text("Total", totalsBoxX + 15, totalY);
    doc.text(money(totalWithTax), totalsBoxX + 15, totalY, {
      width: totalsBoxWidth - 30,
      align: "right",
    });

    y += totalsBoxHeight + 30;
  }

  // ====================================================
  // FOOTER
  // ====================================================

  const footerY = pageHeight - 55;

  doc
    .strokeColor(borderColor)
    .lineWidth(borderWidth)
    .moveTo(margin, footerY - 8)
    .lineTo(margin + contentWidth, footerY - 8)
    .stroke();

  doc.fontSize(baseFontSize - 2).font("Helvetica").fillColor("#6b7280");

  let footerLine = footerY;

  if (template?.default_footer) {
    doc.text(template.default_footer, margin, footerLine, { width: contentWidth });
    footerLine += 20;
  }

  const footerDetailsParts = [] as string[];
  if (settings?.bsb) {
    footerDetailsParts.push(`BSB Number: ${settings.bsb}`);
  }
  if (settings?.bank_account) {
    footerDetailsParts.push(`Bank Account: ${settings.bank_account}`);
  }
  if (invoice?.invoice_number) {
    footerDetailsParts.push(`Invoice number: ${invoice.invoice_number}`);
  }

  if (footerDetailsParts.length > 0) {
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .moveTo(margin, footerLine + 6)
      .lineTo(margin + contentWidth, footerLine + 6)
      .stroke();

    doc.fontSize(baseFontSize - 3).fillColor("#9ca3af");
    doc.text(footerDetailsParts.join(" "), margin, footerLine + 14, { width: contentWidth });
  }

  doc.end();
};
