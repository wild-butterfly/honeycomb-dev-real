// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo } from "react";
import styles from "./MobileMonthList.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import { getJobStart, getAssignedEmployeeIds } from "../utils/jobTime";

interface Props {
  selectedDate: Date;
  monthGroups: { [day: number]: CalendarJob[] };
  employees: Employee[];
  onJobClick: (id: string) => void;
}

const MobileMonthList: React.FC<Props> = ({
  selectedDate,
  monthGroups,
  employees,
  onJobClick,
}) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className={styles.wrapper}>
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const jobs = monthGroups[day] || [];

        const dateObj = new Date(year, month, day);
        const label = dateObj.toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "short",
        });

        return (
          <div key={day} className={styles.dayBlock}>
            <div className={styles.dayTitle}>{label}</div>

            {jobs.length === 0 ? (
              <div className={styles.noJobs}>No jobs</div>
            ) : (
              jobs.map((job) => {
                /* ================= ASSIGNMENTS ================= */

                const assignedIds = getAssignedEmployeeIds(job);
                const firstEmpId = assignedIds[0];
                const emp = employees.find((e) => e.id === firstEmpId);

                /* ================= SAFE TIME ================= */

                const start = getJobStart(job) ?? new Date();

                /* ================= STATUS ================= */

                const status = (job.status ?? "active").toUpperCase();

                const bgColor = job.color || "#ffffff";
                const glow = job.color ? `0 0 12px ${job.color}55` : "none";

                return (
                  <div
                    key={job.id}
                    className={styles.jobCard}
                    style={{
                      background: bgColor,
                      borderLeft: `8px solid ${job.color || "#ccc"}`,
                      boxShadow: glow,
                    }}
                    onClick={() => onJobClick(job.id)}
                  >
                    {/* STATUS BADGE */}
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

                    {/* MULTI STAFF INDICATOR */}
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

export default MobileMonthList;
