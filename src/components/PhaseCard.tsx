// src/components/jPhaseCard.tsx
// Honeycomb © 2026

import React from "react";
import styles from "./PhaseCard.module.css";
import {
  ClockIcon,
  UserGroupIcon,
  FlagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface Props {
  job: any;
}

const jPhaseCard: React.FC<Props> = ({ job }) => {
  // Safe mapping (snake_case → usable fields)
  const startDate = job.start_time || job.startDate;
  const dueDate = job.end_time || job.dueDate;

  const completedHours = job.completedHours ?? 0;
  const scheduledHours = job.scheduledHours ?? 0;
  const assignedStaff = job.assignedStaff ?? 0;
  const revenue = job.revenue ?? 0;

  const progress =
    scheduledHours > 0
      ? Math.min((completedHours / scheduledHours) * 100, 100)
      : 0;

  const status = job.status || "active";

  const phases = ["quoted", "scheduled", "active", "completed", "invoiced"];

  return (
    <div className={styles.card}>
      {/* Phase Tabs */}
      <div className={styles.phaseTabs}>
        {phases.map((phase) => (
          <span
            key={phase}
            className={`${styles.phaseTab} ${
              status.toLowerCase() === phase ? styles.activePhase : ""
            }`}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </span>
        ))}
      </div>

      <div className={styles.content}>
        {/* LEFT SIDE */}
        <div className={styles.left}>
          <h2 className={styles.title}>{job.title}</h2>
          <p className={styles.client}>{job.client}</p>

          <div className={styles.metaRow}>
            <ClockIcon className={styles.icon} />
            <span>
              {startDate ? new Date(startDate).toLocaleDateString() : "—"} –{" "}
              {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
            </span>
          </div>

          <div className={styles.metaRow}>
            <UserGroupIcon className={styles.icon} />
            <span>{assignedStaff} Assigned</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.right}>
          <div className={styles.progressWrapper}>
            <div className={styles.progressValue}>{progress.toFixed(0)}%</div>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <ClockIcon className={styles.metricIcon} />
              <div>
                <div className={styles.metricValue}>
                  {completedHours}h / {scheduledHours}h
                </div>
                <div className={styles.metricLabel}>Hours</div>
              </div>
            </div>

            <div className={styles.metric}>
              <CurrencyDollarIcon className={styles.metricIcon} />
              <div>
                <div className={styles.metricValue}>${revenue}</div>
                <div className={styles.metricLabel}>Revenue</div>
              </div>
            </div>

            <div className={styles.metric}>
              <FlagIcon className={styles.metricIcon} />
              <div>
                <div className={styles.metricValue}>
                  {job.priority || "Normal"}
                </div>
                <div className={styles.metricLabel}>Priority</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default jPhaseCard;
