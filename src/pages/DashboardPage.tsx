import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import StatusBoardChart from "../components/StatusBoardChart";
import PaymentsPieChart from "../components/PaymentsPieChart";
import JobsOverTimeChart from "../components/JobsOverTimeChart";
import AddTask from "../components/AddTask";
import NewJobModal from "../components/NewJobModal";
import DashboardNavbar from "../components/DashboardNavbar";
import AssigneeFilterBar from "../components/AssigneeFilterBar";
import TaskAssigneeFilterBar from "../components/TaskAssigneeFilterBar";
import ConfirmModal from "../components/ConfirmModal";

import styles from "./DashboardPage.module.css";
import {
  Briefcase,
  UserPlus,
  FileText,
  PencilLine,
  XCircle,
} from "phosphor-react";
import { TrashIcon } from "@heroicons/react/24/outline";

import {
  createTask,
  deleteTask,
  completeTask,
  deleteAllCompletedTasks,
  getTasks,
  Task,
} from "../services/tasks";

import { apiGet, apiPost } from "../services/api";

/* ───────── Types ───────── */

export type CustomerType = { id: number; name: string };

export type DashboardPageProps = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  customers: CustomerType[];
  onAddCustomer: (customer: Omit<CustomerType, "id">) => void;
};

type EmployeeType = {
  id: number;
  name: string;
  avatar?: string;
};

type JobType = {
  id: string;
  title: string;
  jobType: "CHARGE UP" | "ESTIMATE";
  status: "Pending" | "Active" | "Complete";
  customer: string;
  date: string;
  assignedEmployeeIds: number[];
  scheduledEmployeeIds?: number[];
};

/* ───────── Small UI bits ───────── */

const BeeIcon: React.FC = () => (
  <span className={styles.beeIcon} role="img" aria-label="bee">
    🐝
  </span>
);

const ChevronUp: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    className={className}
    aria-hidden="true"
  >
    <polyline
      points="5,13 10,7 15,13"
      fill="none"
      stroke="#b39c49"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    className={className}
    aria-hidden="true"
  >
    <polyline
      points="5,7 10,13 15,7"
      fill="none"
      stroke="#b39c49"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ───────── Helpers ───────── */

const toDDMMYYYY = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const safeDate = (v: any): Date => {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Tasks date formatting
const formatTaskDue = (due: string) => {
  if (!due) return "—";
  try {
    return toDDMMYYYY(safeDate(due));
  } catch {
    return due;
  }
};

/* initials helper (AF, JD, etc) */
const initialsFromName = (name?: string) => {
  const cleaned = String(name ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned) return "?";
  const parts = cleaned.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const out = (first + last).toUpperCase();
  return out || "?";
};

const uniqIntList = (arr: any): number[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const v of arr) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
};

/* ───────── Component ───────── */

