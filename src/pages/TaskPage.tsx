import React, { useEffect, useState } from "react";
import { createTask, getTasks, Task } from "../services/tasks";
import { useTaskEmployees } from "../services/taskEmployees";
import { useCompany } from "../context/CompanyContext";

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
    <div className="modal">
      <h2>Add Task</h2>

      <label>
        Description
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
      </label>

      <label>
        Assign to
        <div>
          {employees.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => toggleEmployee(e.id)}
              className={assigned.includes(e.id) ? "active" : ""}
            >
              {e.name}
            </button>
          ))}
        </div>
      </label>

      <label>
        Due date
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </label>

      <div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave}>Add Task</button>
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
    <div>
      <button onClick={() => setShowAddTask(true)}>+ Add Task</button>

      {showAddTask && (
        <AddTaskModal
          employees={employees}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {tasks.length === 0 ? (
        <p>No tasks</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t.id}>
              <b>{t.description}</b> — due {t.due}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskPage;
