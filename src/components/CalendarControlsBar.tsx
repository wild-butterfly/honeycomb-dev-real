// Created by Clevermode © 2025. All rights reserved.
import React, { useState } from "react";
import styles from "./CalendarControlsBar.module.css";
import CalendarPopup from "./CalendarPopup";
import { getStartOfWeek } from "../utils/date";

type Employee = { id: number; name: string };

type Props = {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  rangeMode: "day" | "week" | "month";
  onRangeModeChange: React.Dispatch<
    React.SetStateAction<"day" | "week" | "month">
  >;

  employees: Employee[];

  // FIXED TYPES
  staffFilter: number[]; // array
  onStaffFilterChange: (ids: number[]) => void;

  onDateChange: (d: Date) => void;
};

const CalendarControlsBar: React.FC<Props> = ({
  date,
  onPrev,
  onNext,
  rangeMode,
  onRangeModeChange,
  employees,
  staffFilter,
  onStaffFilterChange,
  onDateChange,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatLabel = (d: Date) => {
    if (rangeMode === "day")
      return d.toLocaleDateString("en-AU", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    if (rangeMode === "week") {
      const start = getStartOfWeek(d);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return `${start.toLocaleDateString("en-AU", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-AU", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const showStaff = rangeMode !== "month";

  const currentValue =
    staffFilter.length === 0 ? "all" : String(staffFilter[0]);

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;

    if (val === "all") {
      onStaffFilterChange([]); // empty = all
    } else {
      onStaffFilterChange([Number(val)]);
    }
  };

  return (
    <div className={styles.controlsContainer}>
      {showStaff && (
        <div className={styles.staffSection}>
          <label className={styles.staffLabel}>Staff</label>
          <select
            className={styles.staffDropdown}
            value={currentValue}
            onChange={handleStaffChange}
          >
            <option value="all">All Staff</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.centerDateWrapper}>
        <button className={styles.navButton} onClick={onPrev}>
          {"<"}
        </button>

        <button
          className={styles.dateLabelButton}
          onClick={() => setShowCalendar(true)}
        >
          {formatLabel(date)}
        </button>

        <button className={styles.navButton} onClick={onNext}>
          {">"}
        </button>
      </div>

      <div className={styles.viewButtons}>
        <button
          className={`${styles.viewButton} ${
            rangeMode === "day" ? styles.active : ""
          }`}
          onClick={() => onRangeModeChange("day")}
        >
          Day
        </button>

        <button
          className={`${styles.viewButton} ${
            rangeMode === "week" ? styles.active : ""
          }`}
          onClick={() => onRangeModeChange("week")}
        >
          Week
        </button>

        <button
          className={`${styles.viewButton} ${
            rangeMode === "month" ? styles.active : ""
          }`}
          onClick={() => onRangeModeChange("month")}
        >
          Month
        </button>
      </div>

      {showCalendar && (
        <CalendarPopup
          selectedDate={date}
          onSelect={(newDate) => {
            onDateChange(newDate);
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
};

export default CalendarControlsBar;
