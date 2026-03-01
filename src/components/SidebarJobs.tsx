// Created by Clevermode © 2025. All rights reserved.

import React, { useState, useMemo, useRef, useEffect } from "react";
import styles from "./SidebarJobs.module.css";

import type { CalendarJob, JobStatus } from "../types/calendar";
import type { CalendarItem } from "../utils/calendarItems";
import { getStatusLabel, normalizeJobStatus } from "../types/JobLifecycle";
import { getStatusColor } from "../types/GaugeData";

type JobFilter = "all" | "unassigned" | JobStatus;

type Props = {
  items: CalendarItem[];
  jobs?: CalendarJob[];
  onJobClick: (jobId: number) => void;
  jobFilter: JobFilter;
  onJobFilterChange: (filter: JobFilter) => void;
};

/* =========================================================
   STATUS UI
========================================================= */

const FILTER_OPTIONS: Array<{ value: JobFilter; label: string }> = [
  { value: "all", label: "All Jobs" },
  { value: "unassigned", label: "Unassigned" },
  { value: "draft", label: "Draft" },
  { value: "new", label: "New Request" },
  { value: "needs_quote", label: "To Quote" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const getFilterLabel = (filter: JobFilter): string => {
  return FILTER_OPTIONS.find((option) => option.value === filter)?.label || "All Jobs";
};

/* =========================================================
   COMPONENT
========================================================= */

const SidebarJobs: React.FC<Props> = ({
  items,
  jobs = [],
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

    // Seed with all jobs so unassigned drafts are visible in sidebar.
    for (const job of jobs) {
      map.set(job.id, {
        jobId: job.id,
        title: job.title ?? "",
        client: job.client ?? "",
        color: job.color,
        status: job.status,
        assignmentCount: Array.isArray(job.assignments)
          ? job.assignments.length
          : 0,
      });
    }

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
  }, [items, jobs]);

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
          {getFilterLabel(jobFilter)} ▾
        </button>

        {dropdownOpen && (
          <div className={styles.dropdownMenu}>
            {FILTER_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={styles.dropdownItem}
                onClick={() => {
                  onJobFilterChange(option.value);
                  setDropdownOpen(false);
                }}
              >
                {option.label}
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
                  style={{ background: getStatusColor(normalizeJobStatus(job.status)) }}
                >
                  {getStatusLabel(normalizeJobStatus(job.status)).toUpperCase()}
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
