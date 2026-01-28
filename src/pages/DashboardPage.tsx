import React, { useEffect, useMemo, useState } from "react";
import StatusBoardChart from "../components/StatusBoardChart";
import PaymentsPieChart from "../components/PaymentsPieChart";
import JobsOverTimeChart from "../components/JobsOverTimeChart";
import AddTask from "../components/AddTask";
import NewJobModal from "../components/NewJobModal";
import DashboardNavbar from "../components/DashboardNavbar";
import AssigneeFilterBar from "../components/AssigneeFilterBar";
import TaskAssigneeFilterBar from "../components/TaskAssigneeFilterBar";
import styles from "./DashboardPage.module.css";
import ConfirmModal from "../components/ConfirmModal";
import { Briefcase, UserPlus, FileText, PencilLine } from "phosphor-react";
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import {
  createTask,
  subscribeToTasks,
  deleteTask,
  completeTask,
  deleteAllCompletedTasks,
  Task,
} from "../services/tasks";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* ───────── Types ───────── */

type CustomerType = { id: number; name: string };

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
  id: string; // Firestore doc id
  title: string;
  jobType: "CHARGE UP" | "ESTIMATE";
  status: "Pending" | "Active" | "Complete";
  customer: string;
  date: string; // dd/mm/yyyy (derived)
  assignedEmployeeIds: number[]; // from assignments subcollection
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

const safeNumber = (v: unknown, fallback = 0) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? Number(n) : fallback;
};

const tsToDate = (v: any): Date | null => {
  try {
    if (!v) return null;
    if (v instanceof Timestamp) return v.toDate();
    if (typeof v?.toDate === "function") return v.toDate();
    if (typeof v === "number") return new Date(v);
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  } catch {
    return null;
  }
};

/* ───────── Component ───────── */

