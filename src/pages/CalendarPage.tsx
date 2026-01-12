// Created by Clevermode © 2025. All rights reserved.
import React, { useState, useMemo, useEffect } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useLocation } from "react-router-dom";

import styles from "./CalendarPage.module.css";
import { fetchEmployees } from "../services/employees";

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

import {
  saveJobToFirestore,
  deleteJobFromFirestore,
} from "../utils/saveJobToFirestore";

import { getJobStart, getAssignedEmployeeIds } from "../utils/jobTime";
import { Timestamp } from "firebase/firestore";

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

function isSameDay(job: CalendarJob, day: Date) {
  return job.assignments.some((a) => {
    // 🔑 scheduled true OLANLAR
    // 🔑 VEYA eski kayıtlar (scheduled yok ama start/end var)
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
    [jobs, openJobId]
  );

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

    // ✅ openJobId SADECE ilk load’da set edilsin
    if (jobId && openJobId == null) {
      setOpenJobId(String(jobId));
    }

    // ✅ schedule mode SADECE modal kapalıyken aktif olsun
    if (mode === "schedule" && jobId && employeeId && openJobId == null) {
      setScheduleMode({
        jobId,
        employeeId: Number(employeeId),
      });
      setRangeMode("day");
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
        ".timelineWrapper"
      ) as HTMLElement | null;
      if (timeline) timeline.scrollLeft = 6 * 104;
    }, 300);
  }, [employees]);

  /* LIVE LOAD JOBS + ASSIGNMENTS (SINGLE SOURCE OF TRUTH) */
  useEffect(() => {
    const assignmentUnsubs: (() => void)[] = [];

    const unsubJobs = onSnapshot(collection(db, "jobs"), (jobsSnap) => {
      setJobs([]); // 🔥 ÖNEMLİ: günü değiştirince state temizlenir

      jobsSnap.docs.forEach((jobDoc) => {
        const jobId = jobDoc.id;

        const unsubAssignments = onSnapshot(
          collection(db, "jobs", jobId, "assignments"),
          (assignSnap) => {
            const assignments = assignSnap.docs.map((a) => ({
              id: a.id,
              ...(a.data() as any),
            }));

            setJobs((prev) => {
              const exists = prev.find((j) => j.id === jobId);

              const nextJob = {
                id: jobId,
                ...(jobDoc.data() as any),
                assignments,
              };

              if (!exists) return [...prev, nextJob];
              return prev.map((j) => (j.id === jobId ? nextJob : j));
            });
          }
        );

        assignmentUnsubs.push(unsubAssignments);
      });
    });

    return () => {
      unsubJobs();
      assignmentUnsubs.forEach((u) => u());
    };
  }, []);

  const handleOpenJob = (jobId: string) => {
    setScheduleMode(null); // 🔥 en kritik satır
    setOpenJobId(jobId);
  };

  /* ✅ MOVE ASSIGNMENT (time + optional employee change) */
  const handleJobMove = async (
    jobId: string,
    employeeId: number, // dragged assignment owner
    newStart: Date,
    newEnd: Date,
    targetEmployeeId?: number
  ) => {
    if (!jobId || typeof jobId !== "string") return;
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) return;

    const startISO = newStart.toISOString();
    const endISO = newEnd.toISOString();

    const finalEmployeeId = targetEmployeeId ?? employeeId;

    /* 🔹 Optimistic UI */
    setJobs((prev) =>
      prev.map((job) => {
        if (String(job.id) !== String(jobId)) return job;

        const filtered = job.assignments.filter(
          (a) => Number(a.employeeId) !== employeeId
        );

        return {
          ...job,
          assignments: [
            ...filtered,
            {
              id: `${jobId}-${finalEmployeeId}`,
              employeeId: finalEmployeeId,
              start: startISO,
              end: endISO,
            },
          ],
        };
      })
    );

    /* 🔥 Firestore */
    if (finalEmployeeId !== employeeId) {
      await deleteDoc(
        doc(db, "jobs", String(jobId), "assignments", String(employeeId))
      );
    }

    await setDoc(
      doc(db, "jobs", String(jobId), "assignments", String(finalEmployeeId)),
      {
        employeeId: finalEmployeeId,
        start: startISO,
        end: endISO,
        scheduled: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  };
  /* ➕ ADD JOB (create job doc + first assignment) */
  const handleAddJobAt = async (employeeId: number, start: Date, end: Date) => {
    if (
      !(start instanceof Date) ||
      isNaN(start.getTime()) ||
      !(end instanceof Date) ||
      isNaN(end.getTime())
    ) {
      console.error("Invalid dates in handleAddJobAt", { start, end });
      return;
    }

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    const jobRef = await addDoc(collection(db, "jobs"), {
      title: "New Job",
      customer: "New Customer",
      status: "active",
      color: "#faf7dc",
      notes: "",
      location: "",
      siteContact: "",
      contactInfo: "",
      createdAt: new Date(),
    });

    await setDoc(
      doc(db, "jobs", jobRef.id, "assignments", String(employeeId)),
      {
        employeeId,
        start: startISO,
        end: endISO,
        scheduled: true,
        createdAt: new Date(),
      }
    );
  };

  /* FILTERS */
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobFilter === "all") return true;
      if (jobFilter === "unassigned")
        return getAssignedEmployeeIds(job).length === 0;
      return job.status === jobFilter;
    });
  }, [jobFilter, jobs]);

  const staffFilteredJobs = useMemo(() => {
    if (selectedStaff.length === 0) return filteredJobs;
    return filteredJobs.filter((job) =>
      getAssignedEmployeeIds(job).some((id) => selectedStaff.includes(id))
    );
  }, [filteredJobs, selectedStaff]);

  /* MONTH GROUP */
  const jobsThisMonth = staffFilteredJobs.filter((j) => {
    const d = getJobStart(j);
    return (
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  });

  const groupedMonthJobs = jobsThisMonth.reduce((acc, job) => {
    const day = getJobStart(job).getDate();
    if (!acc[day]) acc[day] = [];
    acc[day].push(job);
    return acc;
  }, {} as Record<number, CalendarJob[]>);

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
    <div className={styles.dashboardBg}>
      <DashboardNavbar />

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
        />{" "}
      </div>

      {/* MONTH */}
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
                jobs={jobsThisMonth}
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
                jobs={jobsThisMonth}
                employees={employees}
                selectedStaff={selectedStaff}
                onStaffChange={setSelectedStaff}
                onJobClick={handleOpenJob}
                onJobMove={handleJobMove}
                onAddJobAt={handleAddJobAt}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={jobsThisMonth}
                  onJobClick={handleOpenJob}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>
          </div>
        </>
      )}

      {/* WEEK */}
      {rangeMode === "week" && (
        <>
          <div className={styles.onlyMobile}>
            <MobileWeekList
              jobs={staffFilteredJobs.filter((j) =>
                isSameWeek(j, selectedDate)
              )}
              employees={employees}
              selectedDate={selectedDate}
              onJobClick={handleOpenJob}
            />

            <aside className={styles.sidebarWrapper}>
              <SidebarJobs
                jobs={staffFilteredJobs.filter((j) =>
                  isSameWeek(j, selectedDate)
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
                    isSameWeek(j, selectedDate)
                  )}
                  employees={employees}
                  onJobClick={handleOpenJob}
                  onJobMove={handleJobMove}
                  onAddJobAt={handleAddJobAt}
                />
              </div>

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={staffFilteredJobs.filter((j) =>
                    isSameWeek(j, selectedDate)
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

      {/* DAY */}
      {rangeMode === "day" && (
        <>
          <div className={styles.onlyMobile}>
            <MobileDayList
              jobs={staffFilteredJobs.filter((j) => isSameDay(j, selectedDate))}
              employees={employees}
              selectedDate={selectedDate}
              onJobClick={handleOpenJob}
            />

            <aside className={styles.sidebarWrapper}>
              <SidebarJobs
                jobs={staffFilteredJobs.filter((j) =>
                  isSameDay(j, selectedDate)
                )}
                onJobClick={handleOpenJob}
                jobFilter={jobFilter}
                onJobFilterChange={setJobFilter}
              />
            </aside>
          </div>

          <div className={styles.onlyDesktop}>
            <div className={styles.desktopMainAndSidebar}>
              {/* 🔥 SOL TARAF – TIMELINE */}
              <div className={styles.timelineCardWrapper}>
                <DesktopCalendarLayout
                  date={selectedDate}
                  employees={employees}
                  jobs={staffFilteredJobs.filter((j) =>
                    isSameDay(j, selectedDate)
                  )}
                  onJobClick={handleOpenJob}
                  selectedEmployeeId={
                    selectedStaff.length === 1 ? selectedStaff[0] : undefined
                  }
                  onAddJobAt={handleAddJobAt}
                  onMoveJob={handleJobMove}
                  scheduleMode={scheduleMode}
                  clearScheduleMode={() => setScheduleMode(null)}
                />
              </div>

              {/* 🔥 SAĞ TARAF – SIDEBAR */}
              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={staffFilteredJobs.filter((j) =>
                    isSameDay(j, selectedDate)
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

      {/* MODAL */}
      {openJob && scheduleMode == null && (
        <CalendarJobDetailsModal
          job={openJob}
          employees={employees}
          onClose={() => setOpenJobId(null)}
          onSave={async (updatedJob) => {
            await saveJobToFirestore(updatedJob);
          }}
          onDelete={async () => {
            setJobs((prev) => prev.filter((j) => j.id !== openJob.id));
            await deleteJobFromFirestore(openJob.id);
          }}
          onStartSchedule={(jobId, employeeId) => {
            setScheduleMode({ jobId, employeeId });
            setRangeMode("day");
            setOpenJobId(null);
          }}
        />
      )}
    </div>
  );
};

export default CalendarPage;
