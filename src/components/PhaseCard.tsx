// src/components/PhaseCard.tsx
// Honeycomb © 2026

import React, { useMemo } from "react";
import styles from "./PhaseCard.module.css";
import {
  ClockIcon,
  UserGroupIcon,
  FlagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import type { Assignment, Employee, LabourEntry } from "../types/calendar";

interface Props {
  job: any;
  assignments: Assignment[];
  employees: Employee[];
  labourEntries: LabourEntry[];
}

/* ================= HELPERS ================= */

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function hoursBetween(start: Date, end: Date) {
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return diff > 0 ? diff : 0;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PhaseCard: React.FC<Props> = ({
  job,
  assignments,
  employees,
  labourEntries,
}) => {
  const phases = ["quoted", "scheduled", "active", "completed", "invoiced"];
  const status = String(job?.status ?? "active").toLowerCase();

  /* ================= ASSIGNMENT DERIVED ================= */

  const derived = useMemo(() => {
    let scheduled = 0;
    let completed = 0;

    for (const a of assignments) {
      const start =
        a.start instanceof Date ? a.start : new Date(a.start as any);
      const end = a.end instanceof Date ? a.end : new Date(a.end as any);

      const h = hoursBetween(start, end);
      scheduled += h;

      if (a.completed === true) completed += h;
    }

    const uniqueIds = Array.from(
      new Set(assignments.map((a) => Number(a.employee_id))),
    ).filter((id) => Number.isFinite(id));

    const assignedEmployees = uniqueIds
      .map((id) => employees.find((e) => Number(e.id) === id))
      .filter(Boolean) as Employee[];

    const scheduledHours = round1(scheduled);
    const completedHours = round1(completed);

    const progress =
      scheduledHours > 0
        ? Math.min((completedHours / scheduledHours) * 100, 100)
        : 0;

    return { scheduledHours, completedHours, progress, assignedEmployees };
  }, [assignments, employees]);

  /* ================= REVENUE ================= */

  const totalRevenue = useMemo(() => {
    return round1(
      labourEntries
        .filter((e) => e.billable !== false)
        .reduce((sum, entry) => {
          return sum + entry.hours * entry.rate;
        }, 0),
    );
  }, [labourEntries]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.card}>
      {/* Phase Tabs */}
      <div className={styles.phaseTabs}>
        {phases.map((p) => (
          <span
            key={p}
            className={`${styles.phaseTab} ${
              status === p ? styles.activePhase : ""
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </span>
        ))}
      </div>

      <div className={styles.body}>
        {/* LEFT */}
        <div className={styles.left}>
          <h1 className={styles.title}>{job?.title ?? "Untitled job"}</h1>
          <div className={styles.client}>{job?.client ?? "—"}</div>

          <div className={styles.metaRow}>
            <ClockIcon className={styles.icon} />
            <span>{derived.scheduledHours}h scheduled</span>
          </div>

          <div className={styles.metaRow}>
            <UserGroupIcon className={styles.icon} />

            {derived.assignedEmployees.length === 0 ? (
              <span className={styles.muted}>No staff assigned</span>
            ) : (
              <div className={styles.avatarStack}>
                {derived.assignedEmployees.slice(0, 3).map((emp) => (
                  <div key={emp.id} className={styles.avatar} title={emp.name}>
                    {initials(emp.name)}
                  </div>
                ))}
                {derived.assignedEmployees.length > 3 && (
                  <div className={styles.moreAvatar}>
                    +{derived.assignedEmployees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          <div className={styles.progressBig}>
            {derived.progress.toFixed(0)}%
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${derived.progress}%` }}
            />
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <ClockIcon className={styles.metricIcon} />
              <div>
                <div className={styles.metricValue}>
                  {derived.completedHours}h / {derived.scheduledHours}h
                </div>
                <div className={styles.metricLabel}>Hours</div>
              </div>
            </div>

            <div className={styles.metric}>
              <CurrencyDollarIcon className={styles.metricIcon} />
              <div>
                <div className={styles.metricValue}>
                  ${totalRevenue.toFixed(0)}
                </div>
                <div className={styles.metricLabel}>Revenue</div>
              </div>
            </div>

            <div className={styles.metric}>
              <FlagIcon className={styles.metricIcon} />
              <div>
                <div className={styles.metricValue}>
                  {job?.priority ?? "Normal"}
                </div>
                <div className={styles.metricLabel}>Priority</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseCard;
