// src/pages/DashboardPage.tsx
// ✅ POSTGRES VERSION (UI restored)

import React, { useEffect, useMemo, useState } from "react";

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
import { Briefcase, UserPlus, FileText, PencilLine } from "phosphor-react";
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
  date: string; // dd/mm/yyyy
  assignedEmployeeIds: number[]; // ✅ backend should provide
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

  /* ───────── Loaders ───────── */

  const loadEmployees = async () => {
    // expects GET /api/employees -> [{id, name, avatar?}]
    const list = await apiGet<EmployeeType[]>("/employees");
    setEmployees(Array.isArray(list) ? list : []);
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      // expects GET /api/jobs -> [{ id, title, jobType, status, customer, date, assignedEmployeeIds }]
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

        const assignedEmployeeIds = Array.isArray(j.assignedEmployeeIds)
          ? j.assignedEmployeeIds
              .map((n: any) => Number(n))
              .filter((n: number) => Number.isFinite(n))
          : [];

        return {
          id: String(j.id),
          title: String(j.title ?? "Untitled"),
          jobType,
          status,
          customer: String(j.customer ?? j.customerName ?? "Unknown"),
          date,
          assignedEmployeeIds,
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

  const visibleJobs = useMemo(() => {
    const q = search.toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(q) ||
        job.customer.toLowerCase().includes(q);

      const matchesAssignee =
        selectedAssignee === "all" ||
        job.assignedEmployeeIds.includes(selectedAssignee);

      return matchesSearch && matchesAssignee;
    });
  }, [jobs, search, selectedAssignee]);

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
      // AddTask returns {desc}, but API expects description
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

  /* ───────── JSX ───────── */

  return (
    <div className={styles.dashboardShell}>
      <div className={styles.dashboardBg}>
        <DashboardNavbar
          searchValue={search}
          onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          onNewJob={() => setShowNewJobModal(true)}
        />

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
          <div className={styles.tableCard}>
            <div className={styles.cardTitleRow}>
              <h3 className={styles.cardTitle}>Job List</h3>
            </div>

            <table className={styles.jobsTable}>
              <thead>
                <tr>
                  <th>Job Type</th>
                  <th>Status</th>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {jobsLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 18 }}>
                      Loading jobs…
                    </td>
                  </tr>
                ) : visibleJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 18 }}>
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  visibleJobs.map((job) => {
                    const assignedNames =
                      job.assignedEmployeeIds.length === 0
                        ? "—"
                        : job.assignedEmployeeIds
                            .map(
                              (id) => employees.find((e) => e.id === id)?.name,
                            )
                            .filter(Boolean)
                            .sort((a, b) => a!.localeCompare(b!, "tr"))
                            .join(", ");

                    const jobTypeChip =
                      job.jobType === "CHARGE UP" ? (
                        <span className={styles.jobTypeChip}>
                          <FileText
                            size={11}
                            weight="regular"
                            className={styles.jobTypeChipIcon}
                          />
                          Charge Up
                        </span>
                      ) : (
                        <span className={styles.jobTypeChip}>
                          <PencilLine
                            size={11}
                            weight="regular"
                            className={styles.jobTypeChipIcon}
                          />
                          Estimate
                        </span>
                      );

                    return (
                      <tr key={job.id}>
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

                        <td>{job.title}</td>
                        <td>{job.customer}</td>
                        <td>{job.date}</td>
                        <td>{assignedNames}</td>

                        <td>
                          <button
                            className={styles.detailsBtn}
                            type="button"
                            aria-label={`View job ${job.title}`}
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
