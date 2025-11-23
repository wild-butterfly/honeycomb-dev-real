// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import styles from "../pages/CalendarPage.module.css";
import { CalendarJob } from "../pages/CalendarPage";

type Props = {
  jobs: CalendarJob[];
  onJobClick: (jobId: number) => void;
};

const statusColors: Record<string, string> = {
  completed: "#d8f5d2",
  return: "#fff3cd",
  quote: "#e8ddff",
  active: "#dff5f5",
};

const statusLabel: Record<string, string> = {
  completed: "COMPLETED",
  return: "NEED TO RETURN",
  quote: "QUOTE",
  active: "ACTIVE",
};

const SidebarJobs: React.FC<Props> = ({ jobs, onJobClick }) => {
  return (
    <div className={styles.sidebarCard}>
      <div className={styles.sidebarHeaderRow}>
        <div className={styles.sidebarTitle}>Jobs</div>
      </div>

      <div className={styles.sidebarSearchRow}>
        <input
          className={styles.sidebarSearchInput}
          placeholder="Search jobs..."
        />
      </div>

      <div className={styles.sidebarJobsList}>
        {jobs.length === 0 ? (
          <div className={styles.sidebarEmptyState}>
            <div className={styles.sidebarEmptyEmoji}>🐝</div>
            <div className={styles.sidebarEmptyText}>
              No jobs for this day.
            </div>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className={styles.sidebarJobItem}
              onClick={() => onJobClick(job.id)}
              style={{
                backgroundColor: job.color || "#fffdf0",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "10px",
                position: "relative",
              }}
            >
              {/* STATUS BADGE */}
              {job.status && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: statusColors[job.status],
                    border: "1px solid rgba(0,0,0,0.15)",
                    padding: "3px 8px",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  {statusLabel[job.status]}
                </span>
              )}

              <div className={styles.sidebarJobTitle}>{job.title}</div>
              <div className={styles.sidebarJobCustomer}>{job.customer}</div>
              {job.location && (
                <div className={styles.sidebarJobLocation}>{job.location}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SidebarJobs;
