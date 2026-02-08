// Created by Clevermode © 2025. All rights reserved.

import React, { useState } from "react";
import styles from "./CalendarControlsBar.module.css";
import CalendarPopup from "./CalendarPopup";
import { getStartOfWeek } from "../utils/date";

type Props = {
  date: Date;
  onPrev: () => void;
  onNext: () => void;

  rangeMode: "day" | "week" | "month";
  onRangeModeChange: React.Dispatch<
    React.SetStateAction<"day" | "week" | "month">
  >;

  onDateChange: (d: Date) => void;
};

const CalendarControlsBar: React.FC<Props> = ({
  date,
  onPrev,
  onNext,
  rangeMode,
  onRangeModeChange,
  onDateChange,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatLabel = (d: Date) => {
    if (rangeMode === "day") {
      return d.toLocaleDateString("en-AU", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

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

    return d.toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={styles.controlsContainer}>
      {/* DATE NAV */}
      <div className={styles.centerDateWrapper}>
        <button className={styles.navButton} type="button" onClick={onPrev}>
          {"<"}
        </button>

        <button
          className={styles.dateLabelButton}
          type="button"
          onClick={() => setShowCalendar(true)}
        >
          {formatLabel(date)}
        </button>

        <button className={styles.navButton} type="button" onClick={onNext}>
          {">"}
        </button>
      </div>

      {/* VIEW MODE */}
      <div className={styles.viewButtons}>
        <button
          type="button"
          className={`${styles.viewButton} ${
            rangeMode === "day" ? styles.active : ""
          }`}
          onClick={() => onRangeModeChange("day")}
        >
          Day
        </button>

        <button
          type="button"
          className={`${styles.viewButton} ${
            rangeMode === "week" ? styles.active : ""
          }`}
          onClick={() => onRangeModeChange("week")}
        >
          Week
        </button>

        <button
          type="button"
          className={`${styles.viewButton} ${
            rangeMode === "month" ? styles.active : ""
          }`}
          onClick={() => onRangeModeChange("month")}
        >
          Month
        </button>
      </div>

      {/* DATE PICKER */}
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
