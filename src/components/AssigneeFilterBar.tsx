import React from "react";
import styles from "./AssigneeFilterBar.module.css";

export type AssigneeFilterBarProps = {
  employees: { id: number; name: string; avatar?: string }[];
  selectedAssignee: number | "all";
  onChange: (val: number | "all") => void;
};

const AssigneeFilterBar: React.FC<AssigneeFilterBarProps> = ({
  employees,
  selectedAssignee,
  onChange
}) => {
  return (
    <div className={styles.filterBarWrapper}>
      <label className={styles.filterLabel} htmlFor="assigneeSelect">
        Filter by User or Group
      </label>

      <select
        id="assigneeSelect"
        className={styles.filterSelect}
        value={selectedAssignee}
        onChange={e => {
          const v = e.target.value;
          onChange(v === "all" ? "all" : Number(v));
        }}
      >
        <option value="all">All staff</option>
        {employees.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AssigneeFilterBar;
