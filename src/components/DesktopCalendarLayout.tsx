// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useState } from "react";
import styles from "./DesktopCalendarLayout.module.css";
import type { Employee, CalendarJob } from "../pages/CalendarPage";

interface Props {
  date: Date;
  employees: Employee[];
  jobs: CalendarJob[]; // ✔️ düz liste
  onAddJobAt?: (employeeId: number, start: Date, end: Date) => void;
  onMoveJob?: (
    jobId: number,
    employeeId: number,
    newStart: Date,
    newEnd: Date
  ) => void;
  onJobClick?: (jobId: number) => void;
}

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 20;
const HOUR_WIDTH_PX = 104;

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ---------------------------------------------------
   BADGE RENDER -- ✔️ Day view için EKLENDİ
--------------------------------------------------- */
const renderBadge = (job: CalendarJob) => {
  if (!job.status) return null;

  if (job.status === "quote")
    return <div className={styles.badgeQuote}>QUOTE</div>;

  if (job.status === "completed")
    return <div className={styles.badgeCompleted}>COMPLETED</div>;

  if (job.status === "return")
    return <div className={styles.badgeReturn}>NEED TO RETURN</div>;

  return null;
};

const DesktopCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  jobs,
  onAddJobAt,
  onMoveJob,
  onJobClick,
}) => {
  const [draggingJobId, setDraggingJobId] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR },
        (_, i) => DAY_START_HOUR + i
      ),
    []
  );

  /* ---------------------------------------------------
     JOBS BY EMPLOYEE -- ✔️ component içinde hesaplanıyor
  --------------------------------------------------- */
  const jobsByEmployee: Record<number, CalendarJob[]> = useMemo(() => {
    const map: Record<number, CalendarJob[]> = {};
    employees.forEach((e) => (map[e.id] = []));
    jobs.forEach((job) => {
      job.assignedTo.forEach((empId) => {
        if (map[empId]) map[empId].push(job);
      });
    });
    return map;
  }, [jobs, employees]);

  const findJobById = (id: number) =>
    jobs.find((j) => j.id === id) || null;

  /* ---------------------------------------------------
     DRAG / DROP
  --------------------------------------------------- */
  const handleDropOnSlot = (e: React.DragEvent, employeeId: number) => {
    if (!draggingJobId || !onMoveJob) return;

    const job = findJobById(draggingJobId);
    if (!job) return;

    const lane = (e.currentTarget as HTMLElement).closest(
      `.${styles.jobsLane}`
    ) as HTMLElement;
    if (!lane) return;

    const rect = lane.getBoundingClientRect();
    const relativeX = e.clientX - rect.left - dragOffsetX;

    const hourOffset = relativeX / HOUR_WIDTH_PX;
    const rawHour = DAY_START_HOUR + hourOffset;

    const hour = Math.floor(rawHour);
    const minuteFloat = (rawHour % 1) * 60;
    const minuteRounded = Math.round(minuteFloat / 15) * 15;

    const finalHour = hour + (minuteRounded === 60 ? 1 : 0);
    const finalMinute = minuteRounded === 60 ? 0 : minuteRounded;

    const newStart = new Date(date);
    newStart.setHours(finalHour, finalMinute, 0, 0);

    const oStart = new Date(job.start);
    const oEnd = new Date(job.end);
    const duration = oEnd.getTime() - oStart.getTime();

    const newEnd = new Date(newStart.getTime() + duration);

    onMoveJob(draggingJobId, employeeId, newStart, newEnd);
    setDraggingJobId(null);
  };

  /* ---------------------------------------------------
     RENDER
  --------------------------------------------------- */
  return (
    <div className={styles.desktopWrapper}>

      {/* HEADER */}
      <div className={styles.timelineRow}>
        <div className={styles.staffCell}></div>

        <div className={styles.jobsLane}>
          <div className={styles.timeSlotsHeader}>
            {hours.map((h) => (
              <div key={h} className={styles.timeSlotHeaderCell}>
                {h}:00
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.timelineBodyArea}>
        {employees.map((emp) => {
          const empJobs = jobsByEmployee[emp.id] || [];

          return (
            <div key={emp.id} className={styles.timelineRow}>

              {/* STAFF CELL */}
              <div className={styles.staffCell}>
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

              {/* JOB LANE */}
              <div className={styles.jobsLane}>
                {/* BACKGROUND SLOTS */}
                <div className={styles.jobsLaneSlots}>
                  {hours.map((h) => {
                    const slotStart = new Date(date);
                    slotStart.setHours(h, 0, 0, 0);

                    const slotEnd = new Date(slotStart);
                    slotEnd.setHours(slotEnd.getHours() + 1);

                    return (
                      <div
                        key={h}
                        className={styles.timeSlotCell}
                        onDragOver={(e) =>
                          draggingJobId && e.preventDefault()
                        }
                        onDrop={(e) => handleDropOnSlot(e, emp.id)}
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
                  const start = new Date(job.start);
                  const end = new Date(job.end);

                  if (!sameDay(start, date)) return null;

                  const startMinutes =
                    (start.getHours() - DAY_START_HOUR) * 60 +
                    start.getMinutes();

                  const durationMinutes =
                    (end.getTime() - start.getTime()) / 60000;

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
                        const rect =
                          (e.target as HTMLElement).getBoundingClientRect();
                        setDragOffsetX(e.clientX - rect.left);
                      }}
                      onDragEnd={() => setDraggingJobId(null)}
                      onClick={() => onJobClick?.(job.id)}
                      className={styles.jobBlock}
                      style={{
                        left,
                        width,
                        backgroundColor: job.color || "#fffdf0",
                      }}
                    >
                      {/* ✔️ BADGE BURADA */}
                      {renderBadge(job)}

                      <div className={styles.jobBlockTitle}>{job.title}</div>
                      <div className={styles.jobBlockCustomer}>
                        {job.customer}
                      </div>

                      {job.location && (
                        <div className={styles.jobBlockLocation}>
                          {job.location}
                        </div>
                      )}

                      {job.estimatedTags !== undefined && (
                        <div className={styles.jobBlockEstimated}>
                          Estimated: {job.estimatedTags} tags
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
  );
};

export default DesktopCalendarLayout;
