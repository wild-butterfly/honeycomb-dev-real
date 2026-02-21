// invoices.controller.ts
// Created by Honeycomb © 2026
// Invoice routes - draft creation from labour entries

import { Request, Response } from "express";

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
        total
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
          total
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
          $10
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
          total
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
          $10
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
