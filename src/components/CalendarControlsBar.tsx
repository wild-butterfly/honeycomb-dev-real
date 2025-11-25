// Created by Clevermode © 2025. All rights reserved.
import React, { useState } from "react";
import styles from "./CalendarControlsBar.module.css";
import CalendarPopup from "./CalendarPopup";

type Employee = {
  id: number;
  name: string;
};

type Props = {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  rangeMode: "day" | "week" | "month";
  onRangeModeChange: React.Dispatch<
    React.SetStateAction<"day" | "week" | "month">
  >;
  employees: Employee[];
  staffFilter: number | "all";
  onStaffFilterChange: React.Dispatch<React.SetStateAction<number | "all">>;

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

  const formatDateLabel = (date: Date) => {
    if (rangeMode === "day") {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else if (rangeMode === "week") {
      const start = new Date(date);
      const end = new Date(date);
      start.setDate(date.getDate() - date.getDay() + 1);
      end.setDate(start.getDate() + 6);

      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else {
      return date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }
  };

  const showStaffDropdown = rangeMode === "day" || rangeMode === "week";

  return (
    <div className={styles.controlsContainer}>
      {/* LEFT SECTION (Staff dropdown ONLY when Day/Week) */}
      {showStaffDropdown && (
        <div className={styles.staffSection}>
          <label className={styles.staffLabel}>Staff</label>
          <select
            className={styles.staffDropdown}
            value={staffFilter}
            onChange={(e) =>
              onStaffFilterChange(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">All Staff</option>
            {employees.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* CENTER SECTION (Prev - Title - Next) */}
      <div className={styles.centerDateWrapper}>
        <button className={styles.navButton} onClick={onPrev}>
          {"<"}
        </button>

        <button
          className={styles.dateLabelButton}
          onClick={() => setShowCalendar(true)}
        >
          {formatDateLabel(date)}
        </button>

        <button className={styles.navButton} onClick={onNext}>
          {">"}
        </button>
      </div>

      {/* RIGHT SECTION (Day / Week / Month toggles) */}
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

      {/* POPUP CALENDAR */}
      {showCalendar && (
        <CalendarPopup
          selectedDate={date}
          onSelect={(newDate: Date) => {
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
