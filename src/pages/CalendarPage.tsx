// Created by Clevermode © 2025. All rights reserved.
import React, { useState, useMemo } from "react";
import styles from "./CalendarPage.module.css";

import DashboardNavbar from "../components/DashboardNavbar";
import CalendarControlsBar from "../components/CalendarControlsBar";
import SidebarJobs from "../components/SidebarJobs";
import MonthCalendarLayout from "../components/MonthCalendarLayout";
import WeekCalendarLayout from "../components/WeekCalendarLayout";
import DesktopCalendarLayout from "../components/DesktopCalendarLayout";

import CalendarJobDetailsModal from "../components/CalendarJobDetailsModal";

/* TYPES */
export type Employee = {
  id: number;
  name: string;
};

export type CalendarJob = {
  id: number;
  title: string;
  customer: string;
  assignedTo: number[];
  start: string;
  end: string;

  status?: "active" | "completed" | "return" | "quote";
  color?: string;

  location?: string;
  siteContact?: string;
  contactInfo?: string;
  notes?: string;

  futureEvents?: CalendarJob[];
  pastEvents?: CalendarJob[];
};

/* EMPLOYEES */
const employeesSeed: Employee[] = [
  { id: 1, name: "Aşkın Fear" },
  { id: 2, name: "Daniel Fear" },
  { id: 3, name: "Jackobi Forsyth" },
  { id: 4, name: "Jason Fear" },
  { id: 5, name: "Lachlan McConchie" },
  { id: 6, name: "Lance Meyer" },
  { id: 7, name: "Yasin Yaka" },
  { id: 8, name: "z Richard F" },
  { id: 9, name: "z Adelaide Daniel T" },
];

/* JOB SEED */
const jobsSeed: CalendarJob[] = [
  {
    id: 101,
    title: "Test & Tag",
    customer: "Bared Footwear",
    assignedTo: [1],
    start: "2025-11-03T09:00",
    end: "2025-11-03T10:30",
    status: "active",
    color: "#e4f4de",
  },
  {
    id: 102,
    title: "Test & Tag",
    customer: "Karbon Australia Pty",
    assignedTo: [2],
    start: "2025-11-04T08:30",
    end: "2025-11-04T10:00",
    status: "return",
    color: "#dff5f5",
  },
  {
    id: 103,
    title: "Safety Inspection",
    customer: "Metro Rail",
    assignedTo: [],
    start: "2025-11-05T13:00",
    end: "2025-11-05T14:00",
    status: "active",
    color: "#f7e6ff",
  },
  {
    id: 104,
    title: "Emergency Repair",
    customer: "City Library",
    assignedTo: [3],
    start: "2025-11-03T14:00",
    end: "2025-11-03T15:00",
    status: "completed",
    color: "#d8f5d2",
  },
  {
    id: 105,
    title: "Tagging Session",
    customer: "State Hospital",
    assignedTo: [4],
    start: "2025-11-06T09:00",
    end: "2025-11-06T11:30",
    status: "quote",
    color: "#e8ddff",
  },
  {
    id: 106,
    title: "Electrical Compliance",
    customer: "Town Hall",
    assignedTo: [1],
    start: "2025-11-07T10:00",
    end: "2025-11-07T12:00",
    status: "active",
    color: "#e4f4de",
  },
  {
    id: 107,
    title: "RCD Testing",
    customer: "Cafe Aroma",
    assignedTo: [5],
    start: "2025-11-07T13:00",
    end: "2025-11-07T15:00",
    status: "return",
    color: "#fff3cd",
  },
  {
    id: 108,
    title: "PAT Testing",
    customer: "Tech Hub Co",
    assignedTo: [],
    start: "2025-11-08T08:00",
    end: "2025-11-08T09:00",
    status: "active",
    color: "#dff5f5",
  },
  {
    id: 109,
    title: "Site Inspection",
    customer: "Logistics Warehouse",
    assignedTo: [2],
    start: "2025-11-09T11:00",
    end: "2025-11-09T12:00",
    status: "completed",
    color: "#d8f5d2",
  },
  {
    id: 110,
    title: "Annual Check",
    customer: "Laser Clinic",
    assignedTo: [3],
    start: "2025-11-10T09:30",
    end: "2025-11-10T11:00",
    status: "quote",
    color: "#e8ddff",
  },
  {
    id: 111,
    title: "Warehouse Test",
    customer: "Furniture King",
    assignedTo: [7],
    start: "2025-11-11T08:00",
    end: "2025-11-11T10:00",
    status: "active",
    color: "#dff5f5",
  },
  {
    id: 112,
    title: "Portable Appliance Test",
    customer: "School of Arts",
    assignedTo: [],
    start: "2025-11-12T12:00",
    end: "2025-11-12T13:30",
    status: "active",
    color: "#e4f4de",
  },
  {
    id: 113,
    title: "Safety Testing",
    customer: "Gym Central",
    assignedTo: [6],
    start: "2025-11-12T14:00",
    end: "2025-11-12T15:00",
    status: "completed",
    color: "#d8f5d2",
  },
  {
    id: 114,
    title: "Test & Tag",
    customer: "OfficePro",
    assignedTo: [9],
    start: "2025-11-14T09:00",
    end: "2025-11-14T10:30",
    status: "return",
    color: "#fff3cd",
  },
  {
    id: 115,
    title: "Full Safety Audit",
    customer: "BigMart Retail",
    assignedTo: [4],
    start: "2025-11-14T11:00",
    end: "2025-11-14T14:00",
    status: "active",
    color: "#dff5f5",
  },
];

