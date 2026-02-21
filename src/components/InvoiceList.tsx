import React, { useEffect, useState } from "react";
import { Invoice } from "../types/invoice";
import {
  FiMoreVertical,
  FiDownload,
  FiCopy,
  FiTrash2,
  FiFileText,
  FiSend,
} from "react-icons/fi";
import styles from "./InvoiceList.module.css";

interface InvoiceListProps {
  invoices: Invoice[];
  onView?: (invoiceId: string) => void;
  onEdit: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => void;
  onDuplicate: (invoiceId: string) => void;
  onSyncToXero: (invoiceId: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onSyncToXero,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return styles.statusDraft;
      case "UNPAID":
        return styles.statusUnpaid;
      case "PAID":
        return styles.statusPaid;
      case "OVERDUE":
        return styles.statusOverdue;
      case "PARTIALLY_PAID":
        return styles.statusPartiallyPaid;
      default:
        return styles.statusDraft;
    }
  };

  const getDeliveryBadgeClass = (delivery: string) => {
    switch (delivery) {
      case "NOT_SENT":
        return styles.deliveryNotSent;
      case "SENT":
        return styles.deliverySent;
      case "VIEWED":
        return styles.deliveryViewed;
      default:
        return styles.deliveryNotSent;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "DRAFT":
        return styles.typeDraft;
      case "APPROVED":
        return styles.typeApproved;
      default:
        return styles.typeDraft;
    }
  };

  const getMenuPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 220;
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right - menuWidth;
    left = Math.max(
      padding,
      Math.min(left, viewportWidth - menuWidth - padding),
    );

    let top = rect.bottom + 8;
    if (top + menuHeight > viewportHeight - padding) {
      top = Math.max(padding, rect.top - menuHeight - 8);
    }

    return { top, left };
  };

  const toggleMenu = (invoiceId: string, buttonElement?: HTMLButtonElement) => {
    if (openMenuId === invoiceId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      if (buttonElement) {
        setMenuPosition(getMenuPosition(buttonElement));
      }
      setOpenMenuId(invoiceId);
    }
  };

  useEffect(() => {
    if (!openMenuId) return;

    const closeMenu = () => {
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openMenuId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className={styles.invoiceList}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>INVOICING</th>
              <th>TYPE</th>
              <th>DELIVERY</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>SUBTOTAL</th>
              <th>TOTAL (WITH TAX)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>
                  No data available
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => onEdit(invoice.id)}
                  className={styles.clickableRow}
                >
                  <td>
                    <div className={styles.invoiceNumber}>
                      {invoice.invoiceNumber}
                    </div>
                    {invoice.xeroSyncStatus === "SYNCED" && (
                      <div className={styles.xeroTag}>Xero</div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${getTypeBadgeClass(invoice.type)}`}
                    >
                      {invoice.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${getDeliveryBadgeClass(invoice.deliveryStatus)}`}
                    >
                      {invoice.deliveryStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${getStatusBadgeClass(invoice.status)}`}
                    >
                      {invoice.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>{formatDate(invoice.createdAt)}</td>
                  <td>{formatCurrency(invoice.subtotal)}</td>
                  <td className={styles.totalColumn}>
                    {formatCurrency(invoice.totalWithTax)}
                  </td>
                  <td>
                    <div className={styles.menuContainer}>
                      <button
                        className={styles.menuBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(invoice.id, e.currentTarget);
                        }}
                        title="More options"
                      >
                        {FiMoreVertical({})}
                      </button>

                      {openMenuId === invoice.id && menuPosition && (
                        <div
                          className={styles.dropdown}
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className={styles.menuItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              onView ? onView(invoice.id) : onEdit(invoice.id);
                              setOpenMenuId(null);
                            }}
                          >
                            {FiFileText({})} View/Edit
                          </button>
                          <button
                            className={styles.menuItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implement download
                              setOpenMenuId(null);
                            }}
                          >
                            {FiDownload({})} Download PDF
                          </button>
                          {!invoice.xeroInvoiceId && (
                            <button
                              className={styles.menuItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSyncToXero(invoice.id);
                                setOpenMenuId(null);
                              }}
                            >
                              {FiSend({})} Sync to Xero
                            </button>
                          )}
                          <button
                            className={styles.menuItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate(invoice.id);
                              setOpenMenuId(null);
                            }}
                          >
                            {FiCopy({})} Duplicate
                          </button>
                          <button
                            className={`${styles.menuItem} ${styles.menuItemDanger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(invoice.id);
                              setOpenMenuId(null);
                            }}
                          >
                            {FiTrash2({})} Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;
