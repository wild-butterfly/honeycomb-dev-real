// Created by Clevermode © 2025
import React from "react";
import { CalendarJob, Employee } from "../pages/CalendarPage";
import styles from "./MobileDayList.module.css";

interface Props {
  selectedDate: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: number) => void;
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

      {jobs.length === 0 && (
        <div className={styles.empty}>No jobs today</div>
      )}

      {jobs.map((job) => {
        const emp = employees.find((e) => job.assignedTo.includes(e.id));

        const status = job.status?.toUpperCase() || "ACTIVE";

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
            {/* Unified Badge System */}
            <div className={`${styles.statusBadge} ${styles[status]}`}>
              {status}
            </div>

            <div className={styles.time}>
              {new Date(job.start).toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            <div className={styles.title}>{job.title}</div>
            <div className={styles.customer}>{job.customer}</div>

            {emp && (
              <div className={styles.staffName}>👤 {emp.name}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileDayList;