const DashboardPage: React.FC<DashboardPageProps> = ({
  search,
  setSearch,
  customers,
  onAddCustomer,
}) => {
  // Employees (Firestore)
  const [employees, setEmployees] = useState<EmployeeType[]>([]);

  // Jobs (Firestore)
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Tasks (Firestore)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openTasks, setOpenTasks] = useState<{ [id: string]: boolean }>({});

  // UI state
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [taskTab, setTaskTab] = useState<"upcoming" | "overdue">("upcoming");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);

  // Assignee filter for jobs
  const [selectedAssignee, setSelectedAssignee] = useState<number | "all">(
    "all",
  );

  // Assignee filter for tasks
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<number | "all">(
    "all",
  );

  // 🔥 STEP 4: TASKS (Firestore)
  // --------------------
  useEffect(() => {
    const unsubscribe = subscribeToTasks((firestoreTasks) => {
      setTasks(firestoreTasks);
    });

    return () => unsubscribe();
  }, []);

  /* ───────── Firestore: Employees ───────── */

  useEffect(() => {
    const q = query(collection(db, "employees"), orderBy("name", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: EmployeeType[] = snap.docs.map((d) => {
          const data = d.data() as any;

          // support either doc id numeric OR stored id field
          const id =
            Number.isFinite(Number(d.id)) && d.id !== ""
              ? Number(d.id)
              : safeNumber(data.id, 0);

          return {
            id,
            name: String(data.name ?? "Unknown"),
            avatar: data.avatar ? String(data.avatar) : undefined,
          };
        });

        // filter out invalid employee ids (0) if you don't want them
        setEmployees(list.filter((e) => e.id !== 0));
      },
      (err) => {
        console.error("employees snapshot error:", err);
        setEmployees([]);
      },
    );

    return () => unsub();
  }, []);

  /* ───────── Firestore: Jobs + Assignments ───────── */

  useEffect(() => {
    setJobsLoading(true);

    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        try {
          const jobDocs = snap.docs;

          const jobsData: JobType[] = await Promise.all(
            jobDocs.map(async (jobDoc) => {
              const job = jobDoc.data() as any;

              // assignments subcollection
              const assignmentsSnap = await getDocs(
                collection(db, "jobs", jobDoc.id, "assignments"),
              );

              const assignedEmployeeIds = Array.from(
                new Set(
                  assignmentsSnap.docs
                    .map((doc) => doc.data() as any)
                    .filter((a) => a && a.employeeId && a.scheduled !== false)
                    .map((a) => safeNumber(a.employeeId, 0))
                    .filter((n) => n !== 0),
                ),
              );

              // pick a “display date”:
              // 1) earliest assignment start
              // 2) job.date / job.start
              // 3) job.createdAt
              const assignmentDates = assignmentsSnap.docs
                .map((a) => tsToDate((a.data() as any).start))
                .filter(Boolean) as Date[];

              const earliestAssign =
                assignmentDates.length > 0
                  ? new Date(
                      Math.min(...assignmentDates.map((d) => d.getTime())),
                    )
                  : null;

              const jobDate =
                tsToDate(job.date) ??
                tsToDate(job.start) ??
                tsToDate(job.createdAt);

              const displayDate = earliestAssign ?? jobDate ?? new Date();

              const rawJobType = String(job.jobType ?? "").toUpperCase();
              const jobType: JobType["jobType"] =
                rawJobType === "ESTIMATE" ? "ESTIMATE" : "CHARGE UP";

              const rawStatus = String(job.status ?? "");
              const status: JobType["status"] =
                rawStatus === "Pending" || rawStatus === "Active"
                  ? rawStatus
                  : rawStatus === "Complete"
                    ? "Complete"
                    : "Pending";

              return {
                id: jobDoc.id,
                title: String(job.title ?? "Untitled"),
                jobType,
                status,
                customer: String(job.customer ?? job.customerName ?? "Unknown"),
                date: toDDMMYYYY(displayDate),
                assignedEmployeeIds,
              };
            }),
          );

          setJobs(jobsData);
        } catch (err) {
          console.error("jobs snapshot mapping error:", err);
          setJobs([]);
        } finally {
          setJobsLoading(false);
        }
      },
      (err) => {
        console.error("jobs snapshot error:", err);
        setJobs([]);
        setJobsLoading(false);
      },
    );

    return () => unsub();
  }, []);

  /* ───────── Job logic ───────── */

  const handleAddJob = async (
    job: Omit<JobType, "id" | "status" | "date" | "assignedEmployeeIds">,
  ) => {
    try {
      // Create job doc
      const jobRef = await addDoc(collection(db, "jobs"), {
        title: job.title,
        jobType: job.jobType === "ESTIMATE" ? "ESTIMATE" : "CHARGE_UP",
        status: "Pending",
        customerName: job.customer,
        customer: job.customer, // keep both if your app is mid-migration
        createdAt: serverTimestamp(),
      });

      // Add a default assignment (optional)
      // If you have current user employee id, replace this with real value.
      const defaultEmployeeId = 1;

      await setDoc(
        doc(db, "jobs", jobRef.id, "assignments", String(Date.now())),
        {
          employeeId: defaultEmployeeId,
          start: Timestamp.fromDate(new Date()),
          end: Timestamp.fromDate(new Date()),
          createdAt: serverTimestamp(),
        },
      );

      setShowNewJobModal(false);
    } catch (err) {
      console.error("add job error:", err);
      // optionally show toast UI here
    }
  };

  // Visible jobs = search AND assignee filter
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

  // Data for StatusBoardChart
  const statusBuckets = ["Pending", "Active", "Complete"] as const;

  const statusBoardData = useMemo(() => {
    return statusBuckets.map((statusName) => {
      const jobsInThisStatus = visibleJobs.filter(
        (j) => j.status === statusName,
      );

      return {
        name: statusName,
        jobs: jobsInThisStatus.length,
        value: 0, // placeholder for money/revenue/etc
      };
    });
  }, [visibleJobs]);

  /* ───────── Task logic ───────── */

  const taskMatchesAssignee = (task: Task, assignee: number | "all") => {
    if (assignee === "all") return true;
    return task.assigned.includes(assignee);
  };

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

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
    desc: string;
    assigned: number[];
    due: string;
  }) => {
    try {
      await createTask({
        desc: task.desc,
        assigned: task.assigned,
        due: task.due,
      });

      setShowAddTask(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  // ✅ COMPLETE TASK (Firestore)
  const currentEmployeeId = employees[0]?.id ?? 0;

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId, currentEmployeeId);
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  // ✅ DELETE TASK (Firestore)
  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
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
          <span>{task.desc}</span>

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
          <span>{task.due}</span>
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
              onClick={() => handleDeleteTask(task.id)}
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
        {/* NAVBAR */}
        <DashboardNavbar
          searchValue={search}
          onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          onNewJob={() => setShowNewJobModal(true)}
        />

        {/* FILTER + CHARTS SECTION */}
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

        {/* MAIN GRID BELOW CHARTS */}
        <div className={styles.bottomGrid}>
          {/* JOBS TABLE */}
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
                        {/* JOB TYPE */}
                        <td>{jobTypeChip}</td>

                        {/* STATUS */}
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

                        {/* JOB TITLE */}
                        <td>{job.title}</td>

                        {/* CUSTOMER */}
                        <td>{job.customer}</td>

                        {/* DATE */}
                        <td>{job.date}</td>

                        {/* ASSIGNED TO */}
                        <td>{assignedNames}</td>

                        {/* ACTIONS */}
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

          {/* SIDE COLUMN */}
          <div className={styles.sideColumn}>
            {/* QUICK ACTIONS */}
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

            {/* TASKS CARD */}
            <div className={styles.tasksCard}>
              <div className={styles.tasksHeaderRow}>
                <h4 className={styles.tasksTitle}>Tasks</h4>
              </div>

              {/* Task filter (small card) */}
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

        {/* MODAL: Add Task */}
        {showAddTask && (
          <AddTask
            employees={employees}
            onSave={handleSaveTask}
            onClose={() => setShowAddTask(false)}
          />
        )}

        {/* PANEL: View All Tasks */}
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

              {/* Task filter (panel) */}
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

        {/* MODAL: New Job */}
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
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
