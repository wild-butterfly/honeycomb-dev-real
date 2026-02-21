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
import type {
  ServiceCatalog,
  ServiceCatalogItem,
} from "../types/serviceCatalogs";
import {
  getServiceCatalogItems,
  getServiceCatalogs,
} from "../services/serviceCatalogs";

import styles from "./QuickInvoiceModal.module.css";

interface Props {
  jobId: string;
  onClose: () => void;
  onCreate: (data: QuickInvoiceData) => void;
}

export default function QuickInvoiceModal({ jobId, onClose, onCreate }: Props) {
  // State
  const [customerId, setCustomerId] = useState<string>("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentPeriod, setPaymentPeriod] =
    useState<PaymentPeriod>("ON_COMPLETION");
  const [cardPaymentFee, setCardPaymentFee] =
    useState<CardPaymentFeeOption>("COMPANY_SETTING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Service Catalogs State
  const [serviceCatalogs, setServiceCatalogs] = useState<ServiceCatalog[]>([]);
  const [selectedServiceCatalogId, setSelectedServiceCatalogId] = useState<
    number | null
  >(null);
  const [serviceCatalogItems, setServiceCatalogItems] = useState<
    ServiceCatalogItem[]
  >([]);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<
    number | null
  >(null);
  const [catalogError, setCatalogError] = useState("");
  const selectedCatalogItem = serviceCatalogItems.find(
    (item) => Number(item.id) === Number(selectedCatalogItemId),
  );

  //////////////////////////////////////////////////////
  // LOAD DATA
  //////////////////////////////////////////////////////

  useEffect(() => {
    loadAll();
    loadServiceCatalogs();
  }, [jobId]);

  useEffect(() => {
    if (selectedServiceCatalogId) {
      loadServiceCatalogItems(selectedServiceCatalogId);
    } else {
      setServiceCatalogItems([]);
      setSelectedCatalogItemId(null);
    }
  }, [selectedServiceCatalogId]);

  const loadAll = async () => {
    try {
      setLoading(true);

      setError("");

      const [job, labour, materials, subs, fees] = await Promise.all([
        apiGet<any>(`/jobs/${jobId}`),

        apiGet<any[]>(`/jobs/${jobId}/labour`),

        apiGet<any[]>(`/jobs/${jobId}/materials`).catch(() => []),

        apiGet<any[]>(`/jobs/${jobId}/subcontractors`).catch(() => []),

        apiGet<any[]>(`/jobs/${jobId}/fees`).catch(() => []),
      ]);

      setCustomerId(job?.customer_id || "");

      const items = [
        ...convertLabour(labour || []),

        ...convertMaterials(materials || []),

        ...convertSubs(subs || []),

        ...convertFees(fees || []),
      ];

      setLineItems(items);
    } catch (err: any) {
      console.error(err);

      setError("Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCatalogs = async () => {
    try {
      const catalogs = await getServiceCatalogs();
      setServiceCatalogs(catalogs);
      setSelectedServiceCatalogId(catalogs[0]?.id ?? null);
      setCatalogError("");
    } catch (err) {
      console.error(err);
    }
  };

  const loadServiceCatalogItems = async (serviceCatalogId: number) => {
    try {
      const items = await getServiceCatalogItems(serviceCatalogId);
      const normalized = items.map((item) => ({
        ...item,
        id: Number(item.id),
        service_catalog_id: Number(item.service_catalog_id),
        cost_price: Number(item.cost_price) || 0,
        sell_price: Number(item.sell_price) || 0,
        tax_rate: Number(item.tax_rate) || 10,
      }));
      setServiceCatalogItems(normalized);
      setSelectedCatalogItemId(normalized[0]?.id ?? null);
      setCatalogError("");
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

  const convertMaterials = (data: any[]) =>
    data.map((entry) => ({
      id: `material-${entry.id}`,

      name: entry.name,

      description: entry.description,

      quantity: Number(entry.quantity) || 0,

      price: Number(entry.sell_price) || 0,

      cost: Number(entry.cost_price) || 0,

      markup: 0,

      tax: 10,

      discount: 0,

      total: entry.quantity * entry.sell_price,
    }));

  const convertSubs = (data: any[]) =>
    data.map((entry) => ({
      id: `sub-${entry.id}`,

      name: entry.company,

      description: "Subcontractor",

      quantity: 1,

      price: Number(entry.sell_price) || 0,

      cost: Number(entry.cost_price) || 0,

      markup: 0,

      tax: 10,

      discount: 0,

      total: entry.sell_price,
    }));

  const convertFees = (data: any[]) =>
    data.map((entry) => ({
      id: `fee-${entry.id}`,

      name: entry.name,

      description: "Job Fee",

      quantity: 1,

      price: Number(entry.amount) || 0,

      cost: 0,

      markup: 0,

      tax: 10,

      discount: 0,

      total: entry.amount,
    }));

  //////////////////////////////////////////////////////
  // UPDATE
  //////////////////////////////////////////////////////

  const updateItem = (
    id: string,
    field: keyof InvoiceLineItem,
    value: number | string,
  ) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = {
          ...item,
          [field]: value,
        };

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

  const addPriceBookItem = (item?: ServiceCatalogItem | null) => {
    if (!item) {
      setCatalogError("Select a catalog item to add.");
      return;
    }

    setCatalogError("");

    const price = Number(item.sell_price) || 0;

    setLineItems((items) => [
      ...items,
      {
        id: `price-book-${item.id}-${Date.now()}`,
        name: item.name,
        description: item.description || "",
        quantity: 1,
        price,
        cost: Number(item.cost_price) || 0,
        markup: 0,
        tax: Number(item.tax_rate) || 10,
        discount: 0,
        total: price,
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
                    onChange={(e) =>
                      updateItem(item.id, "name", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    className={styles.inputQuantity}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", Number(e.target.value))
                    }
                  />

                  <input
                    type="number"
                    className={styles.inputPrice}
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.id, "price", Number(e.target.value))
                    }
                  />

                  <div className={styles.totalDisplay}>
                    ${item.total.toFixed(2)}
                  </div>

                  <button
                    onClick={() => removeLine(item.id)}
                    className={styles.removeBtn}
                  >
                    {FiTrash2({ size: 16 })}
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.priceBookRow}>
              <div className={styles.priceBookGroup}>
                <label className={styles.priceBookLabel}>Service Catalog</label>
                <select
                  className={styles.select}
                  value={selectedServiceCatalogId ?? ""}
                  onChange={(e) =>
                    setSelectedServiceCatalogId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  {serviceCatalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.priceBookGroup}>
                <label className={styles.priceBookLabel}>Item</label>
                <select
                  className={styles.select}
                  value={selectedCatalogItemId ?? ""}
                  onChange={(e) => {
                    setSelectedCatalogItemId(
                      e.target.value ? Number(e.target.value) : null,
                    );
                    setCatalogError("");
                  }}
                >
                  {serviceCatalogItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={styles.addFromBookBtn}
                disabled={!selectedCatalogItem}
                onClick={() => addPriceBookItem(selectedCatalogItem)}
              >
                Add from Catalog
              </button>
            </div>

            {catalogError && <div className={styles.error}>{catalogError}</div>}

            {/* Add */}

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
