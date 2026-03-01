/**
 * DashboardGauge Component
 *
 * Displays a single gauge with:
 * - Center: job count
 * - Bottom: total dollar value
 * - Hover: status breakdown list
 */

import React, { useState } from "react";
import styles from "./DashboardGauge.module.css";
import { JobPhase, JobStatus } from "../types/JobLifecycle";
import { GaugeData, getGaugeColor, getStatusColor } from "../types/GaugeData";
import { formatCurrency, formatPercentage } from "../types/JobFinancials";

interface DashboardGaugeProps {
  data: GaugeData;
  onClick?: () => void;
}

const DashboardGauge: React.FC<DashboardGaugeProps> = ({ data, onClick }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const gaugeColor = getGaugeColor(data.phase);
  const isPendingGauge = data.phase === JobPhase.PENDING;

  const pendingStatuses = [
    { status: JobStatus.DRAFT, label: "Draft" },
    { status: JobStatus.NEW, label: "New" },
    { status: JobStatus.NEEDS_QUOTE, label: "Needs Quote" },
  ];

  const pendingBreakdown = pendingStatuses.map(({ status, label }) => {
    const match = data.statusBreakdown.find((item) => item.status === status);
    return { status, label, count: match?.count ?? 0 };
  });

  const pendingTotal = pendingBreakdown.reduce((sum, item) => sum + item.count, 0);
  const pendingGradient =
    pendingTotal > 0
      ? (() => {
          let runningPercent = 0;
          const stops = pendingBreakdown.map((item, index) => {
            const color = getStatusColor(item.status);
            const width =
              index === pendingBreakdown.length - 1
                ? 100 - runningPercent
                : (item.count / pendingTotal) * 100;
            const start = runningPercent;
            const end = runningPercent + width;
            runningPercent = end;
            return `${color} ${start}% ${end}%`;
          });
          return `linear-gradient(90deg, ${stops.join(", ")})`;
        })()
      : `linear-gradient(90deg, ${getStatusColor(JobStatus.DRAFT)} 0% 33.333%, ${getStatusColor(
          JobStatus.NEW
        )} 33.333% 66.666%, ${getStatusColor(JobStatus.NEEDS_QUOTE)} 66.666% 100%)`;

  const gaugeStyle = isPendingGauge
    ? { backgroundColor: gaugeColor, backgroundImage: pendingGradient }
    : { backgroundColor: gaugeColor };

  return (
    <div
      className={styles.gauge}
      style={gaugeStyle}
      onMouseEnter={() => setShowBreakdown(true)}
      onMouseLeave={() => setShowBreakdown(false)}
      onClick={onClick}
    >
      {/* Header: Label and Description */}
      <div className={styles.header}>
        <h3 className={styles.label}>{data.label}</h3>
        <p className={styles.description}>{data.description}</p>
        {isPendingGauge && (
          <div className={styles.pendingLegend}>
            {pendingStatuses.map((item) => (
              <span key={item.status} className={styles.pendingLegendItem}>
                <span
                  className={styles.pendingSwatch}
                  style={{ backgroundColor: getStatusColor(item.status) }}
                />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Center: Job Count (Large) */}
      <div className={styles.center}>
        <div className={styles.jobCount}>{data.jobCount}</div>
        <div className={styles.jobLabel}>
          {data.jobCount === 1 ? "Job" : "Jobs"}
        </div>
      </div>

      {/* Bottom: Total Value */}
      <div className={styles.bottom}>
        <div className={styles.totalValue}>
          {formatCurrency(data.totalValue)}
        </div>
      </div>

      {/* Hover Breakdown */}
      {showBreakdown && data.statusBreakdown.length > 0 && (
        <div className={styles.breakdown}>
          <div className={styles.breakdownTitle}>{data.label} Status</div>
          <ul className={styles.breakdownList}>
            {data.statusBreakdown.map((item) => (
              <li key={item.status} className={styles.breakdownItem}>
                <span className={styles.statusName}>{item.label}</span>
                <span className={styles.statusCount}>{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DashboardGauge;
