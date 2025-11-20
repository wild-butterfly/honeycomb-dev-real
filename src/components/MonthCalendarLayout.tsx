// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import styles from "./MonthCalendarLayout.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";
import SidebarJobs from "./SidebarJobs";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  selectedStaff: number[];
  onStaffChange: (ids: number[]) => void;
  onJobClick: (jobId: number) => void;
}

const MonthCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  selectedStaff,
  onStaffChange,
  onJobClick,
}) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Pazartesi başlangıç
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    if (dayNum <= 0 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  });

  const handleStaffToggle = (id: number) => {
    if (selectedStaff.includes(id)) {
      onStaffChange(selectedStaff.filter((s) => s !== id));
    } else {
      onStaffChange([...selectedStaff, id]);
    }
  };

  // 🔹 Gün bazlı job gruplama
  const jobsByDay: { [key: number]: CalendarJob[] } = {};
  jobs.forEach((job) => {
    const d = new Date(job.start);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!jobsByDay[day]) jobsByDay[day] = [];
      jobsByDay[day].push(job);
    }
  });

  return (
    <div className={styles.monthLayoutWrapper}>
      {/* SOL: Staff */}
      <aside className={styles.staffSidebar}>
        <div className={styles.staffTitle}>Staff</div>
        {employees.map((emp) => (
          <label key={emp.id} className={styles.staffCheckbox}>
            <input
              type="checkbox"
              checked={selectedStaff.includes(emp.id)}
              onChange={() => handleStaffToggle(emp.id)}
            />
            <span>{emp.name}</span>
          </label>
        ))}
      </aside>

      {/* ORTA: Takvim */}
      <div className={styles.monthGrid}>
        {daysArray.map((day, i) =>
          day ? (
            <div key={i} className={styles.dayCell}>
              <div className={styles.dayNumber}>{day.getDate()}</div>

              {/* 🔹 İşleri listele */}
              <div className={styles.jobsContainer}>
                {jobsByDay[day.getDate()]?.map((job) => (
                  <div
                    key={job.id}
                    className={styles.jobBox}
                    style={{ backgroundColor: job.color || "#f8f8f8" }}
                    onClick={() => onJobClick(job.id)}
                    title={`${job.title} – ${job.customer}`}
                  >
                    <div className={styles.jobTitle}>{job.title}</div>
                    <div className={styles.jobCustomer}>{job.customer}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key={i} className={styles.emptyCell}></div>
          )
        )}
      </div>

      {/* SAĞ: Job List */}
      <aside className={styles.sidebarJobs}>
        <SidebarJobs jobs={jobs} />
      </aside>
    </div>
  );
};

export default MonthCalendarLayout;
