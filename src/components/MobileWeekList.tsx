// Created by Clevermode © 2025
import React, { useMemo } from "react";
import styles from "./MobileWeekList.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import { getJobStart, getAssignedEmployeeIds } from "../utils/jobTime";

interface Props {
  jobs: CalendarJob[];
  employees: Employee[];
  selectedDate: Date;
  onJobClick: (id: string) => void;
}

const MobileWeekList: React.FC<Props> = ({
  jobs,
  employees,
  selectedDate,
  onJobClick,
}) => {
  /* ================= WEEK RANGE ================= */

  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  /* ================= GROUP JOBS BY DAY (ASSIGNMENTS) ================= */

  const grouped = useMemo(() => {
    const map: { [key: string]: CalendarJob[] } = {};

    days.forEach((d) => {
      const key = d.toDateString();
      map[key] = [];
    });

    jobs.forEach((job) => {
      const start = getJobStart(job);
      if (!start) return;

      const key = start.toDateString();
      if (map[key]) {
        map[key].push(job);
      }
    });

    return map;
  }, [jobs, days]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.wrapper}>
      {days.map((d) => {
        const key = d.toDateString();
        const jobsToday = grouped[key] || [];

        return (
          <div key={key} className={styles.dayBlock}>
            <div className={styles.dayTitle}>
              {d.toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </div>

            {jobsToday.length === 0 ? (
              <div className={styles.noJobs}>No jobs</div>
            ) : (
              jobsToday.map((job) => {
                /* ================= ASSIGNMENTS ================= */

                const assignedIds = getAssignedEmployeeIds(job);
                const firstEmpId = assignedIds[0];
                const emp = employees.find((e) => e.id === firstEmpId);

                /* ================= SAFE TIME ================= */

                const start = getJobStart(job) ?? new Date();

                /* ================= STATUS ================= */

                const status = (job.status ?? "active").toUpperCase();

                const bg = job.color || "#ffffff";
                const glow = job.color ? `0 0 12px ${job.color}55` : "none";

                return (
                  <div
                    key={job.id}
                    className={styles.jobCard}
                    style={{
                      background: bg,
                      borderLeft: `8px solid ${job.color || "#ccc"}`,
                      boxShadow: glow,
                    }}
                    onClick={() => onJobClick(job.id)}
                  >
                    {/* STATUS */}
                    <div className={styles.statusBadge}>{status}</div>

                    {/* TIME */}
                    <div className={styles.time}>
                      {start.toLocaleTimeString("en-AU", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* TITLE + CUSTOMER */}
                    <div className={styles.title}>{job.title}</div>
                    <div className={styles.customer}>{job.customer}</div>

                    {/* STAFF */}
                    {emp && (
                      <div className={styles.staffName}>👤 {emp.name}</div>
                    )}

                    {/* MULTI STAFF */}
                    {assignedIds.length > 1 && (
                      <div className={styles.multiStaff}>
                        +{assignedIds.length - 1} more
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileWeekList;
