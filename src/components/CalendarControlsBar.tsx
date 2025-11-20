// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import styles from "./CalendarControlsBar.module.css";

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
}) => {
  // 📅 Tarih metni biçimi
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
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    }
  };

  // 🔹 dropdown sadece day & week’te görünecek
  const showStaffDropdown = rangeMode === "day" || rangeMode === "week";

  return (
    <div className={styles.controlsContainer}>
      {/* === Sol: Staff seçici (sadece Day ve Week) === */}
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

      {/* === Orta: Tarih başlığı === */}
      <div className={styles.dateSection}>
        <button className={styles.navButton} onClick={onPrev}>
          {"<"}
        </button>
        <span className={styles.dateLabel}>{formatDateLabel(date)}</span>
        <button className={styles.navButton} onClick={onNext}>
          {">"}
        </button>
      </div>

      {/* === Sağ: Görünüm butonları === */}
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
    </div>
  );
};

export default CalendarControlsBar;
