// Created by Honeycomb © 2025
import React, { useState } from "react";
import styles from "./CalendarPopup.module.css";

interface CalendarPopupProps {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}

export default function CalendarPopup({
  selectedDate,
  onSelect,
  onClose,
}: CalendarPopupProps) {
  const [current, setCurrent] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const month = current.getMonth();
  const year = current.getFullYear();

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));

  const firstDayIndex =
    (new Date(year, month, 1).getDay() || 7) - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];

  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    days.push(new Date(year, month, d));

  const isSame = (a: Date | null, b: Date) =>
    a &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <button className={styles.arrowBtn} onClick={prevMonth}>
            ‹
          </button>

          <div className={styles.monthLabel}>
            {current.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>

          <button className={styles.arrowBtn} onClick={nextMonth}>
            ›
          </button>
        </div>

        <div className={styles.weekHeader}>
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div key={d} className={styles.weekHeaderCell}>
              {d}
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          {days.map((d, idx) => {
            if (!d)
              return <div key={idx} className={styles.emptyCell}></div>;

            const selected = isSame(d, selectedDate);

            return (
              <button
                key={idx}
                className={selected ? styles.selectedDay : styles.day}
                onClick={() => onSelect(d)}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
