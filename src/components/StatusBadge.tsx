import React from "react";
import styles from "./StatusBadge.module.css";
import type { JobStatus } from "../types/JobStatus";
type Props = {
  status?: JobStatus;
};

const statusColors: Record<JobStatus, string> = {
  completed: "#d8f5d2",
  return: "#fff3cd",
  quote: "#e8ddff",
  active: "#dff5f5",
};

const statusLabel: Record<JobStatus, string> = {
  completed: "COMPLETED",
  return: "NEED TO RETURN",
  quote: "QUOTE",
  active: "ACTIVE",
};

const StatusBadge: React.FC<Props> = ({ status }) => {
  if (!status) return null;

  return (
    <span className={styles.badge} style={{ background: statusColors[status] }}>
      {statusLabel[status]}
    </span>
  );
};

export default StatusBadge;
