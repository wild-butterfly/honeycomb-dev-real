// Created by Clevermode © 2025. All rights reserved.

import React, { useState, useMemo, useRef, useEffect } from "react";
import styles from "./SidebarJobs.module.css";

import type { JobStatus } from "../types/calendar";
import type { CalendarItem } from "../utils/calendarItems";

type JobFilter = "all" | "unassigned" | JobStatus;

type Props = {
  items: CalendarItem[];
  onJobClick: (jobId: number) => void;
  jobFilter: JobFilter;
  onJobFilterChange: (filter: JobFilter) => void;
};

/* =========================================================
   STATUS UI
========================================================= */

const statusColors: Record<JobStatus, string> = {
  active: "#dff5f5",
  completed: "#d8f5d2",
  return: "#fff3cd",
  quote: "#e8ddff",
};

const statusLabel: Record<JobStatus, string> = {
  active: "ACTIVE",
  completed: "COMPLETED",
  return: "NEED TO RETURN",
  quote: "QUOTE",
};

const FILTER_LABELS: Record<JobFilter, string> = {
  all: "All Jobs",
  unassigned: "Unassigned",
  active: "Active",
  completed: "Completed",
  return: "Need to Return",
  quote: "Quote",
};

/* =========================================================
   COMPONENT
========================================================= */

const SidebarJobs: React.FC<Props> = ({
  items,
  onJobClick,
  jobFilter,
  onJobFilterChange,
}) => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------- close dropdown on outside click ---------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  /* =========================================================
     GROUP ITEMS → JOBS
  ========================================================== */

  const jobsFromItems = useMemo(() => {
    const map = new Map<
      number,
      {
        jobId: number;
        title: string;
        client: string;
        color?: string;
        status?: JobStatus;
        assignmentCount: number;
      }
    >();

    for (const item of items) {
      if (!map.has(item.jobId)) {
        map.set(item.jobId, {
          jobId: item.jobId,
          title: item.title,
          client: item.client,
          color: item.color,
          status: item.status,
          assignmentCount: 0,
        });
      }

      map.get(item.jobId)!.assignmentCount++;
    }

    return Array.from(map.values());
  }, [items]);

  /* =========================================================
     FILTER + SEARCH
  ========================================================== */

  const filteredJobs = useMemo(() => {
    return jobsFromItems.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.client.toLowerCase().includes(search.toLowerCase());

      if (jobFilter === "unassigned") {
        return matchSearch && job.assignmentCount === 0;
      }

      if (jobFilter !== "all") {
        return matchSearch && job.status === jobFilter;
      }

      return matchSearch;
    });
  }, [jobsFromItems, search, jobFilter]);

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.sidebarHeaderRow}>
        <div className={styles.sidebarTitle}>Jobs</div>
      </div>

      {/* FILTER */}
      <div className={styles.filterWrapper} ref={dropdownRef}>
        <button
          className={styles.filterButton}
          onClick={() => setDropdownOpen((p) => !p)}
        >
          {FILTER_LABELS[jobFilter]} ▾
        </button>

        {dropdownOpen && (
          <div className={styles.dropdownMenu}>
            {(Object.keys(FILTER_LABELS) as JobFilter[]).map((f) => (
              <div
                key={f}
                className={styles.dropdownItem}
                onClick={() => {
                  onJobFilterChange(f);
                  setDropdownOpen(false);
                }}
              >
                {FILTER_LABELS[f]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEARCH */}
      <div className={styles.sidebarSearchRow}>
        <input
          className={styles.sidebarSearchInput}
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* JOB LIST */}
      <div className={styles.sidebarJobsList}>
        {filteredJobs.length === 0 ? (
          <div className={styles.sidebarEmptyState}>
            <div className={styles.sidebarEmptyEmoji}><img src="/leaf-fall.png" alt="Leaf icon" /></div>
            <div className={styles.sidebarEmptyText}>No jobs found.</div>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.jobId}
              className={styles.sidebarJobItem}
              onClick={() => onJobClick(job.jobId)}
              style={{ backgroundColor: job.color ?? "#fffdf0" }}
              role="button"
              tabIndex={0}
            >
              {job.status && (
                <span
                  className={styles.sidebarStatusBadge}
                  style={{ background: statusColors[job.status] }}
                >
                  {statusLabel[job.status]}
                </span>
              )}

              <div className={styles.sidebarJobTitle}>{job.title}</div>
              <div className={styles.sidebarJobCustomer}>{job.client}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SidebarJobs;
