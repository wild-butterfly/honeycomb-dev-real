// Created by Honeycomb © 2025

import React, { useMemo } from "react";
import styles from "./JobAssignedEmployeesSection.module.css";
import type { Assignment, Employee } from "../types/calendar";
import { CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";

/* ================= TYPES ================= */

export type AssignmentRange = {
  start: Date;
  end: Date;
};

export interface JobAssignedEmployeesSectionProps {
  assignments: Assignment[];
  assignees?: Employee[];
  employees: Employee[];

  onSelectAssignment?: (range: AssignmentRange) => void;
  onCompleteAssignments?: (assignmentIds: number[]) => Promise<void>;
  onReopenAssignments?: (ids: number[]) => Promise<void>;

  // 🔥 Premium modal triggers (NO window.confirm anymore)
  onRequestDeleteAssignment?: (assignmentId: number) => void;
  onRequestUnassignEmployee?: (employeeId: number, name: string) => void;
}

/* ================= COMPONENT ================= */

const JobAssignedEmployeesSection: React.FC<
  JobAssignedEmployeesSectionProps
> = ({
  assignments,
  assignees,
  employees,
  onSelectAssignment,
  onCompleteAssignments,
  onReopenAssignments,
  onRequestDeleteAssignment,
  onRequestUnassignEmployee,
}) => {
  /* ================= GROUP ASSIGNMENTS ================= */

  const assignmentsByEmployee = useMemo(() => {
    const map = new Map<number, Assignment[]>();

    assignments.forEach((a) => {
      if (!map.has(a.employee_id)) map.set(a.employee_id, []);
      map.get(a.employee_id)!.push(a);
    });

    return map;
  }, [assignments]);

  /* ================= UNSCHEDULED ASSIGNEES ================= */

  const scheduledEmployeeIds = useMemo(
    () => new Set(assignments.map((a) => a.employee_id)),
    [assignments],
  );

  const unscheduledAssignees = useMemo(() => {
    return (assignees ?? []).filter((e) => !scheduledEmployeeIds.has(e.id));
  }, [assignees, scheduledEmployeeIds]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.container}>
      {/* ================= SCHEDULED EMPLOYEES ================= */}
      {Array.from(assignmentsByEmployee.entries()).map(([employeeId, list]) => {
        const emp = employees.find((e) => e.id === employeeId);
        if (!emp) return null;

        const totalScheduledHours =
          Math.round(
            list.reduce((sum, a) => {
              const diff =
                (a.end.getTime() - a.start.getTime()) / (1000 * 60 * 60);
              return sum + diff;
            }, 0) * 10,
          ) / 10;

        const labourCompleted = list.every((a) => a.completed);

        const initials = emp.name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div key={employeeId} className={styles.employeeCard}>
            {/* HEADER */}
            <div className={styles.header}>
              <div className={styles.employeeInfo}>
                <div className={styles.avatar}>{initials}</div>

                <div>
                  <div className={styles.name}>
                    {emp.name} ({list.length})
                  </div>

                  <div
                    className={`${styles.labourBadge} ${
                      labourCompleted ? styles.completed : styles.notCompleted
                    }`}
                  >
                    {labourCompleted
                      ? "LABOUR COMPLETED"
                      : "LABOUR NOT COMPLETED"}
                  </div>
                </div>
              </div>

              <button
                className={styles.completeBtn}
                onClick={() =>
                  labourCompleted
                    ? onReopenAssignments?.(list.map((a) => a.id))
                    : onCompleteAssignments?.(list.map((a) => a.id))
                }
              >
                {labourCompleted ? "Reopen labour" : "Mark labour as completed"}
              </button>
            </div>

            {/* SUMMARY */}
            <div className={styles.summary}>
              Total Scheduled: {totalScheduledHours} hours
            </div>

            {/* ASSIGNMENTS */}
            {list.map((a) => {
              const date = a.start.toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const fmt = (d: Date) =>
                d.toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                });

              return (
                <div
                  key={a.id}
                  className={styles.assignmentRow}
                  onClick={() =>
                    onSelectAssignment?.({
                      start: a.start,
                      end: a.end,
                    })
                  }
                >
                  <CalendarDaysIcon className={styles.calendarIcon} />

                  <div>
                    <div className={styles.assignmentText}>
                      Scheduled: {date} {fmt(a.start)} – {fmt(a.end)}
                    </div>
                    <div className={styles.subText}>
                      Time Entry: Labour not entered
                    </div>
                  </div>

                  {/* 🔥 Premium confirm trigger */}
                  <button
                    className={styles.removeBtn}
                    title="Remove scheduled time"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDeleteAssignment?.(a.id);
                    }}
                  >
                    <XMarkIcon width={16} />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ================= ASSIGNED BUT NOT SCHEDULED ================= */}
      {unscheduledAssignees.length > 0 && (
        <div className={styles.employeeCard}>
          <div className={styles.header}>
            <div className={styles.employeeInfo}>
              <div className={styles.avatar}>👤</div>

              <div>
                <div className={styles.name}>Assigned (not scheduled)</div>
                <div
                  className={`${styles.labourBadge} ${styles.labourAssigned}`}
                >
                  ASSIGNED
                </div>
              </div>
            </div>
          </div>

          {unscheduledAssignees.map((e) => (
            <div key={e.id} className={styles.assignmentRow}>
              <CalendarDaysIcon className={styles.calendarIcon} />

              <div>
                <div className={styles.assignmentText}>{e.name}</div>
                <div className={styles.subText}>
                  Assigned to job, no schedule yet
                </div>
              </div>

              {/* 🔥 Premium confirm trigger */}
              <button
                className={styles.removeBtn}
                title="Remove from job"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onRequestUnassignEmployee?.(e.id, e.name);
                }}
              >
                <XMarkIcon width={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobAssignedEmployeesSection;