/* HELPERS */
function isSameDay(dateStr: string, day: Date) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function isSameWeek(dateStr: string, week: Date) {
  const d = new Date(dateStr);
  const ws = new Date(week);
  ws.setDate(ws.getDate() - ws.getDay() + 1);
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  return d >= ws && d <= we;
}

/* MAIN PAGE */
const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeMode, setRangeMode] = useState<"day" | "week" | "month">("month");

  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);

  const [jobFilter, setJobFilter] =
    useState<"all" | "unassigned" | "active" | "completed" | "return" | "quote">(
      "all"
    );

  const [employees] = useState(employeesSeed);
  const [jobs, setJobs] = useState(jobsSeed);

  const [openJobId, setOpenJobId] = useState<number | null>(null);
  const openJob = useMemo(
    () => jobs.find((j) => j.id === openJobId) || null,
    [jobs, openJobId]
  );

  /* FILTERED BY JOB STATUS */
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobFilter === "all") return true;
      if (jobFilter === "unassigned") return job.assignedTo.length === 0;
      return job.status === jobFilter;
    });
  }, [jobFilter, jobs]);

  /* ⭐ STAFF FILTERED JOBS ⭐ */
  const staffFilteredJobs = useMemo(() => {
    if (selectedStaff.length === 0) return filteredJobs;
    return filteredJobs.filter((job) =>
      job.assignedTo.some((id) => selectedStaff.includes(id))
    );
  }, [filteredJobs, selectedStaff]);

  /* JOBS THIS MONTH */
  const jobsThisMonth = staffFilteredJobs.filter((j) => {
    const d = new Date(j.start);
    return (
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  });

  /* JOB MAP FOR DAY VIEW */
  const jobsByEmployee = useMemo(() => {
    const map: Record<number, CalendarJob[]> = {};
    employees.forEach((e) => (map[e.id] = []));

    staffFilteredJobs.forEach((job) => {
      job.assignedTo.forEach((empId) => {
        if (!map[empId]) map[empId] = [];
        map[empId].push(job);
      });
    });

    return map;
  }, [staffFilteredJobs, employees]);

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
          staffFilter={"all"}
          onStaffFilterChange={() => {}}
          onDateChange={setSelectedDate}
        />

        {/* MONTH MODE */}
        {rangeMode === "month" && (
          <div className={styles.monthLayoutWide}>
            <MonthCalendarLayout
              date={selectedDate}
              jobs={jobsThisMonth}
              employees={employees}
              selectedStaff={selectedStaff}
              onStaffChange={setSelectedStaff}
              onJobClick={(id) => setOpenJobId(id)}
              onJobMove={() => {}}
              onAddJobAt={() => {}}
            />

            <aside className={styles.sidebarWrapper}>
              <SidebarJobs
                jobs={jobsThisMonth}
                onJobClick={(id) => setOpenJobId(id)}
                jobFilter={jobFilter}
                onJobFilterChange={setJobFilter}
              />
            </aside>
          </div>
        )}

        {/* WEEK MODE */}
        {rangeMode === "week" && (
          <div className={styles.desktopMainAndSidebar}>
            <div className={styles.timelineCardWrapper}>
              <WeekCalendarLayout
                date={selectedDate}
                jobs={staffFilteredJobs.filter((j) =>
                  isSameWeek(j.start, selectedDate)
                )}
                employees={employees}
                onJobClick={(id) => setOpenJobId(id)}
                onJobMove={() => {}}
                onAddJobAt={() => {}}
              />
            </div>

            <aside className={styles.sidebarWrapper}>
              <SidebarJobs
                jobs={staffFilteredJobs.filter((j) =>
                  isSameWeek(j.start, selectedDate)
                )}
                onJobClick={(id) => setOpenJobId(id)}
                jobFilter={jobFilter}
                onJobFilterChange={setJobFilter}
              />
            </aside>
          </div>
        )}

        {/* DAY MODE */}
        {rangeMode === "day" && (
          <div className={styles.desktopMainAndSidebar}>
            <div className={styles.timelineCardWrapper}>
              <DesktopCalendarLayout
                date={selectedDate}
                employees={employees}
                jobsByEmployee={jobsByEmployee}
                onJobClick={(id) => setOpenJobId(id)}
                onAddJobAt={() => {}}
                onMoveJob={() => {}}
              />
            </div>

            <aside className={styles.sidebarWrapper}>
              <SidebarJobs
                jobs={staffFilteredJobs.filter((j) =>
                  isSameDay(j.start, selectedDate)
                )}
                onJobClick={(id) => setOpenJobId(id)}
                jobFilter={jobFilter}
                onJobFilterChange={setJobFilter}
              />
            </aside>
          </div>
        )}
      </div>

      {openJob && (
        <CalendarJobDetailsModal
          job={openJob}
          employees={employees}
          allJobs={jobs}
          onClose={() => setOpenJobId(null)}
          onSave={(updated) =>
            setJobs((prev) =>
              prev.map((j) => (j.id === updated.id ? updated : j))
            )
          }
          onDelete={() =>
            setJobs((prev) => prev.filter((j) => j.id !== openJob.id))
          }
        />
      )}
    </div>
  );
};

export default CalendarPage;
