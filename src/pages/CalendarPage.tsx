// Created by Clevermode © 2025. All rights reserved.
import React, { useState, useMemo } from "react";
import styles from "./CalendarPage.module.css";

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
  estimatedTags?: number;
  notes?: string;
  futureEvents?: CalendarJob[];
  pastEvents?: CalendarJob[];
};

/* EMPLOYEES SEED */
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
    id: 201,
    title: "A1TT-29010 Test & Tag",
    customer: "Rights Information & Advocacy Centre",
    assignedTo: [2],
    start: "2025-12-01T09:00",
    end: "2025-12-01T12:00",
    status: "active",
    color: "#e4f4de",
    location: "48 McKillop Street, Geelong VIC 3220",
    notes: "Annual test due for 2025 retest cycle",
    estimatedTags: 100,
  },
  {
    id: 202,
    title: "A1TT-28146 Test & Tag",
    customer: "Rent A Space Self Storage",
    assignedTo: [3],
    start: "2025-12-01T11:30",
    end: "2025-12-01T14:00",
    status: "active",
    color: "#dff5f5",
    location: "57 Davies Rd, Padstow NSW 2211",
    notes: "Est 54 items due, changed from 14/11 appointment",
    estimatedTags: 54,
  },
  {
    id: 203,
    title: "A1TT-28276a Test & Tag",
    customer: "Brighton Family & Women’s Clinic",
    assignedTo: [1],
    start: "2025-12-01T10:00",
    end: "2025-12-01T14:30",
    status: "active",
    color: "#ffe8d9",
    location: "767 Nepean Hwy, Brighton East VIC 3187",
    notes: "Accreditation testing required this week",
    estimatedTags: 160,
  },
  {
    id: 204,
    title: "A1TT-28100a Test & Tag",
    customer: "Grifols Australia",
    assignedTo: [4],
    start: "2025-12-01T08:00",
    end: "2025-12-01T16:00",
    status: "active",
    color: "#e8ddff",
    location: "8/50 Fairbank Road, Clayton South VIC 3169",
    notes: "1120 items (12 & 36 month cycles). Retest booked by Gary Saville.",
    estimatedTags: 1120,
  },
  {
    id: 205,
    title: "A1TT-28147a Test & Tag",
    customer: "Rent A Space",
    assignedTo: [3],
    start: "2025-12-01T14:00",
    end: "2025-12-01T17:00",
    status: "active",
    color: "#f7e6ff",
    location: "653 Hume Highway, Casula NSW 2170",
    notes: "Est 32 items. Changed from previous date.",
    estimatedTags: 32,
  },
  {
    id: 206,
    title: "A1TT-28290a Test & Tag",
    customer: "Bonfiglioli Transmissions",
    assignedTo: [5],
    start: "2025-12-02T08:00",
    end: "2025-12-02T12:00",
    status: "active",
    color: "#d8f5d2",
    location: "Bonfiglioli Australia, Glendenning NSW",
    notes: "Quarterly maintenance testing",
    estimatedTags: 220,
  },
  {
    id: 207,
    title: "A1TT-28289a Test & Tag",
    customer: "RCI Building Services",
    assignedTo: [2],
    start: "2025-12-05T09:00",
    end: "2025-12-05T13:00",
    status: "active",
    color: "#e4f4de",
    location: "131–149 Somerset Dr, Campbellfield VIC",
    notes: "Est 130 items (mix of tools + office gear)",
    estimatedTags: 130,
  },
  {
    id: 208,
    title: "A1TT-28111 Test & Tag",
    customer: "Cafe Aroma",
    assignedTo: [6],
    start: "2025-12-03T12:00",
    end: "2025-12-03T14:00",
    status: "return",
    color: "#fff3cd",
    location: "125 Main Street, Eltham VIC",
    notes: "Follow-up retest for failed kettle & toaster",
    estimatedTags: 18,
  },
  {
    id: 209,
    title: "A1TT-28424 Test & Tag",
    customer: "Chapel Gate Medical",
    assignedTo: [1],
    start: "2025-12-15T10:00",
    end: "2025-12-15T16:00",
    status: "active",
    color: "#dff5f5",
    location: "171 Chapel St, Prahran VIC",
    notes: "Full clinic retest. Need access to all consult rooms.",
    estimatedTags: 210,
  },
  {
    id: 210,
    title: "A1TT-28150a Microwave & RCD Test",
    customer: "AG Coombs Pty Ltd",
    assignedTo: [7],
    start: "2025-12-18T09:30",
    end: "2025-12-18T12:30",
    status: "active",
    color: "#e8ddff",
    location: "Mitch Cochrane Rd, Tullamarine VIC",
    notes: "RCD sequencing + appliance test combined session",
    estimatedTags: 65,
  },
  {
    id: 211,
    title: "A1TT-28388 Full Safety Audit",
    customer: "BigMart Retail",
    assignedTo: [4],
    start: "2025-12-20T08:00",
    end: "2025-12-20T16:00",
    status: "active",
    color: "#dff5f5",
    location: "22 Hume Hwy, Somerton VIC",
    notes: "Annual whole-site audit + new staff equipment",
    estimatedTags: 340,
  },
  {
    id: 212,
    title: "A1TT-28355 Tagging Session",
    customer: "Tech Hub Co",
    assignedTo: [],
    start: "2025-12-22T13:00",
    end: "2025-12-22T16:00",
    status: "quote",
    color: "#ffe6e6",
    location: "12 Startup Lane, Docklands VIC",
    notes: "Quoted job awaiting approval",
    estimatedTags: 45,
  },
  {
    id: 213,
    title: "A1TT-28771 PAT & RCD Test",
    customer: "Metro Rail Holdings",
    assignedTo: [8],
    start: "2025-12-23T07:30",
    end: "2025-12-23T15:00",
    status: "active",
    color: "#e4f4de",
    location: "Rail Depot, Footscray VIC",
    notes: "Track maintenance tools (approx 3 sheds)",
    estimatedTags: 280,
  },
  {
    id: 214,
    title: "A1TT-28890 Annual Test",
    customer: "Laser Clinic Australia",
    assignedTo: [9],
    start: "2025-12-10T09:00",
    end: "2025-12-10T12:00",
    status: "active",
    color: "#d8f5d2",
    location: "Level 2, 318 Collins St, Melbourne",
    notes: "Medical-grade equipment requires calibration stickers",
    estimatedTags: 95,
  },
];

