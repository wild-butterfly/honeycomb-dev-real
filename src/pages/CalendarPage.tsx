// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useState } from "react";
import styles from "./CalendarPage.module.css";

import DashboardNavbar from "../components/DashboardNavbar";
import CalendarControlsBar from "../components/CalendarControlsBar";
import DesktopCalendarLayout from "../components/DesktopCalendarLayout";
import SidebarJobs from "../components/SidebarJobs";
import MonthCalendarLayout from "../components/MonthCalendarLayout";
import WeekCalendarLayout from "../components/WeekCalendarLayout";

// HONEYCOMB PANEL
import CalendarJobDetailsModal from "../components/CalendarJobDetailsModal";

export type Employee = {
  id: number;
  name: string;
  avatar?: string;
};

export type CalendarJob = {
  id: number;
  title: string;
  customer: string;
  location?: string;

  assignedTo: number[];
  start: string;
  end: string;
  color?: string;

  // Honeycomb panel new fields
  siteContact?: string;
  contactInfo?: string;
  notes?: string;
  pastEvents?: CalendarJob[];
  futureEvents?: CalendarJob[];
};

/* ───────── Seed Data ───────── */
const employeesSeed: Employee[] = [
  { id: 1, name: "Aşkın Fear", avatar: "/avatar2.png" },
  { id: 2, name: "Daniel Fear", avatar: "/avatar1.png" },
  { id: 3, name: "Jackobi Forsyth", avatar: "/avatar3.png" },
  { id: 4, name: "Jason Fear", avatar: "/avatar4.png" },
  { id: 5, name: "Lachlan McConchie", avatar: "/avatar5.png" },
  { id: 6, name: "Lance Meyer", avatar: "/avatar6.png" },
  { id: 7, name: "Yasin Yaka", avatar: "/avatar7.png" },
  { id: 8, name: "z Richard F", avatar: "/avatar8.png" },
  { id: 9, name: "z Adelaide Daniel T", avatar: "/avatar9.png" },
];

const jobsSeed: CalendarJob[] = [
  {
    id: 101,
    title: "Test & Tag",
    customer: "Bared Footwear",
    location: "Melbourne CBD",
    assignedTo: [1],
    start: "2025-11-03T09:00",
    end: "2025-11-03T10:30",
    siteContact: "Aşkın Fear",
    contactInfo: "0400 123 456",
    notes: "Check fire extinguishers + kitchen appliances.",
    color: "#e4f4de",
  },
  {
    id: 102,
    title: "Test & Tag",
    customer: "Karbon Australia Pty",
    location: "Richmond",
    assignedTo: [2],
    start: "2025-11-04T08:30",
    end: "2025-11-04T10:00",
    siteContact: "Daniel Fear",
    contactInfo: "0400 555 444",
    notes: "Warehouse + office testing.",
    color: "#dff5f5",
  },
];

/* ───────── Helpers ───────── */
function isSameDay(dateStr: string, day: Date) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function jobMatchesStaff(job: CalendarJob, staff: number | "all") {
  return staff === "all" ? true : job.assignedTo.includes(staff);
}

