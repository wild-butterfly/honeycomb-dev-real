// Created by Clevermode © 2025. All rights reserved.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useEffect } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useLocation } from "react-router-dom";

import styles from "./CalendarPage.module.css";
import { fetchEmployees } from "../services/employees";
import { isSameDay as isSameDayDate } from "date-fns";

import DashboardNavbar from "../components/DashboardNavbar";
import CalendarControlsBar from "../components/CalendarControlsBar";
import SidebarJobs from "../components/SidebarJobs";
import MonthCalendarLayout from "../components/MonthCalendarLayout";
import WeekCalendarLayout from "../components/WeekCalendarLayout";
import DesktopCalendarLayout from "../components/DesktopCalendarLayout";

import MobileMonthList from "../components/MobileMonthList";
import MobileWeekList from "../components/MobileWeekList";
import MobileDayList from "../components/MobileDayList";

import CalendarJobDetailsModal from "../components/CalendarJobDetailsModal";
import { toLocalISOString } from "../utils/date";

import { saveJobToFirestore } from "../utils/saveJobToFirestore";
import { deleteJobFromFirestore } from "../services/calendarJobs";

import { getJobStart, getAssignedEmployeeIds } from "../utils/jobTime";

/* TYPES */
export type Employee = {
  id: number;
  name: string;
};

export type Assignment = {
  id: string;
  employeeId: number;
  start?: string;
  end?: string;
  scheduled?: boolean;
};

export type CalendarJob = {
  id: string;
  title: string;
  customer: string;

  status?: "active" | "completed" | "return" | "quote";
  color?: string;
  location?: string;
  siteContact?: string;
  contactInfo?: string;
  notes?: string;

  deleted?: boolean;
  deletedAt?: any;

  assignments: Assignment[];
};

/* JOB SEED */
const jobsSeed: CalendarJob[] = [];

/* HELPERS */

function toJsDate(v: any): Date | null {
  if (!v) return null;

  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  if (typeof v === "string") {
    const d = new Date(v);
    return !isNaN(d.getTime()) ? d : null;
  }

  return null;
}

function normalizeDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function getWeekRange(ref: Date) {
  const day = new Date(ref);
  day.setHours(0, 0, 0, 0);

  const monday = new Date(day);
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function jobHasAssignmentOnDay(job: CalendarJob, day: Date) {
  return job.assignments.some((a) => {
    if (a.scheduled === false) return false;
    if (!a.start) return false;

    const d = new Date(a.start);
    if (isNaN(d.getTime())) return false;

    return (
      d.getFullYear() === day.getFullYear() &&
      d.getMonth() === day.getMonth() &&
      d.getDate() === day.getDate()
    );
  });
}

function assignmentsForDay(job: CalendarJob, employeeId: number, day: Date) {
  return job.assignments.filter((a) => {
    if (a.scheduled === false) return false; // 🔥 KRİTİK
    if (!a.start) return false;
    if (a.employeeId !== employeeId) return false;

    const d = new Date(a.start);
    if (isNaN(d.getTime())) return false;

    return (
      d.getFullYear() === day.getFullYear() &&
      d.getMonth() === day.getMonth() &&
      d.getDate() === day.getDate()
    );
  });
}

function isSameWeek(job: CalendarJob, ref: Date) {
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return job.assignments.some((a) => {
    if (a.scheduled === false) return false;
    if (!a.start) return false;

    const d = new Date(a.start);
    if (isNaN(d.getTime())) return false;

    return d >= monday && d <= sunday;
  });
}

/* ------------------------------------------------------ */
/* MAIN PAGE */
/* ------------------------------------------------------ */
const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeMode, setRangeMode] = useState<"day" | "week" | "month">("day");

  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);

  const [jobFilter, setJobFilter] = useState<
    "all" | "unassigned" | "active" | "completed" | "return" | "quote"
  >("all");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<CalendarJob[]>(jobsSeed);

  const addEmployeeFromModal = async (jobId: string, employeeId: number) => {
    const base = new Date(selectedDate);
    base.setHours(0, 0, 0, 0);

    const start = new Date(base);
    start.setHours(9, 0, 0, 0);

    const end = new Date(base);
    end.setHours(17, 0, 0, 0);

    await addAssignmentToExistingJob(jobId, employeeId, start, end);
  };
  // SCHEDULE MODE
  const [scheduleMode, setScheduleMode] = useState<{
    jobId: string;
    employeeId: number;
  } | null>(null);

  // (Bu fonksiyon kullanılmıyor ama kalsın istersen)
  const startSchedule = (jobId: string, employeeId: number) => {
    setScheduleMode({ jobId, employeeId });
  };

  const [openJobId, setOpenJobId] = useState<string | null>(null);

  const openJob = useMemo(
    () => jobs.find((j) => j.id === openJobId) || null,
    [jobs, openJobId],
  );

  useEffect(() => {
    console.log("🧪 openJobId:", openJobId);
    console.log("🧪 openJob:", openJob);
  }, [openJobId, openJob]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const view = params.get("view");
    const date = params.get("date");
    const jobId = params.get("jobId");
    const mode = params.get("mode");
    const employeeId = params.get("employeeId");

    if (view === "day") setRangeMode("day");
    if (view === "week") setRangeMode("week");
    if (view === "month") setRangeMode("month");

    if (date) setSelectedDate(new Date(date));

    if (jobId && openJobId == null && mode !== "schedule") {
      setOpenJobId(String(jobId));
    }

    if (mode === "schedule" && jobId && employeeId) {
      setScheduleMode({
        jobId,
        employeeId: Number(employeeId),
      });

      setRangeMode("day");
      setOpenJobId(null);
    }

    if (mode !== "schedule" && scheduleMode !== null) {
      setScheduleMode(null);
    }
  }, [location.search]);

  useEffect(() => {
    console.log("openJobId:", openJobId, "scheduleMode:", scheduleMode);
  }, [openJobId, scheduleMode]);

  // LOAD EMPLOYEES
  useEffect(() => {
    async function load() {
      const list = await fetchEmployees();

      const converted = list.map((e) => ({
        id: Number(e.id.replace(/\D/g, "").slice(0, 6)) || Date.now(),
        name: e.name,
      }));

      setEmployees(converted);
    }
    load();
  }, []);

  // AUTOSCROLL TO 6AM (desktop timeline)
  useEffect(() => {
    if (employees.length === 0) return;
    setTimeout(() => {
      const timeline = document.querySelector(
        ".timelineWrapper",
      ) as HTMLElement | null;
      if (timeline) timeline.scrollLeft = 6 * 104;
    }, 300);
  }, [employees]);

  /* LIVE LOAD JOBS + ASSIGNMENTS (SINGLE SOURCE OF TRUTH) */
  useEffect(() => {
    const assignmentUnsubs = new Map<string, () => void>();

    const unsubJobs = onSnapshot(collection(db, "jobs"), (jobsSnap) => {
      const jobIds = jobsSnap.docs.map((d) => d.id);

      setJobs((prev) => prev.filter((j) => jobIds.includes(j.id)));

      jobsSnap.docs.forEach((jobDoc) => {
        const jobId = jobDoc.id;
        const jobData = jobDoc.data() as any;

        setJobs((prev) => {
          const existing = prev.find((j) => j.id === jobId);
          const existingAssignments = existing?.assignments ?? [];

          const nextJob: CalendarJob = {
            id: jobId,
            title: jobData.title ?? "",
            customer: jobData.customer ?? "",
            status: jobData.status,
            color: jobData.color,
            location: jobData.location,
            siteContact: jobData.siteContact,
            contactInfo: jobData.contactInfo,
            notes: jobData.notes,
            deleted: jobData.deleted,
            deletedAt: jobData.deletedAt,
            assignments: existingAssignments,
          };

          if (!existing) return [...prev, nextJob];
          return prev.map((j) => (j.id === jobId ? nextJob : j));
        });

        if (!assignmentUnsubs.has(jobId)) {
          const unsubAssignments = onSnapshot(
            collection(db, "jobs", jobId, "assignments"),
            (assignSnap) => {
              const assignments: Assignment[] = assignSnap.docs.map((a) => ({
                id: a.id,
                ...(a.data() as any),
              }));

              setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, assignments } : j)),
              );
            },
          );

          assignmentUnsubs.set(jobId, unsubAssignments);
        }
      });

      assignmentUnsubs.forEach((unsub, jobId) => {
        if (!jobIds.includes(jobId)) {
          unsub();
          assignmentUnsubs.delete(jobId);
        }
      });
    });

    return () => {
      unsubJobs();
      assignmentUnsubs.forEach((u) => u());
      assignmentUnsubs.clear();
    };
  }, []);

  const handleOpenJob = (jobId: string) => {
    setScheduleMode(null);
    setOpenJobId(jobId);
  };

  useEffect(() => {
    if (openJobId) {
      setScheduleMode(null);
    }
  }, [openJobId]);

  // 🔍 DEBUG
  useEffect(() => {
    console.log("🧪 jobs", jobs);
  }, [jobs]);
  /* ========================================================= */
  /* 🔑 ASSIGNMENT MOVE ADAPTERS                               */
  /* ========================================================= */

  /**
   * CORE move logic (assignment-aware)
   */
  const moveAssignmentCore = async (
    jobId: string,
    assignmentId: string,
    fromEmployeeId: number,
    newStart: Date,
    newEnd: Date,
    targetEmployeeId?: number,
  ) => {
    await setDoc(
      doc(db, "jobs", jobId, "assignments", assignmentId),
      {
        employeeId: targetEmployeeId ?? fromEmployeeId,
        start: toLocalISOString(newStart),
        end: toLocalISOString(newEnd),
        scheduled: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  };
  /* ========================================================= */
  /* 🗑 ASSIGNMENT DELETE                                      */
  /* ========================================================= */

  const deleteAssignment = async (jobId: string, assignmentId: string) => {
    await deleteDoc(doc(db, "jobs", jobId, "assignments", assignmentId));
  };

  /**
   * 🔄 DAY VIEW ADAPTER (DesktopCalendarLayout → Assignment)
   * Legacy signature → assignment-aware logic
   */
  const handleDayMoveAdapter = (
    jobId: string,
    employeeId: number,
    start: Date,
    end: Date,
    targetEmployeeId?: number,
  ) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const assignment = job.assignments.find((a) => {
      if (a.employeeId !== employeeId) return false;
      if (!a.start) return false;

      const d = new Date(a.start);
      if (isNaN(d.getTime())) return false;

      return (
        d.getFullYear() === start.getFullYear() &&
        d.getMonth() === start.getMonth() &&
        d.getDate() === start.getDate()
      );
    });

    if (!assignment) {
      console.warn("⚠️ Day adapter: assignment not found", {
        jobId,
        employeeId,
      });
      return;
    }

    moveAssignmentCore(
      jobId,
      assignment.id,
      employeeId,
      start,
      end,
      targetEmployeeId,
    );
  };

  /**
   * DAY view (DesktopCalendarLayout)
   */
  const handleDayMove = (
    jobId: string,
    fromEmployeeId: number,
    toEmployeeId: number,
    start: Date,
    end: Date,
    assignmentId: string,
  ) => {
    if (!assignmentId) {
      console.warn("⚠️ Day move without assignmentId");
      return;
    }

    moveAssignmentCore(
      jobId,
      assignmentId,
      fromEmployeeId,
      start,
      end,
      toEmployeeId,
    );
  };

  /**
   * WEEK view (WeekCalendarLayout)
   */
  const handleWeekMove = (
    jobId: string,
    fromEmployeeId: number,
    start: Date,
    end: Date,
    targetEmployeeId?: number,
    assignmentId?: string,
  ) => {
    if (!assignmentId) return;
    moveAssignmentCore(
      jobId,
      assignmentId,
      fromEmployeeId,
      start,
      end,
      targetEmployeeId,
    );
  };

  /**
   * MONTH view (MonthCalendarLayout)
   */
  const handleMonthMove = (
    jobId: string,
    employeeId: number,
    start: Date,
    end: Date,
    assignmentId?: string,
  ) => {
    if (!assignmentId) return;
    moveAssignmentCore(jobId, assignmentId, employeeId, start, end);
  };

  /* ✅ MOVE ASSIGNMENT (time + optional employee change) */
  const handleJobMove = async (
    jobId: string,
    assignmentId: string,
    fromEmployeeId: number,
    newStart: Date,
    newEnd: Date,
    targetEmployeeId?: number,
  ) => {
    const startISO = newStart.toISOString();
    const endISO = newEnd.toISOString();

    await setDoc(
      doc(db, "jobs", jobId, "assignments", assignmentId),
      {
        employeeId: targetEmployeeId ?? fromEmployeeId,
        start: startISO,
        end: endISO,
        scheduled: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  };
  /* ➕ ADD JOB (create job doc + first assignment) */
  const addAssignmentToJob = async (
    jobId: string,
    employeeId: number,
    start: Date,
    end: Date,
  ) => {
    await addDoc(collection(db, "jobs", jobId, "assignments"), {
      employeeId,
      start: toLocalISOString(start),
      end: toLocalISOString(end),
      scheduled: true,
      createdAt: serverTimestamp(),
    });
  };

  const addAssignmentToExistingJob = async (
    jobId: string,
    employeeId: number,
    start: Date,
    end: Date,
  ) => {
    await addDoc(collection(db, "jobs", jobId, "assignments"), {
      employeeId,
      start: toLocalISOString(start),
      end: toLocalISOString(end),
      scheduled: true,
      createdAt: serverTimestamp(),
    });
  };

  const [draftJob, setDraftJob] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const handleAddJobAt = async (employeeId: number, start: Date, end: Date) => {
    // 🔥 SCHEDULE MODE
    if (scheduleMode) {
      await addAssignmentToExistingJob(
        scheduleMode.jobId,
        employeeId,
        start,
        end,
      );

      setSelectedStaff([]);
      return;
    }
    setDraftJob({ start, end });

    // 🔥 NORMAL MODE
    const jobRef = await addDoc(collection(db, "jobs"), {
      title: "New Job",
      customer: "New Customer",
      status: "active",
      color: "#faf7dc",
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "jobs", jobRef.id, "assignments"), {
      employeeId,
      start: toLocalISOString(start),
      end: toLocalISOString(end),
      scheduled: true,
      createdAt: serverTimestamp(),
    });
  };

  /* FILTERS */

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.deleted) return false;

      if (jobFilter === "all") return true;
      if (jobFilter === "unassigned")
        return getAssignedEmployeeIds(job).length === 0;

      return job.status === jobFilter;
    });
  }, [jobFilter, jobs]);

  const staffFilteredJobs = useMemo(() => {
    if (selectedStaff.length === 0) return filteredJobs;
    return filteredJobs.filter((job) =>
      getAssignedEmployeeIds(job).some((id) => selectedStaff.includes(id)),
    );
  }, [filteredJobs, selectedStaff]);

  // 🔑 DAY VIEW –
  const jobsForSelectedDay = useMemo(() => {
    return staffFilteredJobs.filter((job) =>
      jobHasAssignmentOnDay(job, selectedDate),
    );
  }, [staffFilteredJobs, selectedDate]);

  /* MONTH GROUP */
  const groupedMonthJobs = staffFilteredJobs.reduce(
    (acc, job) => {
      job.assignments.forEach((a) => {
        if (a.scheduled === false) return;
        if (!a.start) return;

        const d = new Date(a.start);
        if (isNaN(d.getTime())) return;

        if (
          d.getMonth() !== selectedDate.getMonth() ||
          d.getFullYear() !== selectedDate.getFullYear()
        )
          return;

        const day = d.getDate();
        if (!acc[day]) acc[day] = [];
        acc[day].push(job);
      });

      return acc;
    },
    {} as Record<number, CalendarJob[]>,
  );
  /* NAVIGATION */
  const goPrev = () => {
    const d = new Date(selectedDate);
    if (rangeMode === "month") d.setMonth(d.getMonth() - 1);
    else if (rangeMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goNext = () => {
    const d = new Date(selectedDate);
    if (rangeMode === "month") d.setMonth(d.getMonth() + 1);
    else if (rangeMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  return (
    <>
      {/* 🔥 NAVBAR */}
      <DashboardNavbar
        onNewJob={async () => {
          const base = new Date(selectedDate);

          const start = new Date(base);
          start.setHours(9, 0, 0, 0);

          const end = new Date(base);
          end.setHours(10, 0, 0, 0);

          // 🔥 1) Firestore
          const jobRef = await addDoc(collection(db, "jobs"), {
            title: "",
            customer: "",
            location: "",
            siteContact: "",
            contactInfo: "",
            notes: "",
            status: "active",
            color: "#fff9e6",
            createdAt: serverTimestamp(),
          });

          await addDoc(collection(db, "jobs", jobRef.id, "assignments"), {
            employeeId: null,
            start: toLocalISOString(start),
            end: toLocalISOString(end),
            scheduled: true,
            createdAt: serverTimestamp(),
          });

          // 🔥 3) Modal + calendar senkron
          setOpenJobId(jobRef.id);
          setRangeMode("day");
        }}
      />

      {/* 🔥 CALENDAR PAGE */}
      <div className={styles.dashboardBg}>
        <div className={styles.calendarPageShell}>
          <CalendarControlsBar
            date={selectedDate}
            onPrev={goPrev}
            onNext={goNext}
            rangeMode={rangeMode}
            onRangeModeChange={setRangeMode}
            employees={employees}
            staffFilter={selectedStaff}
            onStaffFilterChange={setSelectedStaff}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* ================= MONTH ================= */}
        {rangeMode === "month" && (
          <>
            <div className={styles.onlyMobile}>
              <MobileMonthList
                selectedDate={selectedDate}
                monthGroups={groupedMonthJobs}
                employees={employees}
                onJobClick={handleOpenJob}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={staffFilteredJobs}
                  onJobClick={handleOpenJob}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>

            <div className={styles.onlyDesktop}>
              <div className={styles.monthLayoutWide}>
                <MonthCalendarLayout
                  date={selectedDate}
                  jobs={staffFilteredJobs}
                  employees={employees}
                  selectedStaff={selectedStaff}
                  onStaffChange={setSelectedStaff}
                  onJobClick={handleOpenJob}
                  onJobMove={handleMonthMove}
                  onAddJobAt={handleAddJobAt}
                />

                <aside className={styles.sidebarWrapper}>
                  <SidebarJobs
                    jobs={staffFilteredJobs}
                    onJobClick={handleOpenJob}
                    jobFilter={jobFilter}
                    onJobFilterChange={setJobFilter}
                  />
                </aside>
              </div>
            </div>
          </>
        )}

        {/* ================= WEEK ================= */}
        {rangeMode === "week" && (
          <>
            <div className={styles.onlyMobile}>
              <MobileWeekList
                jobs={staffFilteredJobs.filter((j) =>
                  isSameWeek(j, selectedDate),
                )}
                employees={employees}
                selectedDate={selectedDate}
                onJobClick={handleOpenJob}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={staffFilteredJobs.filter((j) =>
                    isSameWeek(j, selectedDate),
                  )}
                  onJobClick={handleOpenJob}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>

            <div className={styles.onlyDesktop}>
              <div className={styles.desktopMainAndSidebar}>
                <div className={styles.timelineCardWrapper}>
                  <WeekCalendarLayout
                    date={selectedDate}
                    jobs={staffFilteredJobs.filter((j) =>
                      isSameWeek(j, selectedDate),
                    )}
                    employees={employees}
                    onJobClick={handleOpenJob}
                    onJobMove={handleWeekMove}
                    onAddJobAt={handleAddJobAt}
                  />
                </div>

                <aside className={styles.sidebarWrapper}>
                  <SidebarJobs
                    jobs={staffFilteredJobs.filter((j) =>
                      isSameWeek(j, selectedDate),
                    )}
                    onJobClick={handleOpenJob}
                    jobFilter={jobFilter}
                    onJobFilterChange={setJobFilter}
                  />
                </aside>
              </div>
            </div>
          </>
        )}

        {/* ================= DAY ================= */}
        {rangeMode === "day" && (
          <>
            <div className={styles.onlyMobile}>
              <MobileDayList
                jobs={jobsForSelectedDay}
                employees={employees}
                selectedDate={selectedDate}
                onJobClick={handleOpenJob}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={jobsForSelectedDay}
                  onJobClick={handleOpenJob}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>

            <div className={styles.onlyDesktop}>
              <div className={styles.desktopMainAndSidebar}>
                <div className={styles.timelineCardWrapper}>
                  <DesktopCalendarLayout
                    date={selectedDate}
                    employees={employees}
                    jobs={jobsForSelectedDay}
                    onJobClick={handleOpenJob}
                    selectedEmployeeId={
                      selectedStaff.length === 1 ? selectedStaff[0] : undefined
                    }
                    onAddJobAt={handleAddJobAt}
                    onCloneJobAt={async (jobId, employeeId, start, end) => {
                      await addAssignmentToJob(jobId, employeeId, start, end);
                    }}
                    onMoveJob={handleDayMoveAdapter}
                    scheduleMode={scheduleMode}
                    clearScheduleMode={() => setScheduleMode(null)}
                  />
                </div>

                <aside className={styles.sidebarWrapper}>
                  <SidebarJobs
                    jobs={jobsForSelectedDay}
                    onJobClick={handleOpenJob}
                    jobFilter={jobFilter}
                    onJobFilterChange={setJobFilter}
                  />
                </aside>
              </div>
            </div>
          </>
        )}

        {/* ================= MODAL ================= */}
        {openJob && scheduleMode == null && (
          <CalendarJobDetailsModal
            mode="view"
            job={openJob}
            employees={employees}
            selectedDate={selectedDate}
            onClose={() => setOpenJobId(null)}
            onSave={async (updatedJob) => {
              await saveJobToFirestore(updatedJob);
            }}
            onDelete={async () => {
              await deleteJobFromFirestore(openJob.id);
            }}
            onStartSchedule={(jobId, employeeId) => {
              setScheduleMode({ jobId, employeeId });
              setRangeMode("day");
              setOpenJobId(null);
            }}
            onAddEmployee={addEmployeeFromModal}
          />
        )}

        {draftJob && (
          <CalendarJobDetailsModal
            mode="new"
            selectedDate={selectedDate}
            draft={draftJob}
            employees={employees}
            onClose={() => setDraftJob(null)}
            onSave={async (jobData) => {
              // 1️⃣ Create the job document
              const jobRef = await addDoc(collection(db, "jobs"), {
                ...jobData,
                status: "active",
                createdAt: serverTimestamp(),
              });

              // 2️⃣ Create the first assignment using the calendar-selected employee
              // (employeeId comes from handleAddJobAt, not from jobData)
              await addDoc(collection(db, "jobs", jobRef.id, "assignments"), {
                employeeId:
                  selectedStaff.length === 1 ? selectedStaff[0] : null,
                start: toLocalISOString(draftJob.start),
                end: toLocalISOString(draftJob.end),
                scheduled: true,
                createdAt: serverTimestamp(),
              });

              // 3️⃣ Close modal
              setDraftJob(null);
            }}
          />
        )}
      </div>
    </>
  );
};

export default CalendarPage;
