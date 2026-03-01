import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AddTask from "../components/AddTask";
import NewJobModal from "../components/NewJobModal";
import AddCustomerModal from "../components/AddCustomerModal";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import AssigneeFilterBar from "../components/AssigneeFilterBar";
import TaskAssigneeFilterBar from "../components/TaskAssigneeFilterBar";
import ConfirmModal from "../components/ConfirmModal";

import styles from "./DashboardPage.module.css";
import taskStyles from "./DashboardTasksCard.module.css";
import {
  Briefcase,
  CalendarBlank,
  CheckCircle,
  Clock,
  CurrencyDollar,
  FileText,
  PencilLine,
  TrendUp,
  UserPlus,
  Wrench,
  Receipt,
  XCircle,
} from "phosphor-react";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  GAUGE_COLORS,
  getStatusColor,
  isQuoteExpired,
} from "../types/GaugeData";
import {
  JobPhase,
  JobStatus,
  getPhaseFromRawStatus,
  getStatusLabel,
} from "../types/JobLifecycle";

import {
  createTask,
  deleteTask,
  completeTask,
  deleteAllCompletedTasks,
  getTasks,
  Task,
} from "../services/tasks";

import { apiGet, apiPost, logout } from "../services/api";
import { useCompany } from "../context/CompanyContext";

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

// Helper to convert lowercase status string to JobStatus enum
const stringToJobStatus = (rawStatus: string): JobStatus => {
  const s = String(rawStatus || "")
    .trim()
    .toLowerCase();

  // PENDING phase statuses
  if (s === "draft") return JobStatus.DRAFT;
  if (s === "new" || s === "start") return JobStatus.NEW;
  if (s === "needs_quote" || s === "needs quote" || s === "pending")
    return JobStatus.NEEDS_QUOTE;

  // QUOTING phase statuses
  // Legacy: "pricing", "quoting", "quote", "estimate" → QUOTE_PREPARING
  if (s === "pricing" || s === "quoting" || s === "quote" || s === "estimate")
    return JobStatus.QUOTE_PREPARING;
  if (s === "quote_preparing" || s === "quote preparing")
    return JobStatus.QUOTE_PREPARING;
  if (s === "quote_sent" || s === "quote sent" || s === "quotesent")
    return JobStatus.QUOTE_SENT;
  if (s === "quote_viewed" || s === "quote viewed")
    return JobStatus.QUOTE_VIEWED;
  if (s === "quote_accepted" || s === "quote accepted" || s === "quoteaccepted")
    return JobStatus.QUOTE_ACCEPTED;
  if (s === "quote_declined" || s === "quote declined")
    return JobStatus.QUOTE_DECLINED;

  // SCHEDULED phase statuses
  // Legacy: "scheduling", "schedule" → SCHEDULED
  if (s === "scheduled" || s === "scheduling" || s === "schedule")
    return JobStatus.SCHEDULED;
  if (s === "assigned") return JobStatus.ASSIGNED;

  // IN_PROGRESS phase statuses
  // Legacy: "active" → IN_PROGRESS
  if (
    s === "in_progress" ||
    s === "in progress" ||
    s === "inprogress" ||
    s === "active"
  )
    return JobStatus.IN_PROGRESS;
  if (s === "on_site" || s === "on site") return JobStatus.ON_SITE;
  if (s === "working") return JobStatus.WORKING;
  if (s === "waiting_parts" || s === "waiting parts")
    return JobStatus.WAITING_PARTS;

  // COMPLETED phase statuses
  // Legacy: "complete", "back_costing", "back costing", "need to return" → COMPLETED
  if (
    s === "completed" ||
    s === "complete" ||
    s === "back_costing" ||
    s === "back costing" ||
    s === "need to return"
  )
    return JobStatus.COMPLETED;
  if (s === "ready_to_invoice" || s === "ready to invoice")
    return JobStatus.READY_TO_INVOICE;

  // INVOICING phase statuses
  // Legacy: "invoice", "invoicing", "invoiced" → INVOICE_SENT
  if (
    s === "invoice" ||
    s === "invoicing" ||
    s === "invoiced" ||
    s === "invoice_sent" ||
    s === "invoice sent"
  )
    return JobStatus.INVOICE_SENT;
  if (s === "invoice_draft" || s === "invoice draft")
    return JobStatus.INVOICE_DRAFT;
  if (s === "awaiting_payment" || s === "awaiting payment")
    return JobStatus.AWAITING_PAYMENT;

  // PAID phase statuses
  // Legacy: "payment" → PAID
  if (s === "paid" || s === "payment") return JobStatus.PAID;
  if (s === "partially_paid" || s === "partially paid")
    return JobStatus.PARTIALLY_PAID;
  if (s === "overdue") return JobStatus.OVERDUE;

  // Default to NEEDS_QUOTE for unknown statuses (better than DRAFT)
  return JobStatus.NEEDS_QUOTE;
};

