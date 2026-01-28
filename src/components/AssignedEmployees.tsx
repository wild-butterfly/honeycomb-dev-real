// Created by Honeycomb © 2025
import React from "react";
import styles from "./AssignedEmployees.module.css";
import { CalendarDaysIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export interface AssignedEmployee {
  employeeId: string;
  name: string;
  schedules: {
    assignmentId: string;
    start: string;
    end: string;
    hours: number;
    completed: boolean;
  }[];
  labour: {
    enteredHours: number;
    completed: boolean;
  };
  unscheduledAssignmentId?: string;
}

interface Props {
  employees: AssignedEmployee[];
  onUnassign?: (assignmentId: string, employeeName: string) => void;
  onMarkAssignmentCompleted?: (assignmentId: string) => void;
}

const AssignedEmployees: React.FC<Props> = ({
  employees,
  onUnassign,
  onMarkAssignmentCompleted,
}) => {
  if (!employees.length) {
    return <div className={styles.muted}>No employees assigned</div>;
  }

  return (
    <div className={styles.list}>
      {employees.map((emp) => {
        const totalHours = emp.schedules.reduce((sum, s) => sum + s.hours, 0);

        return (
          <div key={emp.employeeId} className={styles.employeeCard}>
            {/* ===== HEADER ===== */}
            <div className={styles.employeeTop}>
              <div className={styles.left}>
                <div className={styles.avatar}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>

                <strong className={styles.employeeName}>{emp.name}</strong>

                <span
                  className={
                    emp.labour.completed
                      ? styles.statusCompleted
                      : styles.statusIncomplete
                  }
                >
                  {emp.labour.completed
                    ? "LABOUR COMPLETED"
                    : "LABOUR NOT COMPLETED"}
                </span>
              </div>

              <div className={styles.right}>
                <span className={styles.totals}>
                  Total Scheduled: {totalHours} hours
                </span>
              </div>
            </div>

            {/* ===== BODY ===== */}
            <div className={styles.employeeBody}>
              {emp.schedules.map((s) => (
                <div key={s.assignmentId} className={styles.scheduleRow}>
                  <CalendarDaysIcon className={styles.icon} />

                  <span className={styles.scheduleText}>
                    {new Date(s.start).toLocaleDateString()}{" "}
                    {new Date(s.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(s.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ({s.hours}h)
                  </span>

                  {!s.completed && onMarkAssignmentCompleted && (
                    <button
                      className={styles.completeBtn}
                      onClick={() => onMarkAssignmentCompleted(s.assignmentId)}
                    >
                      <CheckCircleIcon className={styles.btnIcon} />
                      Mark completed
                    </button>
                  )}

                  {onUnassign && (
                    <button
                      className={styles.removeBtn}
                      title="Remove assignment"
                      onClick={() => onUnassign(s.assignmentId, emp.name)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {emp.schedules.length === 0 && emp.unscheduledAssignmentId && (
                <div className={styles.scheduleRow}>
                  <CalendarDaysIcon className={styles.iconMuted} />

                  <span className={styles.scheduleTextMuted}>
                    Assigned – not scheduled yet (0h)
                  </span>

                  {onUnassign && (
                    <button
                      className={styles.removeBtn}
                      title="Remove assignment"
                      onClick={() =>
                        onUnassign(emp.unscheduledAssignmentId!, emp.name)
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              <div className={styles.timeEntry}>
                Time Entry:{" "}
                <span className={styles.muted}>
                  {emp.labour.enteredHours > 0
                    ? `${emp.labour.enteredHours} hours entered`
                    : "Labour not entered"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssignedEmployees;
