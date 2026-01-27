// Created by Honeycomb © 2025
import React from "react";
import styles from "./AssignedEmployees.module.css";
import { CalendarDaysIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

/* ================= TYPES ================= */

export interface AssignedEmployee {
  employeeId: string;
  name: string;

  schedules: {
    assignmentId: string; // 🔥 FIRESTORE ASSIGNMENT DOC ID
    start: string;
    end: string;
    hours: number;
  }[];

  labour: {
    enteredHours: number;
    completed: boolean;
  };
}

interface Props {
  employees?: AssignedEmployee[];
  onUnassign?: (assignmentId: string) => void;
}

/* ================= COMPONENT ================= */

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
        {employees.map((emp) => {
          const totalScheduled = emp.schedules.reduce(
            (sum, s) => sum + s.hours,
            0,
          );

          return (
            <div key={emp.employeeId} className={styles.employeeCard}>
              {/* ================= HEADER ================= */}
              <div className={styles.employeeTop}>
                <div className={styles.left}>
                  <div className={styles.avatar}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>

                  <strong>{emp.name}</strong>

                  <span className={styles.status}>
                    {emp.labour.completed
                      ? "LABOUR COMPLETED"
                      : "LABOUR NOT COMPLETED"}
                  </span>
                </div>

                <div className={styles.right}>
                  <span className={styles.totals}>
                    Total Scheduled: {totalScheduled} hours | Total Time
                    Entered: {emp.labour.enteredHours} hours
                  </span>

                  {!emp.labour.completed && (
                    <button className={styles.completeBtn}>
                      <CheckCircleIcon className={styles.btnIcon} />
                      Mark labour as completed
                    </button>
                  )}
                </div>
              </div>

              {/* ================= BODY ================= */}
              <div className={styles.employeeBody}>
                {emp.schedules.length > 0 ? (
                  emp.schedules.map((s) => (
                    <div key={s.assignmentId} className={styles.scheduleRow}>
                      <CalendarDaysIcon className={styles.icon} />

                      <span>
                        Scheduled: {new Date(s.start).toLocaleString()} –{" "}
                        {new Date(s.end).toLocaleTimeString()} ({s.hours} hours)
                      </span>

                      {onUnassign && (
                        <button
                          className={styles.removeBtn}
                          title="Remove this day only"
                          onClick={() => onUnassign(s.assignmentId)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.muted}>No schedules assigned</div>
                )}

                <div className={styles.timeEntry}>
                  Time Entry:{" "}
                  <span className={styles.muted}>
                    {emp.labour.enteredHours > 0
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
