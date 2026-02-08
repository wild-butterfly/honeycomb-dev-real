// Created by Honeycomb © 2025
import React from "react";
import styles from "./AssignedEmployees.module.css";
import { CalendarDaysIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

import { parseLocalTimestamp } from "../utils/localDate";

/* =========================================================
   TYPES – ASSIGNMENT BASED 
========================================================= */

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
    completed: boolean | null;
  };
}

interface Props {
  employees: AssignedEmployee[];
  onUnassign?: (employeeId: string, employeeName: string) => void;
  onToggleAssignmentCompleted?: (
    assignmentId: string,
    completed: boolean,
  ) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

const AssignedEmployees: React.FC<Props> = ({
  employees,
  onUnassign,
  onToggleAssignmentCompleted,
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
                    emp.labour.completed === true
                      ? styles.statusCompleted
                      : emp.labour.completed === false
                        ? styles.statusIncomplete
                        : styles.statusAssigned
                  }
                >
                  {emp.labour.completed === true
                    ? "LABOUR COMPLETED"
                    : emp.labour.completed === false
                      ? "LABOUR NOT COMPLETED"
                      : "ASSIGNED"}
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
              {emp.schedules.map((s) => {
                const start = parseLocalTimestamp(s.start);
                const end = parseLocalTimestamp(s.end);

                if (!start || !end) return null;

                return (
                  <div key={s.assignmentId} className={styles.scheduleRow}>
                    <CalendarDaysIcon className={styles.icon} />

                    <span className={styles.scheduleText}>
                      {start.toLocaleDateString("en-AU")}{" "}
                      {start.toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {end.toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({s.hours}h)
                    </span>

                    {onToggleAssignmentCompleted && (
                      <button
                        className={
                          s.completed ? styles.undoBtn : styles.completeBtn
                        }
                        onClick={() =>
                          onToggleAssignmentCompleted(
                            s.assignmentId,
                            !s.completed,
                          )
                        }
                      >
                        <CheckCircleIcon className={styles.btnIcon} />
                        {s.completed ? "Undo completion" : "Mark completed"}
                      </button>
                    )}

                    {onUnassign && (
                      <button
                        className={styles.removeBtn}
                        title="Remove assignment"
                        onClick={() => onUnassign(emp.employeeId, emp.name)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

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