const DashboardPage: React.FC<DashboardPageProps> = ({
  search,
  setSearch,
  customers,
  onAddCustomer,
}) => {
  // Employees (Postgres)
  const [employees, setEmployees] = useState<EmployeeType[]>([]);

  // Jobs (Postgres)
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Tasks (Postgres)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openTasks, setOpenTasks] = useState<{ [id: string]: boolean }>({});

  // UI state
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [taskTab, setTaskTab] = useState<"upcoming" | "overdue">("upcoming");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);

  // Filters
  const [selectedAssignee, setSelectedAssignee] = useState<number | "all">(
    "all",
  );
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<number | "all">(
    "all",
  );

  // ✅ NEW: Job list filters (dashboard section)

  const [jobTypeFilter, setJobTypeFilter] = useState<
    "" | "CHARGE UP" | "ESTIMATE"
  >("");
  const [jobStatusFilter, setJobStatusFilter] = useState<
    "" | "Pending" | "Active" | "Complete"
  >("");

  const [openHeaderMenu, setOpenHeaderMenu] = useState<
    null | "jobType" | "status"
  >(null);

  const navigate = useNavigate();

  /* ───────── Loaders ───────── */
  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // anything inside our header menu should not close
      if (target.closest(`.${styles.thMenuWrap}`)) return;

      setOpenHeaderMenu(null);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);
  const loadEmployees = async () => {
    // expects GET /api/employees -> [{id, name, avatar?}]
    const list = await apiGet<EmployeeType[]>("/employees");
    setEmployees(Array.isArray(list) ? list : []);
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      // expects GET /api/jobs -> [{ id, title, jobType, status, customer, date, assignedEmployeeIds, scheduledEmployeeIds }]
      const list = await apiGet<any[]>("/jobs");

      const mapped: JobType[] = (Array.isArray(list) ? list : []).map((j) => {
        const jobTypeRaw = String(j.jobType ?? "").toUpperCase();
        const jobType: JobType["jobType"] =
          jobTypeRaw === "ESTIMATE" ? "ESTIMATE" : "CHARGE UP";

        const statusRaw = String(j.status ?? "Pending");
        const status: JobType["status"] =
          statusRaw === "Active" ||
          statusRaw === "Complete" ||
          statusRaw === "Pending"
            ? statusRaw
            : "Pending";

        // date can be ISO or already dd/mm/yyyy
        const date =
          typeof j.date === "string" && j.date.includes("/")
            ? j.date
            : toDDMMYYYY(safeDate(j.date ?? j.start ?? j.createdAt));

        const assignedEmployeeIds = uniqIntList(j.assignedEmployeeIds);
        const scheduledEmployeeIds = uniqIntList(j.scheduledEmployeeIds);

        return {
          id: String(j.id),
          title: String(j.title ?? "Untitled"),
          jobType,
          status,
          customer: String(
            j.client ??
              j.customer ??
              j.customer_name ??
              j.customerName ??
              "Unknown",
          ),
          date,
          assignedEmployeeIds,
          scheduledEmployeeIds,
        };
      });

      setJobs(mapped);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadTasks = async () => {
    const list = await getTasks();
    setTasks(Array.isArray(list) ? list : []);
  };

  const loadAll = async () => {
    await Promise.all([loadEmployees(), loadJobs(), loadTasks()]);
  };

  useEffect(() => {
    loadAll().catch((e) => console.error("Dashboard loadAll error:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────── Job create ───────── */

  const handleAddJob = async (job: {
    title: string;
    jobType: "CHARGE UP" | "ESTIMATE";
    customer: string;
  }) => {
    try {
      // expects POST /api/jobs
      // backend should set createdAt + default status
      await apiPost("/jobs", {
        title: job.title,
        jobType: job.jobType === "ESTIMATE" ? "ESTIMATE" : "CHARGE_UP",
        customer: job.customer,
        status: "Pending",
      });

      setShowNewJobModal(false);
      await loadJobs();
    } catch (err) {
      console.error("add job error:", err);
    }
  };

  /* ───────── Jobs filtering + chart data ───────── */

  // pick "who counts as assigned" for filtering + UI:
  // prefer scheduledEmployeeIds (calendar), fallback to assignedEmployeeIds (watchers/manual)
  const jobPrimaryAssignees = (job: JobType): number[] => {
    const scheduled = uniqIntList(job.scheduledEmployeeIds);
    if (scheduled.length > 0) return scheduled;
    return uniqIntList(job.assignedEmployeeIds);
  };

  const visibleJobs = useMemo(() => {
    const q = search.toLowerCase().trim();

    return jobs.filter((job) => {
      const matchesSearch =
        q.length === 0 ||
        job.title.toLowerCase().includes(q) ||
        job.customer.toLowerCase().includes(q);

      const who = jobPrimaryAssignees(job);
      const matchesAssignee =
        selectedAssignee === "all" || who.includes(selectedAssignee);

      const matchesStatus =
        jobStatusFilter === "" || job.status === jobStatusFilter;

      const matchesType = jobTypeFilter === "" || job.jobType === jobTypeFilter;

      return matchesSearch && matchesAssignee && matchesStatus && matchesType;
    });
  }, [jobs, search, selectedAssignee, jobStatusFilter, jobTypeFilter]);

  const statusBuckets = ["Pending", "Active", "Complete"] as const;

  const statusBoardData = useMemo(() => {
    return statusBuckets.map((statusName) => {
      const jobsInThisStatus = visibleJobs.filter(
        (j) => j.status === statusName,
      );
      return { name: statusName, jobs: jobsInThisStatus.length, value: 0 };
    });
  }, [visibleJobs]);

  /* ───────── Task logic ───────── */

  const taskMatchesAssignee = (task: Task, assignee: number | "all") => {
    if (assignee === "all") return true;
    return task.assigned.includes(assignee);
  };

  const today = new Date().toISOString().slice(0, 10);

  const overdueTasksRaw = tasks.filter(
    (t) => t.status === "pending" && t.due < today,
  );
  const upcomingTasksRaw = tasks.filter(
    (t) => t.status === "pending" && t.due >= today,
  );
  const completedTasksRaw = tasks.filter((t) => t.status === "completed");

  const overdueTasks = overdueTasksRaw.filter((t) =>
    taskMatchesAssignee(t, taskAssigneeFilter),
  );
  const upcomingTasks = upcomingTasksRaw.filter((t) =>
    taskMatchesAssignee(t, taskAssigneeFilter),
  );
  const completedTasks = completedTasksRaw.filter((t) =>
    taskMatchesAssignee(t, taskAssigneeFilter),
  );

  const visibleOpenTasksForSmallCard = tasks.filter(
    (t) => t.status === "pending" && taskMatchesAssignee(t, taskAssigneeFilter),
  );

  const handleSaveTask = async (task: {
    description: string;
    assigned: number[];
    due: string;
  }) => {
    try {
      await createTask({
        description: task.description,
        assigned: task.assigned,
        due: task.due,
      });

      setShowAddTask(false);
      await loadTasks();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const currentEmployeeId = employees[0]?.id ?? 0;

  const handleCompleteTask = async (taskId: string) => {
    // optimistic UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "completed" } : t)),
    );

    try {
      await completeTask(taskId);
    } catch (err) {
      console.error("Failed to complete task:", err);

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "pending" } : t)),
      );
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      setTasks((prev) => prev.filter((t) => Number(t.id) !== id));

      try {
        await deleteTask(String(id));
      } catch (err) {
        console.error("Failed to delete task:", err);
        loadTasks();
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  /* ───────── Job filter clear ───────── */

  const hasAnyJobFilter =
    search.trim().length > 0 ||
    selectedAssignee !== "all" ||
    jobStatusFilter !== "" ||
    jobTypeFilter !== "";

  const handleClearJobFilters = () => {
    setSearch("");
    setSelectedAssignee("all");
    setJobStatusFilter("");
    setJobTypeFilter("");
    setOpenHeaderMenu(null);
  };

  /* ───────── Render helpers ───────── */

  const renderTaskCard = (task: Task, showButtons = false) => {
    const open = openTasks[task.id] || false;

    const handleToggle = () =>
      setOpenTasks((prev) => ({ ...prev, [task.id]: !open }));

    const assignedNames = task.assigned
      .map((empId) => employees.find((e) => e.id === empId)?.name || "Unknown")
      .join(", ");

    const isCompleted = task.status === "completed";

    return (
      <div
        key={task.id}
        className={`${styles.taskCardLi} ${isCompleted ? styles.completed : ""}`}
      >
        <div className={styles.taskTitleRow}>
          <BeeIcon />
          <span>{task.description}</span>

          {showButtons && !isCompleted && (
            <button
              className={styles.toggleBtn}
              onClick={handleToggle}
              type="button"
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </button>
          )}
        </div>

        <div className={styles.taskDetailRow}>
          <span className={styles.taskLabel}>Assigned:</span>
          <span>{assignedNames}</span>
        </div>

        <div className={styles.taskDetailRow}>
          <span className={styles.taskLabel}>Due:</span>
          <span>{formatTaskDue(task.due)}</span>
        </div>

        {showButtons && !isCompleted && open && (
          <div className={styles.taskBtnRow}>
            <button
              className={styles.taskDoneBtn}
              onClick={() => handleCompleteTask(task.id)}
              type="button"
            >
              ✓
            </button>
            <button
              className={styles.taskDeleteBtn}
              onClick={() => handleDeleteTask(Number(task.id))}
              type="button"
            >
              ✗
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAssigneeAvatars = (job: JobType) => {
    const ids = jobPrimaryAssignees(job);

    if (!ids || ids.length === 0) {
      return <span className={styles.assigneeEmpty}>—</span>;
    }

    // Map to employees we know (filter out missing)
    const people = ids
      .map((id) => employees.find((e) => e.id === id))
      .filter(Boolean) as EmployeeType[];

    if (people.length === 0) {
      return <span className={styles.assigneeEmpty}>—</span>;
    }

    // Show first N with +X
    const MAX = 4;
    const shown = people.slice(0, MAX);
    const extra = people.length - shown.length;

    return (
      <div
        className={styles.assigneeStack}
        title={people.map((p) => p.name).join(", ")}
      >
        {shown.map((p) => (
          <div
            key={p.id}
            className={styles.assigneeBubble}
            title={p.name}
            aria-label={p.name}
          >
            {p.avatar ? (
              <img
                src={p.avatar}
                alt={p.name}
                className={styles.assigneeAvatarImg}
              />
            ) : (
              <span className={styles.assigneeInitials}>
                {initialsFromName(p.name)}
              </span>
            )}
          </div>
        ))}

        {extra > 0 && (
          <div className={styles.assigneeMore} title={`${extra} more`}>
            +{extra}
          </div>
        )}
      </div>
    );
  };

  /* ───────── JSX ───────── */

  return (
    <div className={styles.dashboardShell}>
      <div className={styles.dashboardBg}>
        <DashboardNavbar onNewJob={() => setShowNewJobModal(true)} />

        <div className={styles.chartsSection}>
          <AssigneeFilterBar
            employees={employees}
            selectedAssignee={selectedAssignee}
            onChange={setSelectedAssignee}
          />

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <StatusBoardChart data={statusBoardData} />
            </div>
            <div className={styles.chartCard}>
              <PaymentsPieChart data={visibleJobs as any} />
            </div>
            <div className={styles.chartCard}>
              <JobsOverTimeChart data={visibleJobs as any} />
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.tableCardModern}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderLeft}>
                <div className={styles.tableHeaderTopRow}>
                  <h3 className={styles.tableTitle}>Job List</h3>

                  <div className={styles.tableHeaderRightTools}>
                    <div className={styles.jobToolbar}>
                      <div className={styles.jobSearch}>
                        <svg
                          className={styles.jobSearchIcon}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>

                        <input
                          className={styles.jobSearchInput}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search jobs or customers..."
                        />
                      </div>

                      <div className={styles.jobToolbarDivider} />

                      <button
                        type="button"
                        className={styles.jobClearBtn}
                        onClick={handleClearJobFilters}
                        disabled={!hasAnyJobFilter}
                        title="Clear job filters"
                      >
                        <TrashIcon className={styles.jobClearIcon} />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.tableHeaderMetaRow}>
                  <div className={styles.tableSubtitle}>
                    <span className={styles.tablePill}>
                      {jobsLoading ? "Loading…" : `${visibleJobs.length} jobs`}
                    </span>

                    <span className={styles.tableHint}>
                      Track progress, assignments, and next actions at a glance
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ Removed header buttons (no duplicate New Job button here) */}
              <div className={styles.tableHeaderRight} />
            </div>

            <div className={styles.tableTopDivider} />

            <div className={styles.tableScrollWrap}>
              <table className={styles.jobsTableModern}>
                <thead>
                  <tr>
                    {/* ✅ Job Type dropdown */}
                    <th className={styles.thMenuWrap}>
                      <button
                        type="button"
                        className={styles.thMenuBtn}
                        onClick={() =>
                          setOpenHeaderMenu((p) =>
                            p === "jobType" ? null : "jobType",
                          )
                        }
                        aria-label="Filter by Job Type"
                      >
                        <span>Job Type</span>
                        {openHeaderMenu === "jobType" ? (
                          <ChevronUp className={styles.thChevronIcon} />
                        ) : (
                          <ChevronDown className={styles.thChevronIcon} />
                        )}
                      </button>

                      {openHeaderMenu === "jobType" && (
                        <div className={styles.thMenu} role="menu">
                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobTypeFilter("");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            All
                          </button>

                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobTypeFilter("CHARGE UP");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            Charge Up
                          </button>

                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobTypeFilter("ESTIMATE");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            Estimate
                          </button>
                        </div>
                      )}

                      {jobTypeFilter && (
                        <div className={styles.thActiveFilter}>
                          {jobTypeFilter}
                        </div>
                      )}
                    </th>

                    {/* ✅ Status dropdown */}
                    <th className={styles.thMenuWrap}>
                      <button
                        type="button"
                        className={styles.thMenuBtn}
                        onClick={() =>
                          setOpenHeaderMenu((p) =>
                            p === "status" ? null : "status",
                          )
                        }
                        aria-label="Filter by Status"
                      >
                        <span>Status</span>
                        {openHeaderMenu === "status" ? (
                          <ChevronUp className={styles.thChevronIcon} />
                        ) : (
                          <ChevronDown className={styles.thChevronIcon} />
                        )}
                      </button>

                      {openHeaderMenu === "status" && (
                        <div className={styles.thMenu} role="menu">
                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobStatusFilter("");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            All
                          </button>

                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobStatusFilter("Pending");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            Pending
                          </button>

                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobStatusFilter("Active");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            Active
                          </button>

                          <button
                            type="button"
                            className={styles.thMenuItem}
                            onClick={() => {
                              setJobStatusFilter("Complete");
                              setOpenHeaderMenu(null);
                            }}
                          >
                            Complete
                          </button>
                        </div>
                      )}

                      {jobStatusFilter && (
                        <div className={styles.thActiveFilter}>
                          {jobStatusFilter}
                        </div>
                      )}
                    </th>

                    <th>Job</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Assigned</th>
                    <th className={styles.actionsCol}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {jobsLoading ? (
                    <tr>
                      <td colSpan={7} className={styles.tableStateCell}>
                        <div className={styles.tableState}>
                          <div className={styles.skeletonLineLg} />
                          <div className={styles.skeletonLineSm} />
                        </div>
                      </td>
                    </tr>
                  ) : visibleJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.tableStateCell}>
                        <div className={styles.tableEmpty}>
                          <div className={styles.tableEmptyIcon}>🐝</div>
                          <div className={styles.tableEmptyTitle}>
                            No jobs found
                          </div>
                          <div className={styles.tableEmptyText}>
                            Try adjusting search or filters, or create a new
                            job.
                          </div>

                          {/* ✅ Use Honeycomb button style here too */}
                          <button
                            type="button"
                            className={`${styles.detailsBtn} ${styles.detailsBtnSm}`}
                            onClick={() => setShowNewJobModal(true)}
                          >
                            <span className={styles.qaIcon}>
                              <Briefcase size={18} weight="bold" />
                            </span>
                            <span>Create Job</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleJobs.map((job) => {
                      const jobTypeChip =
                        job.jobType === "CHARGE UP" ? (
                          <span className={styles.jobTypeChipModern}>
                            <FileText
                              size={12}
                              weight="regular"
                              className={styles.jobTypeChipIconModern}
                            />
                            Charge Up
                          </span>
                        ) : (
                          <span className={styles.jobTypeChipModern}>
                            <PencilLine
                              size={12}
                              weight="regular"
                              className={styles.jobTypeChipIconModern}
                            />
                            Estimate
                          </span>
                        );

                      return (
                        <tr key={job.id} className={styles.jobRow}>
                          <td>{jobTypeChip}</td>

                          <td>
                            <span
                              className={
                                job.status === "Active"
                                  ? styles.statusActive
                                  : job.status === "Complete"
                                    ? styles.statusComplete
                                    : styles.statusPending
                              }
                            >
                              {job.status}
                            </span>
                          </td>

                          <td>
                            <div className={styles.jobMainCell}>
                              <div className={styles.jobTitle}>{job.title}</div>
                              <div className={styles.jobSubtle}>#{job.id}</div>
                            </div>
                          </td>

                          <td>
                            <div className={styles.customerCell}>
                              {job.customer}
                            </div>
                          </td>

                          <td>
                            <div className={styles.dateCell}>{job.date}</div>
                          </td>

                          <td>{renderAssigneeAvatars(job)}</td>

                          <td className={styles.actionsCol}>
                            <button
                              className={styles.viewBtnModern}
                              type="button"
                              onClick={() =>
                                navigate(`/dashboard/jobs/${job.id}`)
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.sideColumn}>
            <div className={styles.quickActionsCard}>
              <div className={styles.quickTitle}>Quick Actions</div>

              <button
                className={styles.detailsBtn}
                type="button"
                onClick={() => setShowNewJobModal(true)}
              >
                <span className={styles.qaIcon}>
                  <Briefcase size={18} weight="bold" />
                </span>
                <span>New Job</span>
              </button>

              <button className={styles.detailsBtn} type="button">
                <span className={styles.qaIcon}>
                  <UserPlus size={18} weight="bold" />
                </span>
                <span>Add Customer</span>
              </button>

              <button className={styles.detailsBtn} type="button">
                <span className={styles.qaIcon}>
                  <FileText size={18} weight="bold" />
                </span>
                <span>Create Invoice</span>
              </button>

              <button className={styles.detailsBtn} type="button">
                <span className={styles.qaIcon}>
                  <PencilLine size={18} weight="bold" />
                </span>
                <span>Create Quote</span>
              </button>
            </div>

            <div className={styles.tasksCard}>
              <div className={styles.tasksHeaderRow}>
                <h4 className={styles.tasksTitle}>Tasks</h4>
              </div>

              <TaskAssigneeFilterBar
                employees={employees}
                value={taskAssigneeFilter}
                onChange={setTaskAssigneeFilter}
              />

              <button
                className={styles.addTaskBtn}
                type="button"
                onClick={() => setShowAddTask(true)}
              >
                + Add Task
              </button>

              <div className={styles.tasksList}>
                {visibleOpenTasksForSmallCard.length === 0 ? (
                  <div className={styles.emptyState}>
                    <BeeIcon />
                    <div className={styles.emptyTitle}>There are no tasks</div>
                    <div className={styles.emptyText}>
                      Add more tasks to be on top of your work every day.
                    </div>
                  </div>
                ) : (
                  <div className={styles.taskListUl}>
                    {visibleOpenTasksForSmallCard.map((task) =>
                      renderTaskCard(task, true),
                    )}
                  </div>
                )}
              </div>

              <button
                className={styles.viewAllBtn}
                type="button"
                onClick={() => setShowTaskPanel(true)}
              >
                View All
              </button>
            </div>
          </div>
        </div>

        {showAddTask && (
          <AddTask
            employees={employees}
            onSave={handleSaveTask}
            onClose={() => setShowAddTask(false)}
          />
        )}

        {showTaskPanel && (
          <div className={styles.taskPanelOverlay}>
            <div className={styles.taskPanel} role="dialog" aria-modal="true">
              <div className={styles.taskPanelHeader}>
                <span className={styles.tasksTitle}>Tasks</span>
                <button
                  className={styles.closeBtn}
                  type="button"
                  onClick={() => setShowTaskPanel(false)}
                  aria-label="Close task panel"
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "16px 26px 0 26px" }}>
                <TaskAssigneeFilterBar
                  employees={employees}
                  value={taskAssigneeFilter}
                  onChange={setTaskAssigneeFilter}
                />
              </div>

              <div className={styles.taskPanelFilterRow}>
                <button
                  className={
                    showCompleted
                      ? styles.showCompletedBtnActive
                      : styles.showCompletedBtn
                  }
                  type="button"
                  onClick={() => setShowCompleted((sc) => !sc)}
                >
                  Show completed tasks
                </button>
              </div>

              {showCompleted && completedTasks.length > 0 && (
                <div className={styles.completedActionsRow}>
                  <button
                    className={styles.cleanCompletedBtn}
                    type="button"
                    onClick={() => setShowCleanConfirm(true)}
                  >
                    <TrashIcon className={styles.cleanIcon} />
                    <span>Clean completed ({completedTasks.length})</span>
                  </button>
                </div>
              )}

              {!showCompleted && (
                <div className={styles.taskPanelTabsRow}>
                  <button
                    className={
                      taskTab === "upcoming"
                        ? styles.tabBtnActive
                        : styles.tabBtn
                    }
                    type="button"
                    onClick={() => setTaskTab("upcoming")}
                  >
                    Upcoming ({upcomingTasks.length})
                  </button>

                  <button
                    className={
                      taskTab === "overdue"
                        ? styles.tabBtnActive
                        : styles.tabBtn
                    }
                    type="button"
                    onClick={() => setTaskTab("overdue")}
                  >
                    Overdue ({overdueTasks.length})
                  </button>
                </div>
              )}

              <div className={styles.taskPanelList}>
                {showCompleted ? (
                  completedTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                      <BeeIcon />
                      <div className={styles.emptyTitle}>
                        No completed tasks
                      </div>
                    </div>
                  ) : (
                    completedTasks.map((task) => renderTaskCard(task, false))
                  )
                ) : (taskTab === "upcoming" ? upcomingTasks : overdueTasks)
                    .length === 0 ? (
                  <div className={styles.emptyState}>
                    <BeeIcon />
                    <div className={styles.emptyTitle}>There are no tasks</div>
                    <div className={styles.emptyText}>
                      {taskTab === "upcoming"
                        ? "Add more tasks to be on top of your work every day."
                        : "No overdue tasks! Keep up the good work."}
                    </div>
                  </div>
                ) : (
                  (taskTab === "upcoming" ? upcomingTasks : overdueTasks).map(
                    (task) => renderTaskCard(task, true),
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <NewJobModal
          show={showNewJobModal}
          onClose={() => setShowNewJobModal(false)}
          onSubmit={handleAddJob as any}
          customersList={customers}
          onAddCustomer={onAddCustomer}
        />

        {showCleanConfirm && (
          <ConfirmModal
            title="Clean completed tasks?"
            description={
              <>
                This will permanently delete all completed tasks.
                <br />
                This action cannot be undone.
              </>
            }
            confirmText="Clean tasks"
            onCancel={() => setShowCleanConfirm(false)}
            onConfirm={async () => {
              await deleteAllCompletedTasks();
              setShowCleanConfirm(false);
              await loadTasks();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
