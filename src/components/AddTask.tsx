import React, { useState } from "react";
import styles from "./AddTask.module.css";

type Employee = {
  id: number;
  name: string;
  avatar?: string;
};

type AddTaskProps = {
  employees: Employee[];
  onClose: () => void;
  onSave: (task: { desc: string; assigned: number[]; due: string }) => void;
};

const AddTaskModal: React.FC<AddTaskProps> = ({ employees = [], onClose, onSave }) => {
  const [desc, setDesc] = useState("");
  const [assigned, setAssigned] = useState<number[]>([]);
  const [due, setDue] = useState("");

  const handleEmployeeChange = (empId: number) => {
    setAssigned(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2>Add Task</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}>
          <label htmlFor="desc">Description <span className={styles.required}>*</span></label>
          <textarea
            id="desc"
            className={styles.input}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Task description"
            autoFocus
          />
          <label>Assign to employees <span className={styles.required}>*</span></label>
          <div className={styles.employeeSelect}>
            {employees.map(emp => (
              <div
                key={emp.id}
                className={`${styles.employeeChip} ${assigned.includes(emp.id) ? styles.selected : ""}`}
                onClick={() => handleEmployeeChange(emp.id)}
                tabIndex={0}
                role="button"
                aria-pressed={assigned.includes(emp.id)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") handleEmployeeChange(emp.id);
                }}
              >
                {emp.avatar && <img src={emp.avatar} alt={emp.name} className={styles.avatar} />}
                {emp.name}
                {assigned.includes(emp.id) && (
                  <span className={styles.removeChip}>×</span>
                )}
              </div>
            ))}
          </div>
          <label htmlFor="due">Due date <span className={styles.required}>*</span></label>
          <input
            id="due"
            className={styles.input}
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
          />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.detailsBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.detailsBtn}
            style={{
              background: "#b99a2a",
              color: "#fff",
              border: "2px solid #b99a2a",
              marginLeft: 8,
              opacity: (!desc || assigned.length === 0 || !due) ? 0.6 : 1,
              cursor: (!desc || assigned.length === 0 || !due) ? "not-allowed" : "pointer"
            }}
            onClick={handleSave}
            disabled={!desc || assigned.length === 0 || !due}
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
