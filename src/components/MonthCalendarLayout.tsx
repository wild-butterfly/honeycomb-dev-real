// Created by Clevermode © 2025. All rights reserved.
import React, { useState } from "react";
import styles from "./MonthCalendarLayout.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  selectedStaff: number[];
  onStaffChange: (list: number[]) => void;

  onJobClick: (id: number) => void;
  onJobMove: (
    id: number,
    employeeId: number,
    newStart: Date,
    newEnd: Date
  ) => void;

  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}

const MonthCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  selectedStaff,
  onStaffChange,
  onJobClick,
  onJobMove,
  onAddJobAt,
}) => {
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const offset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const days: Date[] = [];
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const getJobsForDay = (day: Date) =>
    jobs.filter((j) => {
      const d = new Date(j.start);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate() &&
        (selectedStaff.length === 0 ||
          j.assignedTo.some((id) => selectedStaff.includes(id)))
      );
    });

  const filteredJobsRight = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.layoutWrapper}>
      {/* LEFT STAFF SIDE */}
      <div className={styles.staffSidebar}>
        <div className={styles.staffTitle}>Staff</div>

        {employees.map((emp) => (
          <label key={emp.id} className={styles.staffCheckbox}>
            <input
              type="checkbox"
              checked={selectedStaff.includes(emp.id)}
              onChange={(e) => {
                if (e.target.checked)
                  onStaffChange([...selectedStaff, emp.id]);
                else onStaffChange(selectedStaff.filter((x) => x !== emp.id));
              }}
            />
            {emp.name}
          </label>
        ))}
      </div>

      {/* MIDDLE CALENDAR */}
      <div className={styles.monthWrapper}>
        <div className={styles.weekHeader}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className={styles.weekDayLabel}>
              {d}
            </div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {Array.from({ length: offset }).map((_, i) => (
            <div key={"e-" + i} className={styles.emptyCell} />
          ))}

          {days.map((day) => {
            const dayNum = day.getDate();
            const jobList = getJobsForDay(day);

            return (
              <div
                key={day.toISOString()}
                className={styles.dayCell}
                onMouseEnter={() => setHoverDay(dayNum)}
                onMouseLeave={() => setHoverDay(null)}
              >
                <div className={styles.dayNumber}>{dayNum}</div>

                <div className={styles.jobsList}>
                  {jobList.map((job) => (
                    <div
                      key={job.id}
                      className={styles.jobBox}
                      onClick={() => onJobClick(job.id)}
                      style={{ borderLeftColor: job.color || "#c4e3a0" }}
                    >
                      <div className={styles.jobTitle}>{job.title}</div>
                      <div className={styles.jobCustomer}>
                        {job.customer}
                      </div>
                    </div>
                  ))}
                </div>

                {hoverDay === dayNum && (
                  <button
                    className={styles.addBtn}
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(9, 0);
                      const end = new Date(start);
                      end.setHours(10);

                      const empId =
                        selectedStaff[0] || employees[0].id;

                      onAddJobAt(empId, start, end);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT JOBS SIDEBAR */}
      <div className={styles.jobsSidebar}>
        <div className={styles.jobsHeader}>Jobs</div>

        <input
          className={styles.searchInput}
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={styles.jobsScroll}>
          {filteredJobsRight.map((job) => (
            <div
              key={job.id}
              className={styles.jobRightCard}
              onClick={() => onJobClick(job.id)}
            >
              <div className={styles.jobRightTitle}>{job.title}</div>
              <div className={styles.jobRightCustomer}>{job.customer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthCalendarLayout;
