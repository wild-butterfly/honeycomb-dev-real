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
          >
            {FiDownload({})}
            Download
          </button>
          {!invoice.xeroInvoiceId && (
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => onSyncXero?.(invoice.id)}
            >
              {FiSend({})}
              Xero
            </button>
          )}
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => onEdit?.(invoice.id)}
          >
            {FiEdit2({})}
            Edit
          </button>
        </div>
      </div>
    </>
  );
};

export default InvoiceSidePanel;