// Helper to normalize status string to phase key
const normalizePhaseFromStatus = (rawStatus: string): string => {
  return getPhaseFromRawStatus(rawStatus);
};

// The 7 Flowody job phases
export const JOB_PHASES = [
  {
    key: JobPhase.PENDING,
    label: "Pending",
    color: GAUGE_COLORS[JobPhase.PENDING],
  },
  {
    key: JobPhase.QUOTING,
    label: "Quoting",
    color: GAUGE_COLORS[JobPhase.QUOTING],
  },
  {
    key: JobPhase.SCHEDULED,
    label: "Scheduled",
    color: GAUGE_COLORS[JobPhase.SCHEDULED],
  },
  {
    key: JobPhase.IN_PROGRESS,
    label: "In Progress",
    color: GAUGE_COLORS[JobPhase.IN_PROGRESS],
  },
  {
    key: JobPhase.COMPLETED,
    label: "Completed",
    color: GAUGE_COLORS[JobPhase.COMPLETED],
  },
  {
    key: JobPhase.INVOICING,
    label: "Invoicing",
    color: GAUGE_COLORS[JobPhase.INVOICING],
  },
  { key: JobPhase.PAID, label: "Paid", color: GAUGE_COLORS[JobPhase.PAID] },
] as const;

export type JobPhaseKey = (typeof JOB_PHASES)[number]["key"];

// Returns the display label + pastel color for any raw DB phase/status string
export const getPhaseInfo = (rawStatus: string) => {
  const s = String(rawStatus || "")
    .trim()
    .toLowerCase();
  return (
    JOB_PHASES.find((p) => p.key === s) ?? JOB_PHASES[0] // default to "Pending"
  );
};

type JobType = {
  id: string;
  title: string;
  jobType: "CHARGE UP" | "ESTIMATE";
  status: string; // raw DB phase key (e.g. "new", "quote", "in_progress")
  customer: string;
  date: string;
  assignedEmployeeIds: number[];
  scheduledEmployeeIds?: number[];
};

/* ───────── Small UI bits ───────── */

