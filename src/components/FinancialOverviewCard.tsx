import React from "react";
import styles from "./FinancialOverviewCard.module.css";

const FinancialOverviewCard: React.FC<{ job: any }> = ({ job }) => {
  const revenue = job.revenue || 0;
  const costs = job.costs || 0;
  const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

  return (
    <div className={styles.cardWide}>
      <h3>Financial Overview</h3>

      <div className={styles.finGrid}>
        <div>
          <div className={styles.finLabel}>Quoted</div>
          <div>${job.quote_value || 0}</div>
        </div>

        <div>
          <div className={styles.finLabel}>Invoiced</div>
          <div>${job.invoiced || 0}</div>
        </div>

        <div>
          <div className={styles.finLabel}>Paid</div>
          <div>${job.paid || 0}</div>
        </div>

        <div>
          <div className={styles.finLabel}>Outstanding</div>
          <div className={styles.danger}>${job.outstanding || 0}</div>
        </div>

        <div>
          <div className={styles.finLabel}>Margin</div>
          <div>{job.margin || 0}%</div>
        </div>

        <div>
          <div className={styles.finLabel}>Est. Profit</div>
          <div>${job.estimated_profit || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverviewCard;
