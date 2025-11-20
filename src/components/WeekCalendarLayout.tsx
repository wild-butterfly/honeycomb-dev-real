// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import styles from "./WeekCalendarLayout.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: number) => void;
}

const WeekCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  onJobClick,
}) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1);

  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const getJobsForDayAndEmployee = (day: Date, employeeId: number) => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.start);
      return (
        jobDate.toDateString() === day.toDateString() &&
        job.assignedTo.includes(employeeId)
      );
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className={styles.weekWrapper}>
      {/* HEADER: Günler */}
      <div className={styles.headerRow}>
        <div className={styles.staffHeaderCell}></div>
        {daysOfWeek.map((day, i) => (
          <div key={i} className={styles.dayHeader}>
            <div className={styles.dayLabel}>
              {day.toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ROWS: Personeller */}
      {employees.map((employee) => (
        <div key={employee.id} className={styles.row}>
          {/* Personel bilgisi */}
          <div className={styles.staffCell}>
            <div className={styles.avatarCircle}>{getInitials(employee.name)}</div>
            <span className={styles.staffName}>{employee.name}</span>
          </div>

          {/* Gün hücreleri */}
          {daysOfWeek.map((day, i) => {
            const dayJobs = getJobsForDayAndEmployee(day, employee.id);
            return (
              <div key={i} className={styles.dayCell}>
                {dayJobs.map((job) => (
                  <div
                    key={job.id}
                    className={styles.jobBox}
                    style={{ backgroundColor: job.color || "#faf7dc" }}
                    onClick={() => onJobClick(job.id)}
                  >
                    <div className={styles.jobTitle}>{job.title}</div>
                    <div className={styles.jobCustomer}>{job.customer}</div>
                    <div className={styles.jobTime}>
                      {new Date(job.start).toLocaleTimeString("en-AU", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeekCalendarLayout;
