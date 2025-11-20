// Created by Clevermode © 2025
import React from "react";
import { CalendarJob, Employee } from "../pages/CalendarPage";
import styles from "./MobileDayList.module.css";

interface Props {
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: number) => void;
}

const MobileDayList: React.FC<Props> = ({ jobs, employees, onJobClick }) => {
  return (
    <div className={styles.wrapper}>
      {jobs.length === 0 ? (
        <div className={styles.empty}>No jobs today</div>
      ) : (
        jobs.map((job) => {
          // ⬇️ ARRAY MODEL → includes() kullanıyoruz
          const emp = employees.find((e) => job.assignedTo.includes(e.id));

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

              {emp && <div className={styles.staffName}>{emp.name}</div>}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MobileDayList;
