// src/components/FinancialOverviewCard.tsx
// Honeycomb © 2026

import React from "react";
import styles from "./FinancialOverviewCard.module.css";

import {
  BanknotesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface Props {
  job: any;
}

const FinancialOverviewCard: React.FC<Props> = ({ job }) => {
  const quoted = job?.quoted ?? 0;
  const invoiced = job?.invoiced ?? 0;
  const paid = job?.paid ?? 0;

  const outstanding = invoiced - paid;

  return (
    <div className={styles.card}>
      {/* HEADER */}

      <div className={styles.header}>
        <BanknotesIcon className={styles.headerIcon} />

        <div className={styles.title}>Financial Overview</div>
      </div>

      {/* BODY */}

      <div className={styles.body}>
        {/* QUOTED */}

        <div className={styles.row}>
          <DocumentTextIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Quoted</div>

            <div className={styles.value}>${quoted}</div>
          </div>
        </div>

        {/* INVOICED */}

        <div className={styles.row}>
          <BanknotesIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Invoiced</div>

            <div className={styles.value}>${invoiced}</div>
          </div>
        </div>

        {/* PAID */}

        <div className={styles.row}>
          <CheckCircleIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Paid</div>

            <div className={styles.paid}>${paid}</div>
          </div>
        </div>

        {/* OUTSTANDING */}

        <div className={styles.row}>
          <ExclamationCircleIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Outstanding</div>

            <div className={outstanding > 0 ? styles.outstanding : styles.zero}>
              ${outstanding}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverviewCard;
