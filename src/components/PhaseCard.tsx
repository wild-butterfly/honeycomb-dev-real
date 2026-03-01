// src/components/PhaseCard.tsx
// Honeycomb © 2026 — PROFESSIONAL VERSION

import React, { useMemo } from "react";
import styles from "./PhaseCard.module.css";
import {
  ClockIcon,
  UserGroupIcon,
  FlagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import type { Assignment, Employee, LabourEntry } from "../types/calendar";
import { JOB_PHASES } from "../pages/DashboardPage";
import { getPhaseFromRawStatus } from "../types/JobLifecycle";

interface Props {
  job: any;
  assignments: Assignment[];
  employees: Employee[];
  labourEntries: LabourEntry[];
  onStatusChange?: (newPhaseKey: string) => void;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function hoursBetween(start: Date, end: Date) {
  return Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 0);
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
  onStatusChange,
}) => {
  const status = String(job?.status ?? "new").toLowerCase();
  const currentPhase = getPhaseFromRawStatus(status);
  const activePhaseConfig =
    JOB_PHASES.find((phase) => phase.key === currentPhase) ?? JOB_PHASES[0];

  const derived = useMemo(() => {
    let scheduled = 0;
    let completed = 0;

    for (const a of assignments) {
      const start = new Date(a.start);
      const end = new Date(a.end);

      const h = hoursBetween(start, end);
      scheduled += h;

      if (a.completed) completed += h;
    }

    const uniqueIds = Array.from(
      new Set(assignments.map((a) => Number(a.employee_id))),
    );

    const assignedEmployees = uniqueIds
      .map((id) => employees.find((e) => e.id === id))
      .filter(Boolean) as Employee[];

    const scheduledHours = round1(scheduled);
    const completedHours = round1(completed);

    const progress =
      scheduledHours > 0
        ? Math.min((completedHours / scheduledHours) * 100, 100)
        : 0;

    return {
      scheduledHours,
      completedHours,
      progress,
      assignedEmployees,
    };
  }, [assignments, employees]);

  const totalRevenue = useMemo(() => {
    return round1(labourEntries.reduce((sum, e) => sum + e.hours * e.rate, 0));
  }, [labourEntries]);

  return (
    <div className={styles.card}>
      {/* HEADER */}

      <div className={styles.header}>
        <div>
          <div className={styles.phaseControl}>
            <div
              className={styles.phaseBadge}
              style={{ borderColor: activePhaseConfig.color }}
            >
              <span
                className={styles.phaseBadgeDot}
                style={{ backgroundColor: activePhaseConfig.color }}
              />
              <span className={styles.phaseBadgeText}>
                {activePhaseConfig.label}
              </span>
            </div>

            <label className={styles.phaseSelectWrap}>
              <span className={styles.phaseSelectLabel}>Job Phase</span>
              <select
                className={styles.phaseSelect}
                value={currentPhase}
                onChange={(e) => onStatusChange?.(e.target.value)}
                disabled={!onStatusChange}
                aria-label="Select job phase"
              >
                {JOB_PHASES.map((phase) => (
                  <option key={phase.key} value={phase.key}>
                    {phase.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h1 className={styles.title}>{job?.title ?? "Untitled job"}</h1>

          <div className={styles.client}>{job?.client ?? "No client"}</div>
        </div>

        {/* KPI block */}

        <div className={styles.kpiBlock}>
          <div className={styles.progressBig}>
            {derived.progress.toFixed(0)}%
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${derived.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* BODY */}

      <div className={styles.body}>
        {/* STAFF */}

        <div className={styles.section}>
          <UserGroupIcon className={styles.sectionIcon} />

          <div>
            <div className={styles.sectionLabel}>Assigned Staff</div>

            {derived.assignedEmployees.length === 0 ? (
              <div className={styles.muted}>No staff assigned</div>
            ) : (
              <div className={styles.avatarStack}>
                {derived.assignedEmployees.map((emp) => (
                  <div key={emp.id} className={styles.avatar}>
                    {initials(emp.name)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HOURS */}

        <div className={styles.section}>
          <ClockIcon className={styles.sectionIcon} />

          <div>
            <div className={styles.sectionLabel}>Hours</div>

            <div className={styles.sectionValue}>
              {derived.completedHours} / {derived.scheduledHours}
            </div>
          </div>
        </div>

        {/* REVENUE */}

        <div className={styles.section}>
          <CurrencyDollarIcon className={styles.sectionIcon} />

          <div>
            <div className={styles.sectionLabel}>Revenue</div>

            <div className={styles.sectionValue}>${totalRevenue}</div>
          </div>
        </div>

        {/* PRIORITY */}

        <div className={styles.section}>
          <FlagIcon className={styles.sectionIcon} />

          <div>
            <div className={styles.sectionLabel}>Priority</div>

            <div className={styles.sectionValue}>
              {job?.priority ?? "Normal"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseCard;
