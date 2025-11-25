// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import styles from "./MobileMonthList.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";

interface Props {
  selectedDate: Date;
  monthGroups: { [day: number]: CalendarJob[] };
  employees: Employee[];
  onJobClick: (id: number) => void;
}

const MobileMonthList: React.FC<Props> = ({
  selectedDate,
  monthGroups,
  employees,
  onJobClick,
}) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Calculate total days in month
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
                const emp = employees.find((e) =>
                  job.assignedTo.includes(e.id)
                );

                return (
                  <div
                    key={job.id}
                    className={styles.jobCard}
                    style={{ borderLeftColor: job.color || "#ccc" }}
                    onClick={() => onJobClick(job.id)}
                  >
                    <div className={styles.time}>
                      {new Date(job.start).toLocaleTimeString("en-AU", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className={styles.title}>{job.title}</div>
                    <div className={styles.customer}>{job.customer}</div>

                    {emp && (
                      <div className={styles.staffName}>{emp.name}</div>
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
