import React, { useEffect, useState } from "react";
import { createTask, getTasks, Task } from "../services/tasks";
import { useTaskEmployees } from "../services/taskEmployees";
import { useCompany } from "../context/CompanyContext";
import styles from "./TaskPage.module.css";

// ---------- AddTaskModal ----------
type AddTaskModalProps = {
  employees: { id: number; name: string }[];
  onClose: () => void;
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ employees, onClose }) => {
  const [desc, setDesc] = useState("");
  const [assigned, setAssigned] = useState<number[]>([]);
  const [due, setDue] = useState("");

  const toggleEmployee = (id: number) => {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!desc || assigned.length === 0 || !due) return;

    try {
      await createTask({
        description: desc,
        assigned,
        due,
      });
      console.log("✅ Task written to Firestore");
      onClose();
    } catch (err) {
      console.error("❌ Failed to create task", err);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Add Task</h2>

        <label className={styles.label}>
          Description
          <textarea
            className={styles.textarea}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Assign to
          <div className={styles.employeeList}>
            {employees.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => toggleEmployee(e.id)}
                className={
                  assigned.includes(e.id)
                    ? `${styles.employeeButton} ${styles.employeeButtonActive}`
                    : styles.employeeButton
                }
              >
                {e.name}
              </button>
            ))}
          </div>
        </label>

        <label className={styles.label}>
          Due date
          <input
            className={styles.input}
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>

        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryAction} onClick={handleSave}>
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- TaskPage ----------
const TaskPage: React.FC = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { employees, loading } = useTaskEmployees();
  const { companyId } = useCompany();

  useEffect(() => {
    loadTasks();
  }, [companyId]);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Tasks</div>
        <button
          className={styles.primaryButton}
          onClick={() => setShowAddTask(true)}
        >
          + Add Task
        </button>
      </div>

      {showAddTask && (
        <AddTaskModal
          employees={employees}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {tasks.length === 0 ? (
        <div className={styles.empty}>No tasks</div>
      ) : (
        <ul className={styles.taskList}>
          {tasks.map((t) => (
            <li key={t.id} className={styles.taskItem}>
              <div>
                <div>
                  <b>{t.description}</b>
                </div>
                <div className={styles.taskMeta}>Due {t.due}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskPage;