const BeeIcon: React.FC = () => (
  <img className={taskStyles.beeIcon} src="/leaf-fall.png" alt="Leaf icon" />
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
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
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
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("");
  const [gaugeTimePeriod, setGaugeTimePeriod] = useState<
    "today" | "week" | "month"
  >("month");

  const [openHeaderMenu, setOpenHeaderMenu] = useState<
    null | "jobType" | "status"
  >(null);

  const navigate = useNavigate();

  const handleSaveCustomerFromModal = (customer: any) => {
    const name = String(customer?.company ?? "").trim();
    if (!name) return;
    onAddCustomer({ name });
  };

  /* ───────── Multi-tenant: Get current company context ───────── */
  const { companyId } = useCompany();

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

        // Use the raw DB status string directly — normalizeStage handles bucketing
        const status = String(j.status ?? "new")
          .trim()
          .toLowerCase();

        // date can be ISO or already dd/mm/yyyy
        const date = toDDMMYYYY(safeDate(j.created_at_iso ?? j.created_at));

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
    // ✅ FIXED: Now refetches when company changes
  }, [companyId]);

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
        status: "new",
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
        jobStatusFilter === "" || job.status === jobStatusFilter.toLowerCase();

      const matchesType = jobTypeFilter === "" || job.jobType === jobTypeFilter;

      return matchesSearch && matchesAssignee && matchesStatus && matchesType;
    });
  }, [jobs, search, selectedAssignee, jobStatusFilter, jobTypeFilter]);

  /* ───────── Gauge time-period filter ───────── */
  const gaugeFilteredJobs = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const todayISO = now.toISOString().slice(0, 10);

    // Week: Monday of the current week
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon…6=Sun
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);

    // Month: 1st of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const parseDDMMYYYY = (s: string): Date | null => {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
      if (!m) return null;
      return new Date(+m[3], +m[2] - 1, +m[1]);
    };

    return visibleJobs.filter((job) => {
      const d = parseDDMMYYYY(job.date);
      if (!d) return true; // can't parse → include
      if (gaugeTimePeriod === "today")
        return d.toISOString().slice(0, 10) === todayISO;
      if (gaugeTimePeriod === "week") return d >= weekStart;
      return d >= monthStart; // "month"
    });
  }, [visibleJobs, gaugeTimePeriod]);

  const statusGaugeData = useMemo(() => {
    const buckets: Record<string, number> = {
      [JobPhase.PENDING]: 0,
      [JobPhase.QUOTING]: 0,
      [JobPhase.SCHEDULED]: 0,
      [JobPhase.IN_PROGRESS]: 0,
      [JobPhase.COMPLETED]: 0,
      [JobPhase.INVOICING]: 0,
      [JobPhase.PAID]: 0,
    };

    for (const job of gaugeFilteredJobs) {
      const stage = normalizePhaseFromStatus(job.status);
      if (stage in buckets) buckets[stage] += 1;
    }

    return JOB_PHASES.map((phase) => ({
      key: phase.key,
      label: phase.label,
      value: buckets[phase.key] ?? 0,
      color: phase.color,
    }));
  }, [gaugeFilteredJobs]);

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
        className={`${taskStyles.taskCardLi} ${
          isCompleted ? taskStyles.completed : ""
        }`}
      >
        <div className={taskStyles.taskTitleRow}>
          <span>{task.description}</span>

          {showButtons && !isCompleted && (
            <button
              className={taskStyles.toggleBtn}
              onClick={handleToggle}
              type="button"
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </button>
          )}
        </div>

        <div className={taskStyles.taskDetailRow}>
          <span className={taskStyles.taskLabel}>Assigned:</span>
          <span>{assignedNames}</span>
        </div>

        <div className={taskStyles.taskDetailRow}>
          <span className={taskStyles.taskLabel}>Due:</span>
          <span>{formatTaskDue(task.due)}</span>
        </div>

        {showButtons && !isCompleted && open && (
          <div className={taskStyles.taskBtnRow}>
            <button
              className={taskStyles.taskDoneBtn}
              onClick={() => handleCompleteTask(task.id)}
              type="button"
            >
              ✓
            </button>
            <button
              className={taskStyles.taskDeleteBtn}
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
        <DashboardNavbar
          onNewJob={() => setShowNewJobModal(true)}
          onLogout={logout}
        />

        <div className={styles.chartsSection}>
          <div className={styles.gaugeWrapperCard}>
            {/* ── Card header: title + time-period pills ── */}
            <div className={styles.gaugeWrapperHeader}>
              <span className={styles.gaugeWrapperTitle}>
                Flowody Job Lifecycle
              </span>
              <div className={styles.gaugePeriodPills}>
                {(["today", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    className={`${styles.gaugePeriodPill} ${gaugeTimePeriod === p ? styles.gaugePeriodPillActive : ""}`}
                    onClick={() => setGaugeTimePeriod(p)}
                  >
                    {p === "today"
                      ? "Today"
                      : p === "week"
                        ? "This Week"
                        : "This Month"}
                  </button>
                ))}
              </div>
            </div>

            <AssigneeFilterBar
              employees={employees}
              selectedAssignee={selectedAssignee}
              onChange={setSelectedAssignee}
            />

            <div className={styles.statusGaugeRow}>
              {/* ── All 7 Flowody gauges with multi-colored status segments ── */}
              {statusGaugeData.map((gauge) => {
                const max = Math.max(gaugeFilteredJobs.length, 1);
                const percent = Math.min((gauge.value / max) * 100, 100);
                const totalAngle = Math.round((percent / 100) * 360);
                const isPendingGauge = gauge.key === JobPhase.PENDING;
                const pendingStatusOrder: JobStatus[] = [
                  JobStatus.DRAFT,
                  JobStatus.NEW,
                  JobStatus.NEEDS_QUOTE,
                ];

                // Build multi-segment conic gradient based on phase-specific jobs' statuses
                const phaseJobs = gaugeFilteredJobs.filter((job) => {
                  const s = String(job.status || "")
                    .trim()
                    .toLowerCase();
                  return gauge.key === normalizePhaseFromStatus(s);
                });

                // Count jobs by status within this phase
                const statusCounts: Partial<Record<JobStatus, number>> = {};
                phaseJobs.forEach((job) => {
                  const statusEnum = stringToJobStatus(job.status || "");
                  const statusKey = statusEnum; // use enum directly as key
                  statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
                });

                const statusEntries: Array<[JobStatus, number]> = isPendingGauge
                  ? pendingStatusOrder.map((status) => [
                      status,
                      statusCounts[status] || 0,
                    ])
                  : (Object.entries(statusCounts) as Array<
                      [JobStatus, number]
                    >);

                // Build conic gradient with proportional segments for each status
                let cursor = 0;
                const gradientStops: string[] = [];
                statusEntries
                  .filter(([, count]) => count > 0)
                  .forEach(([statusKey, count]) => {
                    const deg = (count / Math.max(gauge.value, 1)) * totalAngle;
                    const start = cursor;
                    const color = getStatusColor(statusKey) || gauge.color;
                    gradientStops.push(
                      `${color} ${start}deg ${cursor + deg}deg`,
                    );
                    cursor += deg;
                  });
                // Fill remainder with light gray if needed
                if (cursor < 360) {
                  gradientStops.push(`#ebebeb ${cursor}deg 360deg`);
                }
                const gradient =
                  gauge.value > 0 && gradientStops.length > 0
                    ? `conic-gradient(from -90deg, ${gradientStops.join(", ")})`
                    : "conic-gradient(from -90deg, #ebebeb 0deg 360deg)";

                // Check if any Quote Sent jobs are expired
                const hasExpiredQuotes =
                  gauge.key === JobPhase.QUOTING &&
                  phaseJobs.some(
                    (j) => j.status?.toLowerCase() === "quote_sent",
                  );

                return (
                  <div
                    key={gauge.key}
                    className={`${styles.statusGaugeCard} ${
                      hasExpiredQuotes ? styles.statusGaugeExpired : ""
                    }`}
                  >
                    <div className={styles.statusGaugeTitle}>{gauge.label}</div>
                    {hasExpiredQuotes && (
                      <div className={styles.expiredBadge}>⚠ Expired</div>
                    )}
                    <div className={styles.statusGaugeMeter}>
                      <div
                        className={styles.statusGaugeArc}
                        style={{ background: gradient } as React.CSSProperties}
                      />
                      <div className={styles.statusGaugeValue}>
                        <span className={styles.statusGaugeCount}>
                          {gauge.value}
                        </span>
                      </div>
                    </div>
                    {/* Status breakdown on hover */}
                    <div className={styles.statusBreakdown}>
                      {(isPendingGauge
                        ? statusEntries
                        : statusEntries
                            .filter(([, count]) => count > 0)
                            .sort(([, a], [, b]) => b - a)
                      ).map(([statusKey, count]) => (
                        <div key={statusKey} className={styles.breakdownRow}>
                          <span
                            className={styles.breakdownDot}
                            style={{
                              background: getStatusColor(statusKey),
                            }}
                          />
                          <span className={styles.breakdownLabel}>
                            {getStatusLabel(statusKey)}
                          </span>
                          <span className={styles.breakdownCount}>
                            {count} ·{" "}
                            {gauge.value > 0
                              ? Math.round((count / gauge.value) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                            Payments
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
                          {jobTypeFilter === "CHARGE UP"
                            ? "Payments"
                            : jobTypeFilter}
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

                          {JOB_PHASES.map((phase) => (
                            <button
                              key={phase.key}
                              type="button"
                              className={styles.thMenuItem}
                              onClick={() => {
                                setJobStatusFilter(phase.key);
                                setOpenHeaderMenu(null);
                              }}
                            >
                              {phase.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {jobStatusFilter && (
                        <div className={styles.thActiveFilter}>
                          {getPhaseInfo(jobStatusFilter).label}
                        </div>
                      )}
                    </th>

                    <th>Job</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Assigned</th>
                  </tr>
                </thead>

                <tbody>
                  {jobsLoading ? (
                    <tr>
                      <td colSpan={6} className={styles.tableStateCell}>
                        <div className={styles.tableState}>
                          <div className={styles.skeletonLineLg} />
                          <div className={styles.skeletonLineSm} />
                        </div>
                      </td>
                    </tr>
                  ) : visibleJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.tableStateCell}>
                        <div className={styles.tableEmpty}>
                          <div className={styles.tableEmptyIcon}>
                            <img src="/leaf-fall.png" alt="Leaf icon" />
                          </div>
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
                      const normalizedStatus = stringToJobStatus(job.status);
                      const statusChipLabel = getStatusLabel(normalizedStatus);
                      const statusChipColor = getStatusColor(normalizedStatus);
                      const isPendingPhase =
                        normalizedStatus === JobStatus.DRAFT ||
                        normalizedStatus === JobStatus.NEW;
                      const isQuotingPhase =
                        normalizedStatus === JobStatus.NEEDS_QUOTE ||
                        normalizedStatus === JobStatus.QUOTE_PREPARING ||
                        normalizedStatus === JobStatus.QUOTE_SENT ||
                        normalizedStatus === JobStatus.QUOTE_VIEWED ||
                        normalizedStatus === JobStatus.QUOTE_DECLINED ||
                        normalizedStatus === JobStatus.QUOTE_ACCEPTED;
                      const isScheduledPhase =
                        normalizedStatus === JobStatus.SCHEDULED ||
                        normalizedStatus === JobStatus.ASSIGNED;
                      const isProgressPhase =
                        normalizedStatus === JobStatus.IN_PROGRESS ||
                        normalizedStatus === JobStatus.ON_SITE ||
                        normalizedStatus === JobStatus.WORKING ||
                        normalizedStatus === JobStatus.WAITING_PARTS;
                      const isCompletedPhase =
                        normalizedStatus === JobStatus.COMPLETED ||
                        normalizedStatus === JobStatus.READY_TO_INVOICE;
                      const isInvoicingPhase =
                        normalizedStatus === JobStatus.INVOICE_DRAFT ||
                        normalizedStatus === JobStatus.INVOICE_SENT ||
                        normalizedStatus === JobStatus.AWAITING_PAYMENT;
                      const jobTypeChip = isPendingPhase ? (
                        <span className={styles.jobTypeChipModern}>
                          <Clock
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Pending
                        </span>
                      ) : isQuotingPhase ? (
                        <span className={styles.jobTypeChipModern}>
                          <PencilLine
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Quoting
                        </span>
                      ) : isScheduledPhase ? (
                        <span className={styles.jobTypeChipModern}>
                          <CalendarBlank
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Scheduled
                        </span>
                      ) : isProgressPhase ? (
                        <span className={styles.jobTypeChipModern}>
                          <Wrench
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Progress
                        </span>
                      ) : isCompletedPhase ? (
                        <span className={styles.jobTypeChipModern}>
                          <CheckCircle
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Completed
                        </span>
                      ) : isInvoicingPhase ? (
                        <span className={styles.jobTypeChipModern}>
                          <Receipt
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Invoicing
                        </span>
                      ) : job.jobType === "CHARGE UP" ? (
                        <span className={styles.jobTypeChipModern}>
                          <CurrencyDollar
                            size={12}
                            weight="regular"
                            className={styles.jobTypeChipIconModern}
                          />
                          Payments
                        </span>
                      ) : (
                        <span className={styles.jobTypeChipModern}>
                          <TrendUp
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
                              className={styles.statusChip}
                              style={{ background: statusChipColor }}
                            >
                              {statusChipLabel}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className={styles.jobLinkCell}
                              onClick={() =>
                                navigate(`/dashboard/jobs/${job.id}`)
                              }
                              title="Open job"
                            >
                              <div className={styles.jobMainCell}>
                                {(() => {
                                  const firstSpace = job.title.indexOf(" ");

                                  const jobNumber =
                                    firstSpace === -1
                                      ? job.title
                                      : job.title.substring(0, firstSpace);

                                  const jobName =
                                    firstSpace === -1
                                      ? ""
                                      : job.title.substring(firstSpace + 1);

                                  return (
                                    <div>
                                      <div className={styles.jobTitle}>
                                        {jobNumber}
                                      </div>

                                      {jobName && (
                                        <div className={styles.jobSubtle}>
                                          {jobName}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </button>
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

              <button
                className={styles.detailsBtn}
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
              >
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

            <div className={taskStyles.tasksCard}>
              <div className={taskStyles.tasksHeaderRow}>
                <h4 className={taskStyles.tasksTitle}>Tasks</h4>
              </div>

              <TaskAssigneeFilterBar
                employees={employees}
                value={taskAssigneeFilter}
                onChange={setTaskAssigneeFilter}
              />

              <button
                className={taskStyles.addTaskBtn}
                type="button"
                onClick={() => setShowAddTask(true)}
              >
                + Add Task
              </button>

              <div className={taskStyles.tasksList}>
                {visibleOpenTasksForSmallCard.length === 0 ? (
                  <div className={taskStyles.emptyState}>
                    <BeeIcon />
                    <div className={taskStyles.emptyTitle}>
                      There are no tasks
                    </div>
                    <div className={taskStyles.emptyText}>
                      Add more tasks to be on top of your work every day.
                    </div>
                  </div>
                ) : (
                  <div className={taskStyles.taskListUl}>
                    {visibleOpenTasksForSmallCard.map((task) =>
                      renderTaskCard(task, true),
                    )}
                  </div>
                )}
              </div>

              <button
                className={taskStyles.viewAllBtn}
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
          <div className={taskStyles.taskPanelOverlay}>
            <div
              className={taskStyles.taskPanel}
              role="dialog"
              aria-modal="true"
            >
              <div className={taskStyles.taskPanelHeader}>
                <span className={taskStyles.tasksTitle}>Tasks</span>
                <button
                  className={taskStyles.closeBtn}
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

              <div className={taskStyles.taskPanelFilterRow}>
                <button
                  className={
                    showCompleted
                      ? taskStyles.showCompletedBtnActive
                      : taskStyles.showCompletedBtn
                  }
                  type="button"
                  onClick={() => setShowCompleted((sc) => !sc)}
                >
                  Show completed tasks
                </button>
              </div>

              {showCompleted && completedTasks.length > 0 && (
                <div className={taskStyles.completedActionsRow}>
                  <button
                    className={taskStyles.cleanCompletedBtn}
                    type="button"
                    onClick={() => setShowCleanConfirm(true)}
                  >
                    <TrashIcon className={taskStyles.cleanIcon} />
                    <span>Clean completed ({completedTasks.length})</span>
                  </button>
                </div>
              )}

              {!showCompleted && (
                <div className={taskStyles.taskPanelTabsRow}>
                  <button
                    className={
                      taskTab === "upcoming"
                        ? taskStyles.tabBtnActive
                        : taskStyles.tabBtn
                    }
                    type="button"
                    onClick={() => setTaskTab("upcoming")}
                  >
                    Upcoming ({upcomingTasks.length})
                  </button>

                  <button
                    className={
                      taskTab === "overdue"
                        ? taskStyles.tabBtnActive
                        : taskStyles.tabBtn
                    }
                    type="button"
                    onClick={() => setTaskTab("overdue")}
                  >
                    Overdue ({overdueTasks.length})
                  </button>
                </div>
              )}

              <div className={taskStyles.taskPanelList}>
                {showCompleted ? (
                  completedTasks.length === 0 ? (
                    <div className={taskStyles.emptyState}>
                      <BeeIcon />
                      <div className={taskStyles.emptyTitle}>
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

        <AddCustomerModal
          show={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          onSave={handleSaveCustomerFromModal}
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
      <Footer />
    </div>
  );
};

export default DashboardPage;
