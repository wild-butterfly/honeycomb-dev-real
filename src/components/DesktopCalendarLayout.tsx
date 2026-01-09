// Created by Clevermode © 2025
import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "./DesktopCalendarLayout.module.css";
import type { Employee, CalendarJob } from "../pages/CalendarPage";
import {
  getJobStart,
  getJobEnd,
  getAssignedEmployeeIds,
} from "../utils/jobTime";

interface Props {
  date: Date;
  employees: Employee[];
  jobs: CalendarJob[];

  onJobClick: (jobId: string) => void;
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
  onMoveJob: (
    jobId: string,
    employeeId: number,
    newStart: Date,
    newEnd: Date
  ) => void;

  selectedEmployeeId?: number;

  // 🔥 SCHEDULE MODE
  scheduleMode?: {
    jobId: string;
    employeeId: number;
  } | null;

  onScheduleExistingJob?: (
    jobId: string,
    employeeId: number,
    start: Date
  ) => void;
}

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_WIDTH_PX = 104;
const DEFAULT_VIEW_START = 6;

const formatHourLabel = (h: number) => {
  if (h === 0) return "12AM";
  if (h < 12) return `${h}AM`;
  if (h === 12) return "12PM";
  return `${h - 12}PM`;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function safeDate(d: Date | null | undefined, fallback: Date) {
  return d instanceof Date && !isNaN(d.getTime()) ? d : fallback;
}

const DesktopCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  jobs,
  onJobClick,
  selectedEmployeeId,
  onAddJobAt,
  onMoveJob,

  scheduleMode,
  onScheduleExistingJob,
}) => {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i),
    []
  );

  /* ================= MAP JOBS BY EMPLOYEE (ASSIGNMENTS) ================= */
  const jobsByEmployee: Record<number, CalendarJob[]> = useMemo(() => {
    const map: Record<number, CalendarJob[]> = {};
    for (const e of employees) map[e.id] = [];

    for (const job of jobs) {
      const empIds = getAssignedEmployeeIds(job) ?? [];

      for (const raw of empIds) {
        const empId = Number(raw);
        if (!Number.isFinite(empId)) continue;
        if (!map[empId]) continue;

        if (!selectedEmployeeId || empId === selectedEmployeeId) {
          map[empId].push(job);
        }
      }
    }

    return map;
  }, [jobs, employees, selectedEmployeeId]);

  const findJobById = (id: string) => jobs.find((j) => j.id === id) || null;

  /* ================= SCROLL SYNC ================= */
  useEffect(() => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (!body || !header) return;

    const sync = () => {
      header.scrollLeft = body.scrollLeft;
    };

    body.addEventListener("scroll", sync);
    return () => body.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = DEFAULT_VIEW_START * HOUR_WIDTH_PX;
    }
  }, []);

  /* ================= DRAG DROP ================= */
  const handleDropOnSlot = (
    e: React.DragEvent<HTMLDivElement>,
    employeeId: number
  ) => {
    e.preventDefault();
    if (!draggingJobId || !onMoveJob) return;

    const job = findJobById(draggingJobId);
    if (!job) return;

    const lane = (e.currentTarget as HTMLElement).closest(
      `.${styles.jobsLane}`
    ) as HTMLElement | null;
    if (!lane) return;

    const rect = lane.getBoundingClientRect();
    const relativeX = e.clientX - rect.left - dragOffsetX;

    if (!Number.isFinite(relativeX)) return;

    const rawHour = relativeX / HOUR_WIDTH_PX;
    const hour = Math.floor(rawHour);
    const minuteFloat = (rawHour % 1) * 60;
    const minuteRounded = Math.round(minuteFloat / 15) * 15;

    const finalHour = hour + (minuteRounded === 60 ? 1 : 0);
    const finalMinute = minuteRounded === 60 ? 0 : minuteRounded;

    const newStart = new Date(date);
    newStart.setHours(finalHour, finalMinute, 0, 0);

    // duration = oldEnd - oldStart (safe)
    const fallbackStart = new Date(date);
    fallbackStart.setHours(9, 0, 0, 0);
    const fallbackEnd = new Date(date);
    fallbackEnd.setHours(10, 0, 0, 0);

    const oStart = safeDate(getJobStart(job) as any, fallbackStart);
    const oEnd = safeDate(getJobEnd(job) as any, fallbackEnd);
    const duration = Math.max(
      15 * 60 * 1000,
      oEnd.getTime() - oStart.getTime()
    ); // min 15dk

    const newEnd = new Date(newStart.getTime() + duration);

    onMoveJob(job.id, employeeId, newStart, newEnd);
    setDraggingJobId(null);
  };

  /* ================= RENDER ================= */
  return (
    <div className={styles.calendarOuter}>
      {/* HEADER */}
      <div className={styles.stickyHeader}>
        <div className={styles.staffHeaderCell} />
        <div className={styles.headerScroll} ref={headerScrollRef}>
          <div className={styles.hoursRow}>
            {hours.map((h) => (
              <div key={h} className={styles.hourCell}>
                {formatHourLabel(h)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.bodyWrapper}>
        {/* STAFF COLUMN */}
        <div className={styles.staffColumn}>
          {employees.map((emp) => (
            <div key={emp.id} className={styles.staffCell}>
              <div className={styles.staffAvatarCircle}>
                {emp.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className={styles.staffName}>{emp.name}</div>
            </div>
          ))}
        </div>

        {/* TIMELINE */}
        <div
          className={`${styles.timelineScroll} timelineWrapper`}
          ref={bodyScrollRef}
        >
          {employees.map((emp) => {
            const empJobs =
              selectedEmployeeId && emp.id !== selectedEmployeeId
                ? []
                : jobsByEmployee[emp.id] || [];

            return (
              <div key={emp.id} className={styles.timelineRow}>
                <div className={styles.jobsLane}>
                  {/* GRID */}
                  <div className={styles.timeSlotsRow}>
                    {hours.map((h) => {
                      const slotStart = new Date(date);
                      slotStart.setHours(h, 0, 0, 0);
                      const slotEnd = new Date(slotStart);
                      slotEnd.setHours(slotEnd.getHours() + 1);

                      return (
                        <div
                          key={h}
                          className={styles.timeSlotCell}
                          onDragOver={(e) => {
                            if (draggingJobId) e.preventDefault();
                          }}
                          onDrop={(e) => handleDropOnSlot(e, emp.id)}
                          onMouseDown={(e) => {
                            if (!scheduleMode || !onScheduleExistingJob) return;

                            if (emp.id !== scheduleMode.employeeId) return;

                            e.preventDefault();
                            e.stopPropagation();

                            const start = new Date(date);
                            start.setHours(h, 0, 0, 0);

                            onScheduleExistingJob(
                              scheduleMode.jobId,
                              scheduleMode.employeeId,
                              start
                            );
                          }}
                        >
                          {onAddJobAt && (
                            <button
                              type="button"
                              className={styles.slotAddButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddJobAt(emp.id, slotStart, slotEnd);
                              }}
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* JOB BLOCKS */}
                  {empJobs.map((job) => {
                    const fallbackStart = new Date(date);
                    fallbackStart.setHours(9, 0, 0, 0);
                    const fallbackEnd = new Date(date);
                    fallbackEnd.setHours(10, 0, 0, 0);

                    const start = safeDate(
                      getJobStart(job) as any,
                      fallbackStart
                    );
                    const end = safeDate(getJobEnd(job) as any, fallbackEnd);

                    if (!sameDay(start, date)) return null;

                    const startMinutes =
                      start.getHours() * 60 + start.getMinutes();
                    const durationMinutes = Math.max(
                      15,
                      (end.getTime() - start.getTime()) / 60000
                    );

                    const left = (startMinutes / 60) * HOUR_WIDTH_PX;
                    const width = Math.max(
                      (durationMinutes / 60) * HOUR_WIDTH_PX - 6,
                      70
                    );

                    return (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggingJobId(job.id);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDragOffsetX(e.clientX - rect.left);
                        }}
                        onDragEnd={() => setDraggingJobId(null)}
                        onClick={(e) => {
                          if (scheduleMode && scheduleMode.jobId === job.id) {
                            e.stopPropagation();
                            return;
                          }

                          onJobClick(job.id);
                        }}
                        className={styles.jobBlock}
                        style={{
                          left,
                          width,
                          backgroundColor: job.color || "#fffdf0",
                          cursor:
                            scheduleMode && scheduleMode.jobId === job.id
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <div className={styles.jobBlockTitle}>{job.title}</div>
                        <div className={styles.jobBlockCustomer}>
                          {job.customer}
                        </div>
                        {job.location && (
                          <div className={styles.jobBlockLocation}>
                            {job.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DesktopCalendarLayout;
