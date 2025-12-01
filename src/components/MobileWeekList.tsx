// Created by Clevermode © 2025
import React from "react";
import styles from "./MobileWeekList.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";

interface Props {
  jobs: CalendarJob[];
  employees: Employee[];
  selectedDate: Date;
  onJobClick: (id: number) => void;
}

const MobileWeekList: React.FC<Props> = ({
  jobs,
  employees,
  selectedDate,
  onJobClick,
}) => {
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const grouped: { [key: number]: CalendarJob[] } = {};
  days.forEach((d) => {
    const day = d.getDate();
    grouped[day] = jobs.filter((j) => {
      const jd = new Date(j.start);
      return (
        jd.getFullYear() === d.getFullYear() &&
        jd.getMonth() === d.getMonth() &&
        jd.getDate() === d.getDate()
      );
    });
  });

  return (
    <div className={styles.wrapper}>
      {days.map((d) => {
        const jobsToday = grouped[d.getDate()] || [];

        return (
          <div key={d.toISOString()} className={styles.dayBlock}>
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
                const emp = employees.find((e) =>
                  job.assignedTo.includes(e.id)
                );

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
                    {/* STATUS */}
                    <div className={`${styles.statusBadge} ${styles[status]}`}>
                      {status}
                    </div>

                    {/* TIME */}
                    <div className={styles.time}>
                      {new Date(job.start).toLocaleTimeString("en-AU", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* TITLE + CUSTOMER */}
                    <div className={styles.title}>{job.title}</div>
                    <div className={styles.customer}>{job.customer}</div>

                    {/* STAFF */}
                    {emp && (
                      <div className={styles.staffName}>
                        👤 {emp.name}
                      </div>
                    )}

                    {/* ⭐ ESTIMATED TAGS — YENİ */}
                    {job.estimatedTags !== undefined && (
                      <div className={styles.estimated}>
                        Estimated: {job.estimatedTags} tags
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
