// invoices.controller.ts
// Created by Honeycomb © 2026
// Invoice routes - draft creation from labour entries

import { Request, Response } from "express";
import { pool } from "../db";
import { renderInvoicePdf } from "../utils/pdfRenderer";

type LineItemInput = {
  id?: string | number;
  name?: string;
  description?: string;
  quantity?: number;
  cost?: number;
  price?: number;
  markup?: number;
  tax?: number;
  discount?: number;
  total?: number;
  category?: string;
};

type LineItemResponse = {
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
  category?: string;
};

type InvoiceRow = {
  id: number;
  invoice_number?: string | null;
  job_id: number;
  job_name?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  type?: string | null;
  delivery_status?: string | null;
  status?: string | null;
  payment_period?: string | null;
  card_payment_fee?: string | null;
  subtotal?: number | null;
  tax_amount?: number | null;
  total_with_tax?: number | null;
  amount_paid?: number | null;
  amount_unpaid?: number | null;
  labour_discount?: number | null;
  material_discount?: number | null;
  material_markup?: number | null;
  online_payments_enabled?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  sent_at?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  letterhead?: string | null;
  xero_invoice_id?: string | null;
  xero_sync_status?: string | null;
  xero_last_sync_at?: string | null;
};

type InvoiceResponse = {
  id: string;
  invoiceNumber: string;
  jobId: string;
  jobName: string;
  customerId: string;
  customerName: string;
  type: string;
  deliveryStatus: string;
  status: string;
  paymentPeriod: string;
  cardPaymentFee: string;
  subtotal: number;
  taxAmount: number;
  totalWithTax: number;
  amountPaid: number;
  amountUnpaid: number;
  labourDiscount: number;
  materialDiscount: number;
  materialMarkup: number;
  onlinePaymentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  letterhead?: string;
  xeroInvoiceId?: string;
  xeroSyncStatus?: string;
  xeroLastSyncAt?: string;
  lineItems: LineItemResponse[];
};

type InvoiceSummaryTotals = {
  totalClaimed: number;
  totalGst: number;
  totalUnpaid: number;
  totalPaid: number;
};

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const mapInvoiceRow = (row: InvoiceRow): InvoiceResponse => ({
  id: String(row.id),
  invoiceNumber: row.invoice_number || "",
  jobId: String(row.job_id),
  jobName: row.job_name || "",
  customerId: row.customer_id ? String(row.customer_id) : "",
  customerName: row.customer_name || "",
  type: row.type || "DRAFT",
  deliveryStatus: row.delivery_status || "NOT_SENT",
  status: row.status || "UNPAID",
  paymentPeriod: row.payment_period || "14_DAYS",
  cardPaymentFee: row.card_payment_fee || "COMPANY_SETTING",
  subtotal: toNumber(row.subtotal),
  taxAmount: toNumber(row.tax_amount),
  totalWithTax: toNumber(row.total_with_tax),
  amountPaid: toNumber(row.amount_paid),
  amountUnpaid: toNumber(row.amount_unpaid),
  labourDiscount: toNumber(row.labour_discount),
  materialDiscount: toNumber(row.material_discount),
  materialMarkup: toNumber(row.material_markup),
  onlinePaymentsEnabled: row.online_payments_enabled ?? true,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
  sentAt: row.sent_at || undefined,
  dueDate: row.due_date || undefined,
  paidAt: row.paid_at || undefined,
  notes: row.notes || undefined,
  letterhead: row.letterhead || undefined,
  xeroInvoiceId: row.xero_invoice_id || undefined,
  xeroSyncStatus: row.xero_sync_status || undefined,
  xeroLastSyncAt: row.xero_last_sync_at || undefined,
  lineItems: [],
});

