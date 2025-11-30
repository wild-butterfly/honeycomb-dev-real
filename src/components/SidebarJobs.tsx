// Created by Clevermode © 2025. All rights reserved.
import React, { useState, useMemo, useRef, useEffect } from "react";
import styles from "./SidebarJobs.module.css";
import { CalendarJob } from "../pages/CalendarPage";

type Props = {
  jobs: CalendarJob[];
  onJobClick: (jobId: number) => void;

  jobFilter: "all" | "unassigned" | "active" | "completed" | "return" | "quote";
  onJobFilterChange: (filter: any) => void;
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

const SidebarJobs: React.FC<Props> = ({
  jobs,
  onJobClick,
  jobFilter,
  onJobFilterChange,
}) => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dropdown dışı tıklama kontrolü
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Filtreleme
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.customer.toLowerCase().includes(search.toLowerCase());

      let matchFilter = true;

      if (jobFilter === "unassigned") matchFilter = job.assignedTo.length === 0;
      else if (jobFilter !== "all") matchFilter = job.status === jobFilter;

      return matchSearch && matchFilter;
    });
  }, [jobs, search, jobFilter]);

  const handleSelectFilter = (filter: any) => {
    onJobFilterChange(filter);
    setDropdownOpen(false);
  };

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.sidebarHeaderRow}>
        <div className={styles.sidebarTitle}>Jobs</div>
      </div>

      {/* Filter Menu */}
      <div className={styles.filterWrapper} ref={dropdownRef}>
        <button
          className={styles.filterButton}
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          Filter ▾
        </button>

        {dropdownOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownItem} onClick={() => handleSelectFilter("all")}>
              All Active Jobs
            </div>

            <div className={styles.dropdownDivider} />
            <div className={styles.dropdownHeader}>UNASSIGNED</div>

            <div
              className={styles.dropdownItem}
              onClick={() => handleSelectFilter("unassigned")}
            >
              Unassigned
            </div>

            <div className={styles.dropdownDivider} />
            <div className={styles.dropdownHeader}>STATUS</div>

            {["active", "completed", "return", "quote"].map((s) => (
              <div
                key={s}
                className={styles.dropdownItem}
                onClick={() => handleSelectFilter(s)}
              >
                {statusLabel[s]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className={styles.sidebarSearchRow}>
        <input
          className={styles.sidebarSearchInput}
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Job List */}
      <div className={styles.sidebarJobsList}>
        {filteredJobs.length === 0 ? (
          <div className={styles.sidebarEmptyState}>
            <div className={styles.sidebarEmptyEmoji}>🐝</div>
            <div className={styles.sidebarEmptyText}>No jobs found.</div>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className={styles.sidebarJobItem}
              onClick={() => onJobClick(job.id)}
              style={{ backgroundColor: job.color || "#fffdf0" }}
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
