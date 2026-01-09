import React, { useState } from "react";
import StatusBoardChart from "../components/StatusBoardChart";
import PaymentsPieChart from "../components/PaymentsPieChart";
import JobsOverTimeChart from "../components/JobsOverTimeChart";
import AddTask from "../components/AddTask";
import NewJobModal from "../components/NewJobModal";
import DashboardNavbar from "../components/DashboardNavbar";
import AssigneeFilterBar from "../components/AssigneeFilterBar";
import TaskAssigneeFilterBar from "../components/TaskAssigneeFilterBar"; // 🔸 YENİ
import styles from "./DashboardPage.module.css";
import {
  Briefcase,
  UserPlus,
  FileText,
  PencilLine,
} from "phosphor-react";

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
  id: number;
  title: string;
  jobType: "CHARGE UP" | "ESTIMATE";
  status: "Pending" | "Active" | "Complete";
  customer: string;
  date: string; // dd/mm/yyyy
  assignedTo: number; // employee id
};

export type TaskType = {
  desc: string;
  assigned: number[];
  due: string; // yyyy-mm-dd
  id: number;
  completed?: boolean;
  completedByName?: string;
};

/* ───────── Seed data ───────── */

const employees: EmployeeType[] = [
  { id: 1, name: "Daniel Fear", avatar: "/avatar1.png" },
  { id: 2, name: "Aşkın Fear", avatar: "/avatar2.png" },
  { id: 3, name: "Beril Köse" },
];

const initialJobs: JobType[] = [
  {
    id: 1,
    title: "Test & Tag",
    jobType: "CHARGE UP",
    status: "Complete",
    customer: "ABC Pty Ltd",
    date: "12/07/2024",
    assignedTo: 2, // Aşkın
  },
  {
    id: 2,
    title: "Test & Tag",
    jobType: "CHARGE UP",
    status: "Active",
    customer: "ABC Pty Ltd",
    date: "12/07/2025",
    assignedTo: 1, // Daniel
  },
  {
    id: 3,
    title: "Install Lights",
    jobType: "ESTIMATE",
    status: "Pending",
    customer: "XYZ Ltd",
    date: "13/07/2025",
    assignedTo: 1, // Daniel
  },
];

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

/* ───────── Component ───────── */

