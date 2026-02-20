// src/components/CostReportTable.tsx
import React from "react";
import styles from "./CostReportTable.module.css";
import { CostEntry } from "../types/costReport";

interface CostReportTableProps {
  entries: CostEntry[];
}

const CostReportTable: React.FC<CostReportTableProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No cost entries found</p>
      </div>
    );
  }

  const totalCost = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const totalPrice = entries.reduce((sum, entry) => sum + entry.totalPrice, 0);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>JOB PHASE</th>
            <th>TYPE</th>
            <th>NAME</th>
            <th className={styles.numeric}>QTY</th>
            <th className={styles.numeric}>UNIT COST</th>
            <th className={styles.numeric}>TOTAL COST</th>
            <th className={styles.numeric}>UNIT PRICE</th>
            <th className={styles.numeric}>TOTAL PRICE</th>
            <th className={styles.numeric}>MARKUP %</th>
            <th>TRANSACTION DATE</th>
            <th>DATE ENTERED</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className={styles.row}>
              <td>
                <a href="#" className={styles.link}>
                  {entry.jobPhase}
                </a>
              </td>
              <td>
                <span className={styles.badge}>{entry.type}</span>
              </td>
              <td>{entry.name}</td>
              <td className={styles.numeric}>{entry.qty.toFixed(2)}</td>
              <td className={styles.numeric}>${entry.unitCost.toFixed(2)}</td>
              <td className={styles.numeric}>${entry.totalCost.toFixed(2)}</td>
              <td className={styles.numeric}>${entry.unitPrice.toFixed(2)}</td>
              <td className={styles.numeric}>${entry.totalPrice.toFixed(2)}</td>
              <td className={styles.numeric}>
                {entry.markupPercent.toFixed(2)}%
              </td>
              <td>{entry.transactionDate}</td>
              <td>{entry.dateEntered}</td>
              <td>
                <span
                  className={`${styles.statusBadge} ${styles[`status-${entry.status.toLowerCase().replace(" ", "-")}`]}`}
                >
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Row */}
      <div className={styles.totalRow}>
        <div className={styles.totalContent}>
          <span className={styles.totalLabel}>TOTALS</span>
        </div>
        <div className={styles.totalValues}>
          <span>${totalCost.toFixed(2)}</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CostReportTable;