/* ───────── Component ───────── */
const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rangeMode, setRangeMode] = useState<"day" | "week" | "month">("day");
  const [staffFilter, setStaffFilter] = useState<number | "all">("all");
  const [monthStaffFilter, setMonthStaffFilter] = useState<number[]>([]);

  const [employees] = useState<Employee[]>(employeesSeed);
  const [jobs, setJobs] = useState<CalendarJob[]>(jobsSeed);

  /* Quick Panel state */
  const [openJobId, setOpenJobId] = useState<number | null>(null);
  const openJob = useMemo(
    () => jobs.find((j) => j.id === openJobId) ?? null,
    [jobs, openJobId]
  );

  const jobsByEmployee = useMemo(() => {
    const map: { [empId: number]: CalendarJob[] } = {};
    employees.forEach((emp) => {
      map[emp.id] = jobs.filter(
        (j) =>
          isSameDay(j.start, selectedDate) &&
          j.assignedTo.includes(emp.id) &&
          jobMatchesStaff(j, staffFilter)
      );
    });
    return map;
  }, [employees, jobs, selectedDate, staffFilter]);

  /* Navigation */
  const goPrevDay = () => {
    const d = new Date(selectedDate);
    if (rangeMode === "month") d.setMonth(d.getMonth() - 1);
    else if (rangeMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goNextDay = () => {
    const d = new Date(selectedDate);
    if (rangeMode === "month") d.setMonth(d.getMonth() + 1);
    else if (rangeMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  /* Add Job */
  const handleAddJobAt = (employeeId: number, start: Date, end: Date) => {
    const newId = Math.floor(Math.random() * 999999);
    const newJob: CalendarJob = {
      id: newId,
      title: "New Job",
      customer: "",
      location: "",
      assignedTo: [employeeId],
      start: start.toISOString(),
      end: end.toISOString(),
      siteContact: "",
      contactInfo: "",
      notes: "",
      color: "#fffdf0",
    };
    setJobs((prev) => [...prev, newJob]);
    setOpenJobId(newId);
  };

  /* Move Job */
  const handleMoveJob = (
    jobId: number,
    employeeId: number,
    newStart: Date,
    newEnd: Date
  ) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              assignedTo: [employeeId],
              start: newStart.toISOString(),
              end: newEnd.toISOString(),
            }
          : j
      )
    );
  };

  /* Open Job */
  const handleJobClick = (id: number) => {
    setOpenJobId(id);
  };

  /* Save Job */
  const handleSaveJob = (updated: CalendarJob) =>
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));

  /* Delete Job */
  const handleDeleteJob = (jobId: number) =>
    setJobs((prev) => prev.filter((j) => j.id !== jobId));

  return (
    <div className={styles.dashboardBg}>
      <DashboardNavbar
        searchValue={""}
        onSearchChange={() => {}}
        onNewJob={() => console.log("New Job")}
      />

      <div className={styles.calendarPageShell}>
        <CalendarControlsBar
          date={selectedDate}
          onPrev={goPrevDay}
          onNext={goNextDay}
          rangeMode={rangeMode}
          onRangeModeChange={setRangeMode}
          employees={employees}
          staffFilter={staffFilter}
          onStaffFilterChange={setStaffFilter}
        />

        {/* MONTH VIEW */}
        {rangeMode === "month" ? (
          <MonthCalendarLayout
            date={selectedDate}
            jobs={jobs.filter(
              (j) =>
                monthStaffFilter.length === 0 ||
                j.assignedTo.some((id) => monthStaffFilter.includes(id))
            )}
            employees={employees}
            selectedStaff={monthStaffFilter}
            onStaffChange={setMonthStaffFilter}
            onJobClick={handleJobClick}
            onJobMove={handleMoveJob}
          />
        ) : rangeMode === "week" ? (
          /* WEEK VIEW */
          <div className={styles.desktopWrapper}>
            <div className={styles.desktopMainAndSidebar}>
              <div className={styles.timelineCardWrapper}>
                <WeekCalendarLayout
                  date={selectedDate}
                  jobs={jobs.filter((j) => jobMatchesStaff(j, staffFilter))}
                  employees={employees}
                  onJobClick={handleJobClick}
                  onJobMove={handleMoveJob}
                />
              </div>
              <aside className={styles.sidebarWrapper}>
                <SidebarJobs jobs={jobs} onJobClick={handleJobClick} />
              </aside>
            </div>
          </div>
        ) : (
          /* DAY VIEW */
          <div className={styles.desktopWrapper}>
            <div className={styles.desktopMainAndSidebar}>
              <div className={styles.timelineCardWrapper}>
                <DesktopCalendarLayout
                  date={selectedDate}
                  employees={employees}
                  jobsByEmployee={jobsByEmployee}
                  onAddJobAt={handleAddJobAt}
                  onMoveJob={handleMoveJob}
                  onJobClick={handleJobClick}
                />
              </div>
              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={jobs.filter(
                    (j) =>
                      isSameDay(j.start, selectedDate) &&
                      jobMatchesStaff(j, staffFilter)
                  )}
                  onJobClick={handleJobClick}
                />
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* ───────── HONEYCOMB SLIDE-IN PANEL ───────── */}
      {openJob && (
        <CalendarJobDetailsModal
          job={openJob}
          employees={employees}
          onClose={() => setOpenJobId(null)}
          onSave={handleSaveJob}
          onDelete={() => handleDeleteJob(openJob.id)}
        />
      )}
    </div>
  );
};

export default CalendarPage;
export { jobsSeed };