/* Helpers */
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

/* ------------------------------------------------------ */
/* MAIN PAGE */
/* ------------------------------------------------------ */
const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeMode, setRangeMode] =
    useState<"day" | "week" | "month">("day");

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

  /* ------------------------------------------------------ */
  /* JOB MOVE (FULL DRAG & DROP LOGIC)                      */
  /* ------------------------------------------------------ */
  const handleJobMove = (
    jobId: number,
    employeeId: number,
    newStart: Date,
    newEnd: Date
  ) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          assignedTo: job.assignedTo.includes(employeeId)
            ? job.assignedTo
            : [employeeId],
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        };
      })
    );
  };

  /* ------------------------------------------------------ */
  /* ADD JOB (slot add button)                              */
  /* ------------------------------------------------------ */
  const handleAddJobAt = (
    employeeId: number,
    start: Date,
    end: Date
  ) => {
    const newJob: CalendarJob = {
      id: Date.now(),
      title: "New Job",
      customer: "New Customer",
      assignedTo: [employeeId],
      start: start.toISOString(),
      end: end.toISOString(),
      status: "active",
      color: "#faf7dc",
      notes: "",
      location: "",
      estimatedTags: 0,
    };
    setJobs((prev) => [...prev, newJob]);
  };

  /* JOB FILTER */
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobFilter === "all") return true;
      if (jobFilter === "unassigned") return job.assignedTo.length === 0;
      return job.status === jobFilter;
    });
  }, [jobFilter, jobs]);

  /* STAFF FILTER */
  const staffFilteredJobs = useMemo(() => {
    if (selectedStaff.length === 0) return filteredJobs;
    return filteredJobs.filter((job) =>
      job.assignedTo.some((id) => selectedStaff.includes(id))
    );
  }, [filteredJobs, selectedStaff]);

  /* MONTH JOBS */
  const jobsThisMonth = staffFilteredJobs.filter((j) => {
    const d = new Date(j.start);
    return (
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  });

  /* DAY VIEW MAPPING */
  const jobsByEmployee = useMemo(() => {
    const map: Record<number, CalendarJob[]> = {};
    employees.forEach((e) => (map[e.id] = []));
    staffFilteredJobs.forEach((job) => {
      job.assignedTo.forEach((empId) => map[empId].push(job));
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

  /* GROUP MONTH JOBS FOR MOBILE */
  const groupedMonthJobs = jobsThisMonth.reduce((acc, job) => {
    const day = new Date(job.start).getDate();
    if (!acc[day]) acc[day] = [];
    acc[day].push(job);
    return acc;
  }, {} as Record<number, CalendarJob[]>);

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
/>

        {/* ---------------- MONTH MODE ---------------- */}
        {rangeMode === "month" && (
          <>
            {/* MOBILE MONTH LIST */}
            <div className={styles.onlyMobile}>
              <MobileMonthList
                selectedDate={selectedDate}
                monthGroups={groupedMonthJobs}
                employees={employees}
                onJobClick={setOpenJobId}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={jobsThisMonth}
                  onJobClick={setOpenJobId}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>

            {/* DESKTOP MONTH VIEW */}
            <div className={styles.onlyDesktop}>
              <div className={styles.monthLayoutWide}>
                <MonthCalendarLayout
                  date={selectedDate}
                  jobs={jobsThisMonth}
                  employees={employees}
                  selectedStaff={selectedStaff}
                  onStaffChange={setSelectedStaff}
                  onJobClick={setOpenJobId}
                  onJobMove={handleJobMove}
                  onAddJobAt={handleAddJobAt}
                />

                <aside className={styles.sidebarWrapper}>
                  <SidebarJobs
                    jobs={jobsThisMonth}
                    onJobClick={setOpenJobId}
                    jobFilter={jobFilter}
                    onJobFilterChange={setJobFilter}
                  />
                </aside>
              </div>
            </div>
          </>
        )}

        {/* ---------------- WEEK MODE ---------------- */}
        {rangeMode === "week" && (
          <>
            {/* MOBILE WEEK LIST */}
            <div className={styles.onlyMobile}>
              <MobileWeekList
                jobs={staffFilteredJobs.filter((j) =>
                  isSameWeek(j.start, selectedDate)
                )}
                employees={employees}
                selectedDate={selectedDate}
                onJobClick={setOpenJobId}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={staffFilteredJobs.filter((j) =>
                    isSameWeek(j.start, selectedDate)
                  )}
                  onJobClick={setOpenJobId}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>

            {/* DESKTOP WEEK VIEW */}
            <div className={styles.onlyDesktop}>
              <div className={styles.desktopMainAndSidebar}>
                <div className={styles.timelineCardWrapper}>
                  <WeekCalendarLayout
                    date={selectedDate}
                    jobs={staffFilteredJobs.filter((j) =>
                      isSameWeek(j.start, selectedDate)
                    )}
                    employees={employees}
                    onJobClick={setOpenJobId}
                    onJobMove={handleJobMove}
                    onAddJobAt={handleAddJobAt}
                  />
                </div>

                <aside className={styles.sidebarWrapper}>
                  <SidebarJobs
                    jobs={staffFilteredJobs.filter((j) =>
                      isSameWeek(j.start, selectedDate)
                    )}
                    onJobClick={setOpenJobId}
                    jobFilter={jobFilter}
                    onJobFilterChange={setJobFilter}
                  />
                </aside>
              </div>
            </div>
          </>
        )}

        {/* ---------------- DAY MODE ---------------- */}
        {rangeMode === "day" && (
          <>
            {/* MOBILE DAY LIST */}
            <div className={styles.onlyMobile}>
              <MobileDayList
                jobs={staffFilteredJobs.filter((j) =>
                  isSameDay(j.start, selectedDate)
                )}
                employees={employees}
                selectedDate={selectedDate}
                onJobClick={setOpenJobId}
              />

              <aside className={styles.sidebarWrapper}>
                <SidebarJobs
                  jobs={staffFilteredJobs.filter((j) =>
                    isSameDay(j.start, selectedDate)
                  )}
                  onJobClick={setOpenJobId}
                  jobFilter={jobFilter}
                  onJobFilterChange={setJobFilter}
                />
              </aside>
            </div>

            {/* DESKTOP DAY VIEW */}
            <div className={styles.onlyDesktop}>
              <div className={styles.desktopMainAndSidebar}>
                <div className={styles.timelineCardWrapper}>
                  <DesktopCalendarLayout
                    date={selectedDate}
                    employees={employees}
                    jobs={staffFilteredJobs.filter(j => isSameDay(j.start, selectedDate))}
                    onJobClick={setOpenJobId}
                    onAddJobAt={handleAddJobAt}
                    onMoveJob={handleJobMove}
                  />
                </div>

                <aside className={styles.sidebarWrapper}>
                  <SidebarJobs
                    jobs={staffFilteredJobs.filter((j) =>
                      isSameDay(j.start, selectedDate)
                    )}
                    onJobClick={setOpenJobId}
                    jobFilter={jobFilter}
                    onJobFilterChange={setJobFilter}
                  />
                </aside>
              </div>
            </div>
          </>
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