const normalizeLineItems = (items: LineItemInput[]) => {
  return items.map((item, index) => {
    const quantity = toNumber(item.quantity);
    const price = toNumber(item.price);
    const discount = toNumber(item.discount);
    const tax = toNumber(item.tax, 10);
    const base = quantity * price;
    const discountAmount = base * (discount / 100);
    const afterDiscount = base - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const total = afterDiscount + taxAmount;

    return {
      id: item.id ? String(item.id) : `item-${index}`,
      name: item.name || "",
      description: item.description || "",
      quantity,
      cost: toNumber(item.cost),
      price,
      markup: toNumber(item.markup),
      tax,
      discount,
      total,
      category: item.category || "labour", // ← Add category support
      _afterDiscount: afterDiscount,
      _taxAmount: taxAmount,
    };
  });
};

const calculateTotals = (items: ReturnType<typeof normalizeLineItems>) => {
  const subtotal = items.reduce((sum, item) => sum + item._afterDiscount, 0);
  const taxAmount = items.reduce((sum, item) => sum + item._taxAmount, 0);
  const totalWithTax = subtotal + taxAmount;

  return { subtotal, taxAmount, totalWithTax };
};

const loadLabourLineItems = async (db: any, jobId: number) => {
  const { rows } = await db.query(
    `
    SELECT
      l.id,
      e.name AS employee_name,
      l.chargeable_hours::float AS chargeable_hours,
      l.rate::float AS rate,
      l.total::float AS total,
      l.notes
    FROM labour_entries l
    JOIN employees e ON e.id = l.employee_id
    JOIN jobs j ON j.id = l.job_id
    WHERE l.job_id = $1 AND (
      current_setting('app.god_mode') = 'true'
      OR j.company_id = current_setting('app.current_company_id')::bigint
    )
    ORDER BY l.created_at DESC
    `,
    [jobId]
  );

  return rows.map((entry: any, index: number) => ({
    id: `labour-${entry.id || index}`,
    name: `Labour - ${entry.employee_name || ""}`,
    description:
      entry.notes ||
      `${toNumber(entry.chargeable_hours)} hours @ $${toNumber(entry.rate)}/hr`,
    quantity: toNumber(entry.chargeable_hours),
    cost: toNumber(entry.rate),
    price: toNumber(entry.rate),
    markup: 0,
    tax: 10,
    discount: 0,
    total: toNumber(entry.total) || toNumber(entry.chargeable_hours) * toNumber(entry.rate),
    category: "labour", // ← Set category for labour entries
  }));
};

