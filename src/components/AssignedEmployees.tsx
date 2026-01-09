// Created by Honeycomb © 2025
import React from "react";
import styles from "./AssignedEmployees.module.css";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export interface AssignedEmployee {
  employeeId: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  schedules?: {
    start?: string;
    end?: string;
    hours?: number;
  }[];
  labour?: {
    enteredHours?: number;
    completed?: boolean;
  };
}

interface Props {
  employees?: AssignedEmployee[];
  onUnassign?: (employeeId: string) => void; // ✅ YENİ (opsiyonel)
}

const AssignedEmployees: React.FC<Props> = ({ employees, onUnassign }) => {
  if (!employees || employees.length === 0) {
    return (
      <div className={styles.wrapper}>
        <h3 className={styles.subTitle}>Assigned Employees</h3>
        <div className={styles.muted}>No employees assigned</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.subTitle}>Assigned Employees</h3>

      <div className={styles.list}>
        {employees.map((emp, index) => {
          const name =
            emp.name || emp.fullName || emp.displayName || "Unnamed employee";

          const schedules = Array.isArray(emp.schedules) ? emp.schedules : [];

          const labour = emp.labour || {
            enteredHours: 0,
            completed: false,
          };

          const totalScheduled = schedules.reduce(
            (sum, s) => sum + (s.hours || 0),
            0
          );

          return (
            <div key={emp.employeeId || index} className={styles.employeeCard}>
              {/* ================= HEADER ================= */}
              <div className={styles.employeeTop}>
                <div className={styles.left}>
                  <div className={styles.avatar}>{name.charAt(0)}</div>

                  <strong>{name}</strong>

                  <span className={styles.status}>
                    {labour.completed
                      ? "LABOUR COMPLETED"
                      : "LABOUR NOT COMPLETED"}
                  </span>
                </div>

                <div className={styles.right}>
                  <span className={styles.totals}>
                    Total Scheduled: {totalScheduled} hours | Total Time
                    Entered: {labour.enteredHours || 0} hours
                  </span>

                  {!labour.completed && (
                    <button className={styles.completeBtn}>
                      <CheckCircleIcon className={styles.btnIcon} />
                      Mark labour as completed
                    </button>
                  )}

                  {/* 🔥 FERGUS STYLE REMOVE X */}
                  {onUnassign && (
                    <button
                      className={styles.removeBtn}
                      title="Remove from job"
                      onClick={() => onUnassign(emp.employeeId)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* ================= BODY ================= */}
              <div className={styles.employeeBody}>
                {schedules.length > 0 ? (
                  schedules.map((s, i) => (
                    <div key={i} className={styles.scheduleRow}>
                      <CalendarDaysIcon className={styles.icon} />
                      <span>
                        Scheduled:{" "}
                        {s.start ? new Date(s.start).toLocaleString() : "—"} –{" "}
                        {s.end ? new Date(s.end).toLocaleTimeString() : "—"} (
                        {s.hours || 0} hours)
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.muted}>No schedules assigned</div>
                )}

                <div className={styles.timeEntry}>
                  Time Entry:{" "}
                  <span className={styles.muted}>
                    {labour.enteredHours && labour.enteredHours > 0
                      ? "Entered"
                      : "Labour not entered"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignedEmployees;
