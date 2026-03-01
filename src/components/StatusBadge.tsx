import React from "react";
import styles from "./StatusBadge.module.css";
import type { JobStatus } from "../types/JobStatus";
import { getStatusLabel, normalizeJobStatus } from "../types/JobLifecycle";
import { getStatusColor } from "../types/GaugeData";

type Props = {
  status?: JobStatus;
};

const StatusBadge: React.FC<Props> = ({ status }) => {
  if (!status) return null;
  const normalized = normalizeJobStatus(status);

  return (
    <span
      className={styles.badge}
      style={{ backgroundColor: getStatusColor(normalized) }}
    >
      {getStatusLabel(normalized).toUpperCase()}
    </span>
  );
};

export default StatusBadge;