/* ===============================
   GET ALL INVOICES
================================ */
export const getAll = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT
        i.*,
        j.title AS job_name
      FROM invoices i
      LEFT JOIN jobs j ON j.id = i.job_id
      WHERE (
        current_setting('app.god_mode') = 'true'
        OR i.company_id = current_setting('app.current_company_id')::bigint
      )
      ORDER BY i.created_at DESC
      `
    );

    const invoices: InvoiceResponse[] = result.rows.map((row: InvoiceRow) =>
      mapInvoiceRow(row)
    );

    const summary = invoices.reduce(
      (acc: InvoiceSummaryTotals, inv) => {
        acc.totalClaimed += inv.totalWithTax;
        acc.totalGst += inv.taxAmount;
        acc.totalUnpaid += inv.amountUnpaid;
        acc.totalPaid += inv.amountPaid;
        return acc;
      },
      { totalClaimed: 0, totalGst: 0, totalUnpaid: 0, totalPaid: 0 }
    );

    return res.json({
      invoices,
      summary,
      hasHistory: invoices.length > 0,
    });
  } catch (err) {
    console.error("invoices.getAll error:", err);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

/* ===============================
   GET INVOICES FOR JOB
================================ */
export const getByJobId = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const jobId = Number(req.params.jobId);

  try {
    const result = await db.query(
      `
      SELECT
        i.*,
        j.title AS job_name
      FROM invoices i
      JOIN jobs j ON j.id = i.job_id
      WHERE i.job_id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      ORDER BY i.created_at DESC
      `,
      [jobId]
    );

    const invoices: InvoiceResponse[] = result.rows.map((row: InvoiceRow) =>
      mapInvoiceRow(row)
    );

    const summary = invoices.reduce(
      (acc: InvoiceSummaryTotals, inv) => {
        acc.totalClaimed += inv.totalWithTax;
        acc.totalGst += inv.taxAmount;
        acc.totalUnpaid += inv.amountUnpaid;
        acc.totalPaid += inv.amountPaid;
        return acc;
      },
      { totalClaimed: 0, totalGst: 0, totalUnpaid: 0, totalPaid: 0 }
    );

    return res.json({
      invoices,
      summary,
      hasHistory: invoices.length > 0,
    });
  } catch (err) {
    console.error("invoices.getByJobId error:", err);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

/* ===============================
   GET ONE INVOICE
================================ */
export const getById = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const invoiceId = Number(req.params.id);

  try {
    const invoiceResult = await db.query(
      `
      SELECT
        i.*,
        j.title AS job_name
      FROM invoices i
      JOIN jobs j ON j.id = i.job_id
      WHERE i.id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      LIMIT 1
      `,
      [invoiceId]
    );

    if (!invoiceResult.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = mapInvoiceRow(invoiceResult.rows[0]);

    const lineItemsResult = await db.query(
      `
      SELECT
        id,
        name,
        description,
        quantity,
        cost,
        price,
        markup,
        tax,
        discount,
        total,
        category
      FROM invoice_line_items
      WHERE invoice_id = $1
      ORDER BY id ASC
      `,
      [invoiceId]
    );

    invoice.lineItems = lineItemsResult.rows.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      description: row.description,
      quantity: toNumber(row.quantity),
      cost: toNumber(row.cost),
      price: toNumber(row.price),
      markup: toNumber(row.markup),
      tax: toNumber(row.tax),
      discount: toNumber(row.discount),
      total: toNumber(row.total),
      category: row.category || "labour",
    }));

    const margins = {
      overallCost: 0,
      chargedSoFar: invoice.totalWithTax,
      labourCost: 0,
      labourCharge: 0,
      materialCost: 0,
      materialCharge: 0,
      totalCost: 0,
      totalCharge: invoice.totalWithTax,
      totalMargin: 0,
      grossProfit: 0,
      grossMargin: 0,
      invoiceProgress: 0,
    };

    return res.json({ invoice, margins });
  } catch (err) {
    console.error("invoices.getById error:", err);
    return res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

/* ===============================
   CREATE INVOICE (DRAFT)
================================ */
export const create = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const {
      jobId,
      customerId,
      lineItems,
      paymentPeriod = "14_DAYS",
      cardPaymentFee = "COMPANY_SETTING",
      notes,
      useLabourEntries,
    } = req.body || {};

    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const jobResult = await db.query(
      `
      SELECT
        j.id,
        j.title,
        j.company_id
      FROM jobs j
      WHERE j.id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      LIMIT 1
      `,
      [jobId]
    );

    if (!jobResult.rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobResult.rows[0];

    const shouldUseLabour =
      Boolean(useLabourEntries) ||
      !Array.isArray(lineItems) ||
      lineItems.length === 0;

    const rawItems = shouldUseLabour
      ? await loadLabourLineItems(db, Number(jobId))
      : lineItems;

    const normalizedItems = normalizeLineItems(rawItems);

    const { subtotal, taxAmount, totalWithTax } =
      calculateTotals(normalizedItems);

    const invoiceInsert = await db.query(
      `
      INSERT INTO invoices
      (
        job_id,
        customer_id,
        type,
        delivery_status,
        status,
        payment_period,
        card_payment_fee,
        subtotal,
        tax_amount,
        total_with_tax,
        amount_paid,
        amount_unpaid,
        notes,
        company_id,
        created_at,
        updated_at
      )
      VALUES
      (
        $1,
        $2,
        'DRAFT',
        'NOT_SENT',
        'UNPAID',
        $3,
        $4,
        $5,
        $6,
        $7,
        0,
        $7,
        $8,
        $9,
        NOW(),
        NOW()
      )
      RETURNING *
      `,
      [
        job.id,
        customerId || null,
        paymentPeriod,
        cardPaymentFee,
        subtotal,
        taxAmount,
        totalWithTax,
        notes || null,
        job.company_id,
      ]
    );

    const insertedInvoice = invoiceInsert.rows[0] as InvoiceRow;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      insertedInvoice.id
    ).padStart(5, "0")}`;

    await db.query(
      `
      UPDATE invoices
      SET invoice_number = $1
      WHERE id = $2
      `,
      [invoiceNumber, insertedInvoice.id]
    );

    const lineItemRows = [] as any[];

    for (const item of normalizedItems) {
      const result = await db.query(
        `
        INSERT INTO invoice_line_items
        (
          invoice_id,
          name,
          description,
          quantity,
          cost,
          price,
          markup,
          tax,
          discount,
          total,
          category
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        RETURNING *
        `,
        [
          insertedInvoice.id,
          item.name,
          item.description,
          item.quantity,
          item.cost,
          item.price,
          item.markup,
          item.tax,
          item.discount,
          item.total,
          item.category,
        ]
      );

      lineItemRows.push(result.rows[0]);
    }

    const responseInvoice = mapInvoiceRow({
      ...insertedInvoice,
      invoice_number: invoiceNumber,
      job_name: job.title,
    });

    responseInvoice.lineItems = lineItemRows.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      description: row.description,
      quantity: toNumber(row.quantity),
      cost: toNumber(row.cost),
      price: toNumber(row.price),
      markup: toNumber(row.markup),
      tax: toNumber(row.tax),
      discount: toNumber(row.discount),
      total: toNumber(row.total),
    }));

    return res.status(201).json(responseInvoice);
  } catch (err) {
    console.error("invoices.create error:", err);
    return res.status(500).json({ error: "Failed to create invoice" });
  }
};

