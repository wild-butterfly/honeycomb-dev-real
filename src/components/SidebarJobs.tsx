// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import styles from "../pages/CalendarPage.module.css";
import { CalendarJob } from "../pages/CalendarPage";

type Props = {
  jobs: CalendarJob[];
  onJobClick: (jobId: number) => void;
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
            <div className={styles.sidebarEmptyText}>No jobs for this day.</div>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className={styles.sidebarJobItem}
              onClick={() => onJobClick(job.id)}
            >
              <div className={styles.sidebarJobTitle}>{job.title}</div>
              <div className={styles.sidebarJobCustomer}>{job.customer}</div>

              {job.location && (
                <div className={styles.sidebarJobLocation}>
                  {job.location}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SidebarJobs;
