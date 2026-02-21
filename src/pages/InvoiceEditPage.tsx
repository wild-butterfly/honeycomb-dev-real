import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Invoice,
  InvoiceLineItem,
  InvoiceMargins,
  PaymentPeriod,
  CardPaymentFeeOption,
} from "../types/invoice";
import InvoiceLineItemComponent from "../components/InvoiceLineItemComponent";
import InvoiceMarginsDisplay from "../components/InvoiceMarginsDisplay";
import styles from "./InvoiceEditPage.module.css";
import { apiGet, apiPost, apiPut } from "../services/api";
import type {
  ServiceCatalog,
  ServiceCatalogItem,
} from "../types/serviceCatalogs";
import {
  getServiceCatalogItems,
  getServiceCatalogs,
} from "../services/serviceCatalogs";
import {
  FiEdit,
  FiCheck,
  FiDownload,
  FiPrinter,
  FiEye,
  FiTrash2,
  FiCopy,
  FiMoreVertical,
} from "react-icons/fi";

const InvoiceEditPage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [margins, setMargins] = useState<InvoiceMargins | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
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

  useEffect(() => {
    loadInvoice();
    loadServiceCatalogs();
  }, [invoiceId]);

  useEffect(() => {
    if (selectedServiceCatalogId) {
      loadServiceCatalogItems(selectedServiceCatalogId);
    } else {
      setServiceCatalogItems([]);
      setSelectedCatalogItemId(null);
    }
  }, [selectedServiceCatalogId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await apiGet<any>(`/invoices/${invoiceId}`);
      setInvoice(data.invoice);
      setMargins(data.margins);
    } catch (error) {
      console.error("Error loading invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCatalogs = async () => {
    try {
      const catalogs = await getServiceCatalogs();
      setServiceCatalogs(catalogs);
      setSelectedServiceCatalogId(catalogs[0]?.id ?? null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadServiceCatalogItems = async (serviceCatalogId: number) => {
    try {
      const items = await getServiceCatalogItems(serviceCatalogId);
      setServiceCatalogItems(items);
      setSelectedCatalogItemId(items[0]?.id ?? null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLineItem = (
    itemId: string,
    field: keyof InvoiceLineItem,
    value: any,
  ) => {
    if (!invoice) return;

    const updatedItems = invoice.lineItems.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        // Recalculate total
        const basePrice = updated.price * updated.quantity;
        const discountAmount = basePrice * (updated.discount / 100);
        const afterDiscount = basePrice - discountAmount;
        const taxAmount = afterDiscount * (updated.tax / 100);
        updated.total = afterDiscount + taxAmount;
        return updated;
      }
      return item;
    });

    setInvoice({
      ...invoice,
      lineItems: updatedItems,
    });
  };

  const handleAddLineItem = () => {
    if (!invoice) return;

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      name: "",
      description: "",
      quantity: 1,
      cost: 0,
      price: 0,
      markup: 0,
      tax: 10,
      discount: 0,
      total: 0,
    };

    setInvoice({
      ...invoice,
      lineItems: [...invoice.lineItems, newItem],
    });
  };

  const addPriceBookItem = (item?: ServiceCatalogItem | null) => {
    if (!invoice || !item) return;

    const price = Number(item.sell_price) || 0;

    const newItem: InvoiceLineItem = {
      id: `price-book-${item.id}-${Date.now()}`,
      name: item.name,
      description: item.description || "",
      quantity: 1,
      cost: Number(item.cost_price) || 0,
      price,
      markup: 0,
      tax: Number(item.tax_rate) || 10,
      discount: 0,
      total: price,
    };

    setInvoice({
      ...invoice,
      lineItems: [...invoice.lineItems, newItem],
    });
  };

  const handleRemoveLineItem = (itemId: string) => {
    if (!invoice) return;

    setInvoice({
      ...invoice,
      lineItems: invoice.lineItems.filter((item) => item.id !== itemId),
    });
  };

  const handleApplyLabourDiscount = (discount: number) => {
    if (!invoice) return;
    setInvoice({ ...invoice, labourDiscount: discount });
  };

  const handleApplyMaterialDiscount = (discount: number) => {
    if (!invoice) return;
    setInvoice({ ...invoice, materialDiscount: discount });
  };

  const handleApplyMaterialMarkup = (markup: number) => {
    if (!invoice) return;
    setInvoice({ ...invoice, materialMarkup: markup });
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      setSaving(true);
      await apiPut(`/invoices/${invoiceId}`, invoice);
      alert("Invoice saved successfully");
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Error saving invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!invoice) return;

    try {
      setSaving(true);
      await apiPost(`/invoices/${invoiceId}/approve`, {});
      setInvoice({ ...invoice, type: "APPROVED", status: "UNPAID" });
      alert("Invoice approved");
    } catch (error) {
      console.error("Error approving invoice:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
  };

  const handlePreview = () => {
    // TODO: Implement preview
    window.open(`/api/invoices/${invoiceId}/preview`, "_blank");
  };

  const calculateSubtotal = () => {
    if (!invoice) return 0;
    return invoice.lineItems.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      const discountAmount = basePrice * (item.discount / 100);
      return sum + (basePrice - discountAmount);
    }, 0);
  };

  const calculateTax = () => {
    if (!invoice) return 0;
    return invoice.lineItems.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      const discountAmount = basePrice * (item.discount / 100);
      const afterDiscount = basePrice - discountAmount;
      return sum + afterDiscount * (item.tax / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  if (loading) {
    return <div className={styles.loading}>Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className={styles.error}>Invoice not found</div>;
  }

  const isDraft = invoice.type === "DRAFT";

  return (
    <div className={styles.invoiceEditPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className={styles.title}>
            {invoice.invoiceNumber} - {invoice.jobName}
          </h1>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.actionBtn} onClick={handlePreview}>
            {FiEye({})} Preview
          </button>
          <button className={styles.actionBtn} onClick={handleDownloadPDF}>
            {FiDownload({})} Download
          </button>
          {isDraft && (
            <button className={styles.primaryBtn} onClick={handleApprove}>
              {FiCheck({})} Approve
            </button>
          )}
          {!isDraft && (
            <button className={styles.primaryBtn} onClick={handleSave}>
              {FiCheck({})} Save
            </button>
          )}
        </div>
      </div>

      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn}>Add Costs</button>
        <button className={styles.toolbarBtn}>Margins</button>
        <button className={styles.toolbarBtn}>Payment Terms</button>
        <div className={styles.toolbarSpacer}></div>
        <div className={styles.paymentsToggle}>
          <span>Online payments</span>
          <button
            className={`${styles.toggle} ${
              invoice.onlinePaymentsEnabled ? styles.toggleOn : ""
            }`}
            onClick={() =>
              setInvoice({
                ...invoice,
                onlinePaymentsEnabled: !invoice.onlinePaymentsEnabled,
              })
            }
          >
            <span className={styles.toggleHandle} />
          </button>
        </div>
      </div>

      <div className={styles.statusBar}>
        <span
          className={`${styles.statusBadge} ${styles[invoice.type.toLowerCase()]}`}
        >
          {invoice.type}
        </span>
        <span
          className={`${styles.statusBadge} ${styles[invoice.status.toLowerCase()]}`}
        >
          {invoice.status}
        </span>
        {invoice.xeroSyncStatus === "SYNCED" && (
          <span className={styles.xeroSyncBadge}>Synced to Xero</span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          {/* Line Items Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Line Items</h2>
              <button className={styles.addBtn} onClick={handleAddLineItem}>
                + Add a line item
              </button>
            </div>

            <div className={styles.lineItemsTable}>
              <div className={styles.tableHeader}>
                <span className={styles.colName}>Name</span>
                <span className={styles.colQuantity}>Quantity</span>
                <span className={styles.colCost}>Cost</span>
                <span className={styles.colPrice}>Price</span>
                <span className={styles.colMarkup}>Markup</span>
                <span className={styles.colTax}>Tax</span>
                <span className={styles.colDiscount}>Discount</span>
                <span className={styles.colTotal}>Total</span>
                <span className={styles.colActions}></span>
              </div>

              {invoice.lineItems.map((item) => (
                <InvoiceLineItemComponent
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateLineItem}
                  onRemove={handleRemoveLineItem}
                />
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
                  onChange={(e) =>
                    setSelectedCatalogItemId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
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
                onClick={() =>
                  addPriceBookItem(
                    serviceCatalogItems.find(
                      (item) => item.id === selectedCatalogItemId,
                    ),
                  )
                }
              >
                Add from Catalog
              </button>
            </div>
          </div>

          {/* Margins & Discounts */}
          {margins && (
            <InvoiceMarginsDisplay
              margins={margins}
              labourDiscount={invoice.labourDiscount}
              materialDiscount={invoice.materialDiscount}
              materialMarkup={invoice.materialMarkup}
              onApplyLabourDiscount={handleApplyLabourDiscount}
              onApplyMaterialDiscount={handleApplyMaterialDiscount}
              onApplyMaterialMarkup={handleApplyMaterialMarkup}
            />
          )}

          {/* Payment Terms */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment Terms</h2>
            <div className={styles.formGroup}>
              <label>Payment Period</label>
              <select
                className={styles.select}
                value={invoice.paymentPeriod}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    paymentPeriod: e.target.value as PaymentPeriod,
                  })
                }
              >
                <option value="CUSTOM">Custom date</option>
                <option value="30_DAYS">30 Days</option>
                <option value="21_DAYS">21 Days</option>
                <option value="14_DAYS">14 Days</option>
                <option value="7_DAYS">7 Days</option>
                <option value="5_DAYS">5 Days</option>
                <option value="ON_COMPLETION">Payment on completion</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Card Payment Fee</label>
              <select
                className={styles.select}
                value={invoice.cardPaymentFee}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    cardPaymentFee: e.target.value as CardPaymentFeeOption,
                  })
                }
              >
                <option value="COMPANY_SETTING">Company setting</option>
                <option value="ABSORB">Absorb the fee</option>
                <option value="PASS_ON">Pass on to the customer</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          {/* Invoice Summary */}
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Invoice Summary</h3>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>GST Amount</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditPage;