/* ===============================
   UPDATE INVOICE
================================ */
export const update = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const invoiceId = Number(req.params.id);

  try {
    const {
      lineItems = [],
      paymentPeriod,
      cardPaymentFee,
      notes,
      labourDiscount,
      materialDiscount,
      materialMarkup,
      onlinePaymentsEnabled,
    } = req.body || {};

    const invoiceCheck = await db.query(
      `
      SELECT i.id, i.job_id, j.title AS job_name
      FROM invoices i
      JOIN jobs j ON j.id = i.job_id
      WHERE i.id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR j.company_id = current_setting('app.current_company_id')::bigint
      )
      `,
      [invoiceId]
    );

    if (!invoiceCheck.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const normalizedItems = normalizeLineItems(lineItems || []);
    const { subtotal, taxAmount, totalWithTax } =
      calculateTotals(normalizedItems);

    const updateResult = await db.query(
      `
      UPDATE invoices
      SET
        payment_period = COALESCE($1, payment_period),
        card_payment_fee = COALESCE($2, card_payment_fee),
        notes = COALESCE($3, notes),
        labour_discount = COALESCE($4, labour_discount),
        material_discount = COALESCE($5, material_discount),
        material_markup = COALESCE($6, material_markup),
        online_payments_enabled = COALESCE($7, online_payments_enabled),
        subtotal = $8,
        tax_amount = $9,
        total_with_tax = $10,
        amount_unpaid = $10 - amount_paid,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
      `,
      [
        paymentPeriod || null,
        cardPaymentFee || null,
        notes || null,
        labourDiscount ?? null,
        materialDiscount ?? null,
        materialMarkup ?? null,
        onlinePaymentsEnabled ?? null,
        subtotal,
        taxAmount,
        totalWithTax,
        invoiceId,
      ]
    );

    await db.query(
      `DELETE FROM invoice_line_items WHERE invoice_id = $1`,
      [invoiceId]
    );

    const lineItemRows = [] as any[];

    for (const item of normalizedItems) {
      const result = await db.query(
        `
        INSERT INTO invoice_line_items
        (
          invoice_id,
          name,
          description,
          quantity,
          cost,
          price,
          markup,
          tax,
          discount,
          total,
          category
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        RETURNING *
        `,
        [
          invoiceId,
          item.name,
          item.description,
          item.quantity,
          item.cost,
          item.price,
          item.markup,
          item.tax,
          item.discount,
          item.total,
          item.category,
        ]
      );

      lineItemRows.push(result.rows[0]);
    }

    const responseInvoice = mapInvoiceRow({
      ...updateResult.rows[0],
      job_name: invoiceCheck.rows[0].job_name,
    });

    responseInvoice.lineItems = lineItemRows.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      description: row.description,
      quantity: toNumber(row.quantity),
      cost: toNumber(row.cost),
      price: toNumber(row.price),
      markup: toNumber(row.markup),
      tax: toNumber(row.tax),
      discount: toNumber(row.discount),
      total: toNumber(row.total),
    }));

    return res.json(responseInvoice);
  } catch (err) {
    console.error("invoices.update error:", err);
    return res.status(500).json({ error: "Failed to update invoice" });
  }
};

