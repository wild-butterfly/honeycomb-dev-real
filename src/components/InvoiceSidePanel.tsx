import React from "react";
import { FiX, FiDownload, FiSend, FiEdit2 } from "react-icons/fi";
import { Invoice } from "../types/invoice";
import styles from "./InvoiceSidePanel.module.css";

interface InvoiceSidePanelProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (invoiceId: string) => void;
  onApprove?: (invoiceId: string) => void;
  onDownload?: (invoiceId: string) => void;
  onSyncXero?: (invoiceId: string) => void;
}

const InvoiceSidePanel: React.FC<InvoiceSidePanelProps> = ({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onApprove,
  onDownload,
  onSyncXero,
}) => {
  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "draft";
      case "PAID":
        return "paid";
      case "UNPAID":
        return "unpaid";
      case "OVERDUE":
        return "overdue";
      default:
        return "draft";
    }
  };

  const getDeliveryColor = (delivery: string) => {
    switch (delivery) {
      case "NOT_SENT":
        return "notSent";
      case "SENT":
        return "sent";
      case "VIEWED":
        return "viewed";
      default:
        return "notSent";
    }
  };

  // Calculate margins & profitability
  const cost = invoice.subtotal * 0.4; // Assume 40% cost ratio (can be dynamic)
  const labourCost = cost * 0.7;
  const materialCost = cost * 0.3;
  const grossProfit = invoice.subtotal - cost;
  const grossMargin =
    invoice.subtotal > 0 ? (grossProfit / invoice.subtotal) * 100 : 0;
  const discount = invoice.subtotal * 0; // Placeholder for actual discount
  const labourDiscount = 0;
  const materialDiscount = 0;
  const materialMarkup = 0;

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div className={`${styles.panel} ${isOpen ? styles.open : ""}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>{invoice.invoiceNumber}</h2>
            <p className={styles.subtitle}>{invoice.invoiceNumber}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            {FiX({})}
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Badges */}
          <div className={styles.badges}>
            <span
              className={`${styles.badge} ${styles[getStatusColor(invoice.status)]}`}
            >
              {invoice.status}
            </span>
            <span
              className={`${styles.badge} ${styles[getDeliveryColor(invoice.deliveryStatus)]}`}
            >
              {invoice.deliveryStatus.replace("_", " ")}
            </span>
          </div>

          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Subtotal</div>
              <div className={styles.cardValue}>
                ${invoice.subtotal.toFixed(2)}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Tax</div>
              <div className={styles.cardValue}>
                ${invoice.taxAmount.toFixed(2)}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Total</div>
              <div className={styles.cardValueTotal}>
                ${invoice.totalWithTax.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div className={styles.dateSection}>
            <span className={styles.dateLabel}>Created:</span>
            <span className={styles.dateValue}>
              {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Line Items */}
          <div className={styles.lineItemsSection}>
            <h3 className={styles.sectionTitle}>Line Items</h3>
            <div className={styles.lineItemsList}>
              {/* Placeholder - would show actual line items */}
              <div className={styles.lineItemCount}>
                ({invoice.subtotal > 0 ? "Items included" : "No items"})
              </div>
            </div>
          </div>

          {/* Job Margins Section */}
          <div className={styles.marginSection}>
            <h3 className={styles.sectionTitle}>Job Margins</h3>
            <div className={styles.marginBreakdown}>
              <div className={styles.marginRow}>
                <span className={styles.marginLabel}>Overall Cost</span>
                <span className={styles.marginValue}>${cost.toFixed(2)}</span>
              </div>
              <div className={styles.marginRow}>
                <span className={styles.marginLabel}>Charged So Far</span>
                <span className={styles.marginValueHighlight}>
                  ${invoice.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Gross Profit Section */}
          <div className={styles.profitSection}>
            <div className={styles.profitGrid}>
              <div className={styles.profitCard}>
                <div className={styles.profitValue}>
                  ${grossProfit.toFixed(2)}
                </div>
                <div className={styles.profitLabel}>
                  {grossMargin.toFixed(0)}% Margin
                </div>
              </div>
            </div>
          </div>

          {/* Markup & Discount Section */}
          <div className={styles.markupSection}>
            <h3 className={styles.sectionTitle}>Markups & Discounts</h3>
            <div className={styles.markupTable}>
              <div className={styles.markupRow}>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Labour Discount</label>
                  <div className={styles.markupInput}>
                    <span>${labourDiscount.toFixed(2)}</span>
                    <small>%</small>
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Cost</label>
                  <div className={styles.markupValue}>
                    ${labourCost.toFixed(2)}
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Charge</label>
                  <div className={styles.markupValue}>
                    ${(invoice.subtotal * 0.7).toFixed(2)}
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Margin</label>
                  <div className={styles.markupValue}>70%</div>
                </div>
              </div>

              <div className={styles.markupRow}>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>
                    Material Discount
                  </label>
                  <div className={styles.markupInput}>
                    <span>${materialDiscount.toFixed(2)}</span>
                    <small>%</small>
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Cost</label>
                  <div className={styles.markupValue}>
                    ${materialCost.toFixed(2)}
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Charge</label>
                  <div className={styles.markupValue}>
                    ${(invoice.subtotal * 0.3).toFixed(2)}
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Margin</label>
                  <div className={styles.markupValue}>0%</div>
                </div>
              </div>

              <div
                className={styles.markupRow}
                style={{ borderTop: "2px solid #ffe066" }}
              >
                <div className={styles.markupCol}>
                  <label className={styles.markupLabel}>Total</label>
                </div>
                <div className={styles.markupCol}>
                  <div className={styles.markupValue}>${cost.toFixed(2)}</div>
                </div>
                <div className={styles.markupCol}>
                  <div className={styles.markupValue}>
                    ${invoice.subtotal.toFixed(2)}
                  </div>
                </div>
                <div className={styles.markupCol}>
                  <div className={styles.markupValue}>
                    {grossMargin.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {invoice.status === "DRAFT" && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onApprove?.(invoice.id)}
            >
              Approve
            </button>
          )}
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => onDownload?.(invoice.id)}
            title="Download invoice as PDF"
          >
            Download
          </button>
          {!invoice.xeroInvoiceId && (
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => onSyncXero?.(invoice.id)}
              title="Sync to Xero"
            >
              {FiSend({ size: 20 })}
              Xero
            </button>
          )}
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => onEdit?.(invoice.id)}
            title="Edit invoice details"
          >
            {FiEdit2({ size: 20 })}
            Edit
          </button>
        </div>
      </div>
    </>
  );
};

export default InvoiceSidePanel;
