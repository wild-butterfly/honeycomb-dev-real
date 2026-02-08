import React from "react";
import styles from "./TaskAssigneeFilterBar.module.css";

// aynı employee tipi
export type TaskAssigneeFilterBarProps = {
  employees: { id: number; name: string; avatar?: string }[];
  value: number | "all";
  onChange: (val: number | "all") => void;
};

const TaskAssigneeFilterBar: React.FC<TaskAssigneeFilterBarProps> = ({
  employees,
  value,
  onChange,
}) => {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon} aria-hidden="true">
        👥
      </span>

      <select
        className={styles.select}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "all" ? "all" : Number(v));
        }}
      >
        <option value="all">All Staff</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TaskAssigneeFilterBar;