const DashboardPage: React.FC<DashboardPageProps> = ({
  search,
  setSearch,
  customers,
  onAddCustomer,
}) => {
  // Jobs
  const [jobs, setJobs] = useState<JobType[]>(initialJobs);

  // Tasks
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [openTasks, setOpenTasks] = useState<{ [id: number]: boolean }>({});

  // UI state
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [taskTab, setTaskTab] = useState<"upcoming" | "overdue">("upcoming");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  // Assignee filter for jobs
  const [selectedAssignee, setSelectedAssignee] = useState<number | "all">(
    "all"
  );

  // 🔸 Assignee filter for tasks
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<
    number | "all"
  >("all");

  /* ───────── Job logic ───────── */

  const handleAddJob = (
    job: Omit<JobType, "id" | "status" | "date" | "assignedTo">
  ) => {
    setJobs((prev) => [
      ...prev,
      {
        ...job,
        id: Date.now(),
        status: "Pending",
        date: new Date().toLocaleDateString(),
        assignedTo: 1, // TODO: pick from modal later
      },
    ]);
    setShowNewJobModal(false);
  };

  // Visible jobs = search AND assignee filter
  const visibleJobs = jobs.filter((job) => {
    const q = search.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(q) ||
      job.customer.toLowerCase().includes(q);

    const matchesAssignee =
      selectedAssignee === "all" || job.assignedTo === selectedAssignee;

    return matchesSearch && matchesAssignee;
  });

  // Data for StatusBoardChart
  const statusBuckets = ["Pending", "Active", "Complete"] as const;

  const statusBoardData = statusBuckets.map((statusName) => {
    const jobsInThisStatus = visibleJobs.filter(
      (j) => j.status === statusName
    );

    return {
      name: statusName,
      jobs: jobsInThisStatus.length,
      value: 0, // placeholder for money/revenue/etc
    };
  });

  /* ───────── Task logic ───────── */

  // Helper: task bu assignee filtresine uyuyor mu?
  const taskMatchesAssignee = (
    task: TaskType,
    assignee: number | "all"
  ) => {
    if (assignee === "all") return true;
    return task.assigned.includes(assignee);
  };

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  // önce ham listeleri ayır
  const overdueTasksRaw = tasks.filter(
    (t) => !t.completed && t.due < today
  );
  const upcomingTasksRaw = tasks.filter(
    (t) => !t.completed && t.due >= today
  );
  const completedTasksRaw = tasks.filter((t) => t.completed);

  // sonra aktif filtreyi uygula
  const overdueTasks = overdueTasksRaw.filter((t) =>
    taskMatchesAssignee(t, taskAssigneeFilter)
  );
  const upcomingTasks = upcomingTasksRaw.filter((t) =>
    taskMatchesAssignee(t, taskAssigneeFilter)
  );
  const completedTasks = completedTasksRaw.filter((t) =>
    taskMatchesAssignee(t, taskAssigneeFilter)
  );

  // sağdaki küçük kart için gösterilecek aktif (tamamlanmamış) tasklar
  const visibleOpenTasksForSmallCard = tasks.filter(
    (t) => !t.completed && taskMatchesAssignee(t, taskAssigneeFilter)
  );

  const handleCompleteTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: true, completedByName: "Daniel Fear" }
          : t
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveTask = (task: {
    desc: string;
    assigned: number[];
    due: string;
  }) => {
    setTasks((prev) => [
      ...prev,
      { ...task, id: Date.now(), completed: false },
    ]);
  };

  /* ───────── Render helpers ───────── */

  const renderTaskCard = (task: TaskType, showButtons = false) => {
    const open = openTasks[task.id] || false;

    const handleToggle = () =>
      setOpenTasks((prev) => ({ ...prev, [task.id]: !open }));

    const assignedNames = task.assigned
      .map(
        (empId) =>
          employees.find((e) => e.id === empId)?.name || "Unknown"
      )
      .join(", ");

    return (
      <div
        key={task.id}
        className={`${styles.taskCardLi} ${
          task.completed ? styles.completed : ""
        }`}
      >
        <div className={styles.taskTitleRow}>
          <BeeIcon />
          <span>{task.desc}</span>

          {showButtons && !task.completed && (
            <button
              className={styles.toggleBtn}
              onClick={handleToggle}
              aria-label={open ? "Hide actions" : "Show actions"}
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

        {task.completed && task.completedByName && (
          <div className={styles.completedByRow}>
            <span className={styles.completedByLabel}>
              Completed by:
            </span>
            <span className={styles.completedByValue}>
              {task.completedByName}
            </span>
          </div>
        )}

        {showButtons && !task.completed && open && (
          <div className={styles.taskBtnRow}>
            <button
              className={styles.taskDoneBtn}
              onClick={() => handleCompleteTask(task.id)}
              title="Complete"
              aria-label="Mark complete"
              type="button"
            >
              ✓
            </button>
            <button
              className={styles.taskDeleteBtn}
              onClick={() => handleDeleteTask(task.id)}
              title="Delete"
              aria-label="Delete task"
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
              <PaymentsPieChart data={visibleJobs} />
            </div>
            <div className={styles.chartCard}>
              <JobsOverTimeChart data={visibleJobs} />
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
                {visibleJobs.map((job) => {
                  const emp = employees.find(
                    (e) => e.id === job.assignedTo
                  );

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
                      <td>{emp ? emp.name : "—"}</td>

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
                })}
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

              {/* 🔸 Task filtresi (küçük kartta) */}
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
                    <div className={styles.emptyTitle}>
                      There are no tasks
                    </div>
                    <div className={styles.emptyText}>
                      Add more tasks to be on top of your work every day.
                    </div>
                  </div>
                ) : (
                  <div className={styles.taskListUl}>
                    {visibleOpenTasksForSmallCard.map((task) =>
                      renderTaskCard(task, true)
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
            <div
              className={styles.taskPanel}
              role="dialog"
              aria-modal="true"
            >
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

              {/* 🔸 Task filtresi (panelde) */}
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

                <button
                  className={styles.addTaskGoldBtn}
                  type="button"
                  onClick={() => {
                    setShowAddTask(true);
                    setShowTaskPanel(false);
                  }}
                >
                  Add Task
                </button>
              </div>

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
                    completedTasks.map((task) =>
                      renderTaskCard(task, false)
                    )
                  )
                ) : (taskTab === "upcoming"
                    ? upcomingTasks
                    : overdueTasks
                  ).length === 0 ? (
                  <div className={styles.emptyState}>
                    <BeeIcon />
                    <div className={styles.emptyTitle}>
                      There are no tasks
                    </div>
                    <div className={styles.emptyText}>
                      {taskTab === "upcoming"
                        ? "Add more tasks to be on top of your work every day."
                        : "No overdue tasks! Keep up the good work."}
                    </div>
                  </div>
                ) : (
                  (taskTab === "upcoming"
                    ? upcomingTasks
                    : overdueTasks
                  ).map((task) => renderTaskCard(task, true))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: New Job */}
        <NewJobModal
          show={showNewJobModal}
          onClose={() => setShowNewJobModal(false)}
          onSubmit={handleAddJob}
          customersList={customers}
          onAddCustomer={onAddCustomer}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
