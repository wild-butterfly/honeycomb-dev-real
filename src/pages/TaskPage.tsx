import React, { useState } from "react";

// ---------- AddTaskModal (MODAL COMPONENT) ----------
type Employee = { id: number; name: string };
type Task = { id: number; desc: string; assigned: number[]; due: string };

type AddTaskModalProps = {
  employees: Employee[];
  onClose: () => void;
  onSave: (task: Omit<Task, "id">) => void;
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ employees, onClose, onSave }) => {
  const [desc, setDesc] = useState("");
  const [assigned, setAssigned] = useState<number[]>([]);
  const [due, setDue] = useState("");

  const handleEmployeeChange = (id: number) => {
    setAssigned(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (desc && assigned.length > 0 && due) {
      onSave({ desc, assigned, due });
      setDesc("");
      setAssigned([]);
      setDue("");
      onClose();
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
    }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 30, minWidth: 320 }}>
        <h2>Add Task</h2>
        <label>
          Description*<br />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} style={{ width: "100%", minHeight: 50 }} />
        </label>
        <br />
        <label>
          Assign to employees*<br />
          <div style={{ display: "flex", gap: 6 }}>
            {employees.map(emp => (
              <button
                type="button"
                key={emp.id}
                onClick={() => handleEmployeeChange(emp.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  border: assigned.includes(emp.id) ? "2px solid #b99a2a" : "1px solid #ddd",
                  background: assigned.includes(emp.id) ? "#ffe066" : "#f8f8f8",
                  marginRight: 6,
                  cursor: "pointer"
                }}>
                {emp.name}
              </button>
            ))}
          </div>
        </label>
        <br />
        <label>
          Due date*<br />
          <input type="date" value={due} onChange={e => setDue(e.target.value)} />
        </label>
        <br /><br />
        <button onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
        <button onClick={handleSave} disabled={!desc || assigned.length === 0 || !due} style={{
          background: "#b99a2a",
          color: "#fff",
          border: "2px solid #b99a2a",
          borderRadius: 7,
          padding: "8px 18px",
          cursor: (!desc || assigned.length === 0 || !due) ? "not-allowed" : "pointer"
        }}>
          Add Task
        </button>
      </div>
    </div>
  );
};

// ---------- TaskPage (MAIN COMPONENT) ----------
const employees = [
  { id: 1, name: "Daniel Fear" },
  { id: 2, name: "Aşkın Fear" },
  { id: 3, name: "Beril Köse" },
];

const TaskPage: React.FC = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div>
      <button onClick={() => setShowAddTask(true)}>+ Add Task</button>
      {showAddTask && (
        <AddTaskModal
          employees={employees}
          onClose={() => setShowAddTask(false)}
          onSave={task => setTasks(prev => [...prev, { ...task, id: Date.now() }])}
        />
      )}
      <div style={{ marginTop: 30 }}>
        <h3>Tasks</h3>
        {tasks.length === 0 ? (
          <div>No tasks yet!</div>
        ) : (
          <ul>
            {tasks.map(task => (
              <li key={task.id} style={{ marginBottom: 16 }}>
                <b>{task.desc}</b>
                <div>
                  Atananlar:{" "}
                  {task.assigned
                    .map(id => employees.find(e => e.id === id)?.name || "?" )
                    .join(", ")}
                </div>
                <div>Son tarih: {task.due}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskPage;
