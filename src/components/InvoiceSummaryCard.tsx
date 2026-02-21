import React from "react";
import { InvoiceSummary } from "../types/invoice";
import styles from "./InvoiceSummaryCard.module.css";
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

interface InvoiceSummaryCardProps {
  summary: InvoiceSummary;
}

const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const paidPercentage = calculatePercentage(
    summary.totalPaid,
    summary.totalClaimed,
  );

  return (
    <div className={styles.summaryGrid}>
      {/* Total Claimed */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <BanknotesIcon className={styles.cardIcon} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Total Claimed</div>
            <div className={styles.cardValue}>
              {formatCurrency(summary.totalClaimed)}
            </div>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerLabel}>Incl. GST</span>
          <span className={styles.footerValue}>
            {formatCurrency(summary.totalGst)}
          </span>
        </div>
      </div>

      {/* Total Unpaid */}
      <div className={`${styles.summaryCard} ${styles.unpaidCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrapper} ${styles.unpaidIcon}`}>
            <ClockIcon className={styles.cardIcon} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Outstanding</div>
            <div className={`${styles.cardValue} ${styles.unpaidValue}`}>
              {formatCurrency(summary.totalUnpaid)}
            </div>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${100 - paidPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Total Paid */}
      <div className={`${styles.summaryCard} ${styles.paidCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrapper} ${styles.paidIcon}`}>
            <CheckCircleIcon className={styles.cardIcon} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Paid</div>
            <div className={`${styles.cardValue} ${styles.paidValue}`}>
              {formatCurrency(summary.totalPaid)}
            </div>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${styles.paidProgress}`}
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* GST Amount */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <ReceiptPercentIcon className={styles.cardIcon} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>GST Collected</div>
            <div className={styles.cardValue}>
              {formatCurrency(summary.totalGst)}
            </div>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerLabel}>Tax payable</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummaryCard;
