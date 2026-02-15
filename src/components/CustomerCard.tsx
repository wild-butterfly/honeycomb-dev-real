import React from "react";
import styles from "./CustomerCard.module.css";

const CustomerCard: React.FC<{ job: any }> = ({ job }) => {
  return (
    <div className={styles.card}>
      <h3>Customer</h3>

      <div className={styles.primary}>{job.client}</div>
      <div className={styles.secondary}>{job.address}</div>

      <div className={styles.divider} />

      <div className={styles.infoRow}>
        <span>Phone</span>
        <span>{job.phone || "—"}</span>
      </div>

      <div className={styles.infoRow}>
        <span>Email</span>
        <span>{job.email || "—"}</span>
      </div>

      <div className={styles.infoRow}>
        <span>Customer Type</span>
        <span>{job.customer_type || "Commercial"}</span>
      </div>

      <div className={styles.infoRow}>
        <span>Outstanding</span>
        <span className={styles.danger}>${job.outstanding || 0}</span>
      </div>
    </div>
  );
};

export default CustomerCard;
