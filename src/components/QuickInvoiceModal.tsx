// QuickInvoiceModal.tsx
// Honeycomb © 2026
// FINAL Production Version

import React, { useState, useEffect } from "react";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  InvoiceLineItem,
  PaymentPeriod,
  CardPaymentFeeOption,
  QuickInvoiceData,
} from "../types/invoice";
import { apiGet } from "../services/api";
import type { ServiceCatalog } from "../types/serviceCatalogs";
import { getServiceCatalogs } from "../services/serviceCatalogs";

import styles from "./QuickInvoiceModal.module.css";

interface Props {
  jobId: string;
  onClose: () => void;
  onCreate: (data: QuickInvoiceData) => void;
}

export default function QuickInvoiceModal({ jobId, onClose, onCreate }: Props) {
  // State
  const [customerId, setCustomerId] = useState<string>("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [defaultTemplateId, setDefaultTemplateId] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentPeriod, setPaymentPeriod] = useState<PaymentPeriod>("ON_COMPLETION");
  const [cardPaymentFee, setCardPaymentFee] = useState<CardPaymentFeeOption>("COMPANY_SETTING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<any | null>(null);

  // Service Catalogs State
  const [serviceCatalogs, setServiceCatalogs] = useState<ServiceCatalog[]>([]);
  const [selectedServiceCatalogId, setSelectedServiceCatalogId] = useState<number | null>(null);

  //////////////////////////////////////////////////////
  // LOAD DATA
  //////////////////////////////////////////////////////

  useEffect(() => {
    loadAll();
    loadServiceCatalogs();
  }, [jobId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      let job: any = null;
      let labour: any[] = [];

      try {
        job = await apiGet<any>(`/jobs/${jobId}`);
      } catch (err) {
        console.error("Error loading job:", err);
        setError("Failed to load job details");
        setLoading(false);
        return;
      }

      const resolvedCustomerId =
        job?.customer_id ?? job?.customerId ?? job?.customer?.id ?? "";
      setCustomerId(String(resolvedCustomerId || ""));

      const resolvedCompanyId = Number(job?.company_id ?? job?.companyId ?? 0);
      if (resolvedCompanyId) {
        setCompanyId(resolvedCompanyId);
        try {
          const templatesData = await apiGet<any[]>(
            `/invoice-templates/${resolvedCompanyId}`,
          );
          const defaultTemplate = templatesData?.find((t: any) => t.is_default);
          if (defaultTemplate) {
            setDefaultTemplateId(defaultTemplate.id);
            const fullTemplate = await apiGet<any>(
              `/invoice-templates/template/${defaultTemplate.id}`,
            );
            setTemplate(fullTemplate);
          }
        } catch (err) {
          console.warn("Could not load default template:", err);
        }
      }

      try {
        const labourData = await apiGet<any[]>(`/jobs/${jobId}/labour`);
        labour = labourData || [];
      } catch (err) {
        console.warn("Could not load labour data:", err);
        labour = [];
      }

      setLineItems([...convertLabour(labour || [])]);
    } catch (err: any) {
      console.error("Error in loadAll:", err);
      setError("Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCatalogs = async () => {
    try {
      const raw = await getServiceCatalogs();
      const catalogs = raw.map((c) => ({ ...c, id: Number(c.id) }));
      setServiceCatalogs(catalogs);
      setSelectedServiceCatalogId(catalogs[0]?.id ?? null);
    } catch (err) {
      console.error(err);
    }
  };

  //////////////////////////////////////////////////////
  // CONVERTERS
  //////////////////////////////////////////////////////

  const convertLabour = (data: any[]) =>
    data.map((entry) => {
      const quantity = Number(entry.chargeable_hours) || 0;
      const price = Number(entry.rate) || 0;
      return {
        id: `labour-${entry.id}`,
        name: `Labour - ${entry.employee_name || ""}`,
        description: entry.notes || `${quantity} hours @ $${price}/hr`,
        quantity,
        price,
        cost: Number(entry.rate) || 0,
        markup: 0,
        tax: 10,
        discount: 0,
        total: Number(entry.total) || quantity * price,
      };
    });

  //////////////////////////////////////////////////////
  // UPDATE
  //////////////////////////////////////////////////////

  const updateItem = (id: string, field: keyof InvoiceLineItem, value: number | string) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = Number(updated.quantity) * Number(updated.price);
        return updated;
      }),
    );
  };

  //////////////////////////////////////////////////////
  // TOTALS
  //////////////////////////////////////////////////////

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  //////////////////////////////////////////////////////
  // CREATE
  //////////////////////////////////////////////////////

  const create = () => {
    onCreate({
      jobId,
      customerId,
      lineItems,
      notes,
      paymentPeriod,
      cardPaymentFee,
      companyId,
      templateId: defaultTemplateId,
      template: template,
    });
  };

  //////////////////////////////////////////////////////
  // ADD / REMOVE
  //////////////////////////////////////////////////////

  const addLine = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        quantity: 1,
        price: 0,
        cost: 0,
        markup: 0,
        tax: 10,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const removeLine = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const addFromCatalog = () => {
    const catalog = serviceCatalogs.find((c) => c.id === selectedServiceCatalogId);
    if (!catalog) return;
    setLineItems((items) => [
      ...items,
      {
        id: `catalog-${catalog.id}-${Date.now()}`,
        name: catalog.name,
        description: "",
        quantity: 1,
        price: 0,
        cost: 0,
        markup: 0,
        tax: 10,
        discount: 0,
        total: 0,
      },
    ]);
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Quick Invoice</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            {FiX({ size: 18 })}
          </button>
        </div>

        {/* Content */}
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
          <>
            {/* Table */}
            <div className={styles.lineItemsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.colName}>Name</div>
                <div className={styles.colQuantity}>Qty</div>
                <div className={styles.colPrice}>Price</div>
                <div className={styles.colTotal}>Total</div>
                <div className={styles.colActions}></div>
              </div>

              {lineItems.length === 0 && (
                <div className={styles.emptyState}>No invoice items</div>
              )}

              {lineItems.map((item) => (
                <div key={item.id} className={styles.lineItemRow}>
                  <input
                    className={styles.inputName}
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                  <input
                    type="number"
                    className={styles.inputQuantity}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className={styles.inputPrice}
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                  />
                  <div className={styles.totalDisplay}>${item.total.toFixed(2)}</div>
                  <button onClick={() => removeLine(item.id)} className={styles.removeBtn}>
                    {FiTrash2({ size: 16 })}
                  </button>
                </div>
              ))}
            </div>

            {/* Service Catalog row — single dropdown */}
            <div className={styles.priceBookRow}>
              <div className={styles.priceBookGroup}>
                <label className={styles.priceBookLabel}>Service Catalog</label>
                <select
                  className={styles.select}
                  value={selectedServiceCatalogId ?? ""}
                  onChange={(e) =>
                    setSelectedServiceCatalogId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  {serviceCatalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={styles.addFromBookBtn}
                disabled={!selectedServiceCatalogId}
                onClick={addFromCatalog}
              >
                Add from Catalog
              </button>
            </div>

            {/* Add Line */}
            <button className={styles.addLineItemBtn} onClick={addLine}>
              {FiPlus({ size: 16 })}
              Add Line
            </button>

            {/* Summary */}
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>GST</span>
                <span>${gst.toFixed(2)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button onClick={onClose} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={create} className={styles.createBtn}>
                Create Invoice
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
