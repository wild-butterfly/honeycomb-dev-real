// Created by Clevermode © 2025
import React from "react";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import styles from "./MobileDayList.module.css";
import { getJobStart, getAssignedEmployeeIds } from "../utils/jobTime";

interface Props {
  selectedDate: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: string) => void;
}

const MobileDayList: React.FC<Props> = ({
  selectedDate,
  jobs,
  employees,
  onJobClick,
}) => {
  const dayLabel = selectedDate.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.dayTitle}>{dayLabel}</div>

      {jobs.length === 0 && <div className={styles.empty}>No jobs today</div>}

      {jobs.map((job) => {
        const assignedIds = getAssignedEmployeeIds(job);
        const firstEmpId = assignedIds[0];
        const emp = employees.find((e) => e.id === firstEmpId);

        const start = getJobStart(job) ?? new Date();

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
            <div className={styles.statusBadge}>{status}</div>

            <div className={styles.time}>
              {start.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            <div className={styles.title}>{job.title}</div>
            <div className={styles.customer}>{job.customer}</div>

            {emp && <div className={styles.staffName}>👤 {emp.name}</div>}

            {assignedIds.length > 1 && (
              <div className={styles.multiStaff}>
                +{assignedIds.length - 1} more
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileDayList;
