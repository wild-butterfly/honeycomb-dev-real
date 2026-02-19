// Created by Clevermode © 2025

import React, { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./CalendarPage.module.css";

import DashboardNavbar from "../components/DashboardNavbar";
import CalendarControlsBar from "../components/CalendarControlsBar";
import MonthCalendarLayout from "../components/MonthCalendarLayout";
import WeekCalendarLayout from "../components/WeekCalendarLayout";
import DesktopCalendarLayout from "../components/DesktopCalendarLayout";
import SidebarJobs from "../components/SidebarJobs";
import CalendarJobDetailsModal from "../components/CalendarJobDetailsModal";

import { buildCalendarItems } from "../utils/calendarItems";
import type { CalendarItem } from "../utils/calendarItems";
import type {
  JobStatus,
  CalendarJob,
  Employee,
  Assignment,
} from "../types/calendar";

import { fetchEmployees } from "../services/employees";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";
import { useCompany } from "../context/CompanyContext";
import { useLocation, useNavigate } from "react-router-dom";

/* =========================================================
   TYPES
========================================================= */

type CreateJobResponse = { id: number };
type JobFilter = "all" | "unassigned" | JobStatus;

const safeDate = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;

  if (typeof v === "string") {
    // PostgreSQL timestamp → LOCAL Date (UTC kaydırma yok)
    const d = new Date(v.replace(" ", "T"));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

/* =========================================================
   DATE → SQL (LOCAL TIME)
========================================================= */

function toLocalSqlTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/* =========================================================
   COMPONENT
========================================================= */

const CalendarPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  /* ================= STATE ================= */

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<CalendarJob[]>([]);

  const { companyId, loading } = useCompany();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeMode, setRangeMode] = useState<"day" | "week" | "month">("day");

  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");

  const [openContext, setOpenContext] = useState<{
    jobId: number;
    assignmentId: number | null;
  } | null>(null);
  const location = useLocation();

  const cloneContext = useMemo(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("mode") !== "clone") return null;

    const jobId = Number(params.get("job"));
    if (!Number.isFinite(jobId)) return null;

    return { jobId };
  }, [location.search]);

  /* ================= DATE NAV ================= */

  const goPrev = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (rangeMode === "day") d.setDate(d.getDate() - 1);
      if (rangeMode === "week") d.setDate(d.getDate() - 7);
      if (rangeMode === "month") d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goNext = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (rangeMode === "day") d.setDate(d.getDate() + 1);
      if (rangeMode === "week") d.setDate(d.getDate() + 7);
      if (rangeMode === "month") d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    fetchEmployees().then((list) => {
      setEmployees(Array.isArray(list) ? list : []);
    });
  }, []);

  /* ================= LOAD JOBS + ASSIGNMENTS ================= */

  const loadAll = useCallback(async () => {
    const [jobsRaw, assignmentsRaw] = await Promise.all([
      apiGet<any[]>("/jobs"),
      apiGet<any[]>("/assignments"),
    ]);

    const assignmentsByJob = new Map<number, Assignment[]>();

    for (const a of assignmentsRaw ?? []) {
      const jobId = Number(a.job_id);
      if (!Number.isFinite(jobId)) continue;

      const start = safeDate(a.start_time);
      const end = safeDate(a.end_time);

      if (!start || !end || end <= start) continue;

      const assignment: Assignment = {
        id: Number(a.id),
        employee_id: Number(a.employee_id),
        start,
        end,
        completed: Boolean(a.completed),
      };

      if (!assignmentsByJob.has(jobId)) {
        assignmentsByJob.set(jobId, []);
      }

      assignmentsByJob.get(jobId)!.push(assignment);
    }

    const mapped: CalendarJob[] = (jobsRaw ?? []).map((j) => {
      const jobId = Number(j.id);
      return {
        id: jobId,
        title: j.title ?? "",
        client: j.client ?? "",
        address: j.address ?? "",
        notes: j.notes ?? "",
        color: j.color ?? "#fffdf0",
        status: j.status ?? "active",
        contact_name: j.contact_name ?? null,
        contact_email: j.contact_email ?? null,
        contact_phone: j.contact_phone ?? null,
        assignments: assignmentsByJob.get(jobId) ?? [],
      };
    });

    setJobs(mapped);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    loadAll();
  }, [companyId, loadAll]);

  /* ================= MOVE ASSIGNMENT ================= */

  const moveAssignment = async (
    assignmentId: number,
    employee_id: number,
    start: Date,
    end: Date,
  ) => {
    await apiPut(`/assignments/${assignmentId}`, {
      employee_id,
      start_time: toLocalSqlTime(start),
      end_time: toLocalSqlTime(end),
    });
    await loadAll();
  };

  /* ================= ADD JOB + ASSIGNMENT ================= */

  const handleAddJobAt = async (employeeId: number, start: Date, end: Date) => {
    try {
      setOpenContext(null);

      /* -------------------------------------------------- */
      /* CREATE JOB — company_id gönderme
       backend header'dan alacak
    -------------------------------------------------- */

      const payload = {
        title: "New Job",
        status: "active",
        // ❌ REMOVE company_id
      };

      console.log("Creating job (company via header)");

      const job = await apiPost<CreateJobResponse>("/jobs", payload);

      if (!job?.id) return;

      /* -------------------------------------------------- */
      /* CREATE ASSIGNMENT
    -------------------------------------------------- */

      await apiPost("/assignments", {
        job_id: job.id,
        employee_id: employeeId,
        start_time: toLocalSqlTime(start),
        end_time: toLocalSqlTime(end),
      });

      await loadAll();

      setOpenContext({
        jobId: job.id,
        assignmentId: null,
      });
    } catch (err) {
      console.error(err);

      alert("No company selected.\n\nPlease select a company first.");
    }
  };

  /* ================= CLONE ASSIGNMENT ================= */

  const handleCloneAssignmentAt = async (
    employeeId: number,
    start: Date,
    end: Date,
  ) => {
    if (!cloneContext) {
      console.error("Clone context missing");

      return;
    }

    try {
      await apiPost("/assignments", {
        job_id: cloneContext.jobId,

        employee_id: employeeId,

        start_time: toLocalSqlTime(start),

        end_time: toLocalSqlTime(end),
      });

      console.log("✅ Assignment cloned");

      await loadAll();
    } catch (err) {
      console.error("❌ Clone Assignment failed:", err);
    }
  };
  /* ================= FILTER ================= */

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobFilter === "unassigned" && job.assignments.length > 0)
        return false;

      if (selectedStaff.length > 0) {
        return job.assignments.some((a) =>
          selectedStaff.includes(a.employee_id),
        );
      }

      return true;
    });
  }, [jobs, jobFilter, selectedStaff]);

  const calendarItems = useMemo(
    () => buildCalendarItems(filteredJobs),
    [filteredJobs],
  );

  /* ================= RENDER ================= */

  return (
    <div className={styles.dashboardBg}>
      <DashboardNavbar onNewJob={() => {}} />

      <CalendarControlsBar
        date={selectedDate}
        onDateChange={setSelectedDate}
        rangeMode={rangeMode}
        onRangeModeChange={setRangeMode}
        onPrev={goPrev}
        onNext={goNext}
      />

      <div className={styles.calendarShell}>
        <main className={styles.calendarMain}>
          <div className={styles.calendarViewport}>
            {rangeMode === "day" && (
              <DesktopCalendarLayout
                date={selectedDate}
                employees={employees}
                items={calendarItems}
                selectedStaff={selectedStaff}
                onItemClick={(item: CalendarItem) =>
                  setOpenContext({
                    jobId: item.jobId,
                    assignmentId: item.assignmentId,
                  })
                }
                onAssignmentMove={moveAssignment}
                onAddJobAt={
                  cloneContext ? handleCloneAssignmentAt : handleAddJobAt
                }
              />
            )}

            {rangeMode === "week" && (
              <WeekCalendarLayout
                date={selectedDate}
                employees={employees}
                items={calendarItems}
                onItemClick={(item: CalendarItem) =>
                  setOpenContext({
                    jobId: item.jobId,
                    assignmentId: item.assignmentId,
                  })
                }
                onAssignmentMove={moveAssignment}
                onAddJobAt={
                  cloneContext ? handleCloneAssignmentAt : handleAddJobAt
                }
              />
            )}

            {rangeMode === "month" && (
              <MonthCalendarLayout
                date={selectedDate}
                employees={employees}
                items={calendarItems}
                selectedStaff={selectedStaff}
                onStaffChange={setSelectedStaff}
                onItemClick={(item: CalendarItem) =>
                  setOpenContext({ jobId: item.jobId, assignmentId: null })
                }
                onAssignmentMove={moveAssignment}
                onAddJobAt={
                  cloneContext ? handleCloneAssignmentAt : handleAddJobAt
                }
              />
            )}
          </div>
        </main>

        <aside className={styles.jobsColumn}>
          <SidebarJobs
            items={calendarItems}
            jobFilter={jobFilter}
            onJobFilterChange={setJobFilter}
            onJobClick={(jobId) =>
              setOpenContext({ jobId, assignmentId: null })
            }
          />
        </aside>
      </div>

      {openContext && (
        <CalendarJobDetailsModal
          job={jobs.find((j) => j.id === openContext.jobId)!}
          employees={employees}
          focusedAssignmentId={openContext.assignmentId}
          onClose={() => setOpenContext(null)}
          onSave={async (updatedJob) => {
            await apiPut(`/jobs/${updatedJob.id}`, updatedJob);
            await loadAll();
          }}
          onDelete={async (id) => {
            await apiDelete(`/jobs/${id}`);
            setOpenContext(null);
            await loadAll();
          }}
          onAssignmentsChanged={loadAll}
        />
      )}
    </div>
  );
};

export default CalendarPage;
