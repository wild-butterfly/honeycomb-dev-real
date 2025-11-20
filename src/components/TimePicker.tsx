// Created by Honeycomb © 2025
import React, { useState, useEffect, useRef } from "react";
import styles from "./TimePicker.module.css";

interface Props {
  value: Date;
  onChange: (newDate: Date) => void;
  label?: string;
}

const TimePicker: React.FC<Props> = ({ value, onChange, label }) => {
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updated = new Date(value);
    updated.setHours(hour);
    updated.setMinutes(minute);
    onChange(updated);
  }, [hour, minute]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {label && <div className={styles.label}>{label}</div>}

      <div className={styles.row}>
        {/* HOURS */}
        <select
          className={styles.select}
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value))}
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <span className={styles.colon}>:</span>

        {/* MINUTES */}
        <select
          className={styles.select}
          value={minute}
          onChange={(e) => setMinute(parseInt(e.target.value))}
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimePicker;