/* ===============================
   APPROVE INVOICE
================================ */
export const approve = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const invoiceId = Number(req.params.id);

  try {
    const result = await db.query(
      `
      UPDATE invoices i
      SET
        type = 'APPROVED',
        status = 'UNPAID',
        updated_at = NOW()
      FROM jobs j
      WHERE i.id = $1
        AND j.id = i.job_id
        AND (
          current_setting('app.god_mode') = 'true'
          OR j.company_id = current_setting('app.current_company_id')::bigint
        )
      RETURNING i.*, j.title AS job_name
      `,
      [invoiceId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const responseInvoice = mapInvoiceRow(result.rows[0]);

    return res.json(responseInvoice);
  } catch (err) {
    console.error("invoices.approve error:", err);
    return res.status(500).json({ error: "Failed to approve invoice" });
  }
};

// Delete an invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = (req as any).db;

  if (!db) {
    return res.status(500).json({ error: "Database context not found" });
  }

  try {
    // First, delete related line items
    await db.query(`DELETE FROM invoice_line_items WHERE invoice_id = $1`, [id]);

    // Then delete the invoice
    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id, invoice_number`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    console.log(`✅ Invoice deleted: ${result.rows[0].invoice_number}`);
    return res.json({ 
      success: true, 
      message: `Invoice ${result.rows[0].invoice_number} deleted successfully` 
    });
  } catch (err) {
    console.error("invoices.delete error:", err);
    return res.status(500).json({ error: "Failed to delete invoice" });
  }
};

/* ===============================
   SYNC WITH XERO
================================ */
export const syncWithXero = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id;
    console.log("🔄 Syncing invoice with Xero:", invoiceId);

    // TEMP SUCCESS RESPONSE
    // (Replace later with real Xero integration)
    return res.json({
      success: true,
      message: "Invoice synced with Xero",
      invoiceId,
    });
  } catch (err) {
    console.error("invoices.syncWithXero error:", err);
    return res.status(500).json({
      error: "Failed to sync with Xero",
    });
  }
};

/* ===============================
   DOWNLOAD INVOICE PDF
================================ */
export const downloadInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id;
    console.log("📥 Downloading invoice PDF:", invoiceId);

    try {
      // Fetch invoice
      const invoiceResult = await pool.query(
        "SELECT * FROM invoices WHERE id = $1",
        [invoiceId]
      );
      console.log("✅ Invoice fetched");

      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const invoice = invoiceResult.rows[0];
      console.log("   - Invoice ID:", invoice.id);
      console.log("   - Company ID:", invoice.company_id);
      console.log("   - Customer ID:", invoice.customer_id);
      console.log("   - Job ID:", invoice.job_id);

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
            console.log("✅ Job fetched:", job.title);
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

      // Fetch line items
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

      // Fetch template
      const templateResult = await pool.query(
        "SELECT * FROM invoice_templates WHERE company_id = $1 AND is_default = true LIMIT 1",
        [invoice.company_id]
      );
      console.log("✅ Template fetched");

      const template = templateResult.rows[0];

      // DEBUG: Log exact template structure
      console.log("\n🔍 TEMPLATE DATA LOADED:");
      if (template) {
        console.log("   - Template ID:", template.id);
        console.log("   - Columns:", Object.keys(template).length);
      } else {
        console.log("   - ⚠️ No template found");
      }

    // Parse sections if they exist (with null check)
    if (template) {
      if (template.sections && typeof template.sections === "string") {
        try {
          template.parsedSections = JSON.parse(template.sections);
          console.log("✅ Template sections parsed:", template.parsedSections.length);
        } catch (err) {
          console.error("❌ Error parsing sections:", err);
          template.parsedSections = [];
        }
      } else if (template.sections) {
        template.parsedSections = template.sections;
      } else {
        template.parsedSections = [];
      }
    }

    // Fetch settings
    const settingsResult = await pool.query(
      "SELECT * FROM invoice_settings WHERE company_id = $1",
      [invoice.company_id]
    );

    let settings = settingsResult.rows[0] || {};

    // Fetch company (load all columns for complete company data)
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

    // DEBUG: Log company data
    console.log("\n🔍 COMPANY DATA (merged settings + company):");
    console.log("   - company_name:", companyData.company_name);
    console.log("   - company_address:", companyData.company_address);
    console.log("   - company_email:", companyData.company_email);
    console.log("   - company_phone:", companyData.company_phone);
    console.log("   - gst_number:", companyData.gst_number);
    console.log("   - logo_url:", companyData.logo_url);

    console.log("\n✅ All data loaded successfully");
    console.log("   - Invoice amount:", invoice.subtotal);
    console.log("   - Template exists:", !!template);
    console.log("   - Company name:", companyData.company_name);

    // DEBUG: Log template fields to identify missing columns
    if (template) {
      console.log("\n🔍 TEMPLATE FIELDS:");
      console.log("   - header_background_color:", template.header_background_color);
      console.log("   - main_color:", template.main_color);
      console.log("   - text_color:", template.text_color);
      console.log("   - table_header_background_color:", template.table_header_background_color);
      console.log("   - table_header_style:", template.table_header_style);
      console.log("   - description_background_color:", template.description_background_color);
      console.log("   - border_width:", template.border_width);
      console.log("   - font_size:", template.font_size);
    } else {
      console.log("⚠️  No template found!");
    }

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
      console.error("   Error stack:", (pdfErr as Error).stack);
      if (!res.headersSent) {
        res.status(500).json({
          error: "PDF rendering failed",
          details: (pdfErr as Error).message,
          type: (pdfErr as Error).constructor.name
        });
      }
    }
    } catch (dataErr) {
      console.error("❌ Data Loading Error:");
      console.error("   Error type:", (dataErr as Error).constructor.name);
      console.error("   Error message:", (dataErr as Error).message);
      console.error("   Error stack:", (dataErr as Error).stack);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to load invoice data",
          details: (dataErr as Error).message,
          type: (dataErr as Error).constructor.name
        });
      }
    }
  } catch (err) {
    console.error("❌ Invoice PDF Download Error:");
    console.error("   Error type:", (err as Error).constructor.name);
    console.error("   Error message:", (err as Error).message);
    console.error("   Error stack:", (err as Error).stack);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate PDF",
        details: (err as Error).message,
        type: (err as Error).constructor.name
      });
    }
  }
};
