// Created by Honeycomb © 2025
import React, { useEffect, useState } from "react";
import styles from "./CalendarJobDetailsModal.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import TimePicker from "../components/TimePicker";

interface Props {
  job: CalendarJob;
  employees: Employee[];
  onClose: () => void;
  onDelete: () => void;
  onSave: (job: CalendarJob) => void;
}

function formatDateLine(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);

  const dateLabel = s.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeLabel =
    s.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) +
    " – " +
    e.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

  const durationMinutes = Math.round((e.getTime() - s.getTime()) / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  let durationLabel = "";
  if (hours && mins) durationLabel = `${hours}h ${mins}m`;
  else if (hours) durationLabel = `${hours}h`;
  else durationLabel = `${mins}m`;

  return { dateLabel, timeLabel, durationLabel };
}

const CalendarJobDetailsModal: React.FC<Props> = ({
  job,
  employees,
  onClose,
  onDelete,
  onSave,
}) => {
  const { dateLabel, timeLabel, durationLabel } = formatDateLine(
    job.start,
    job.end
  );

  // 🟦 Edit Mode
  const [editMode, setEditMode] = useState(false);

  // 🟦 Editable fields
  const [title, setTitle] = useState(job.title);
  const [customer, setCustomer] = useState(job.customer);
  const [location, setLocation] = useState(job.location || "");

  // 🟦 Assigned staff (ALWAYS ARRAY)
  const [assignedTo, setAssignedTo] = useState<number[]>(
    Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo]
  );

  // 🟦 Time fields
  const [localStart, setLocalStart] = useState(new Date(job.start));
  const [localEnd, setLocalEnd] = useState(new Date(job.end));

  // Reset when job changes
  useEffect(() => {
    setEditMode(false);
    setTitle(job.title);
    setCustomer(job.customer);
    setLocation(job.location || "");
    setAssignedTo(Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo]);
    setLocalStart(new Date(job.start));
    setLocalEnd(new Date(job.end));
  }, [job]);

  // 🟦 SAVE
  const handleSaveClick = () => {
    const updated: CalendarJob = {
      ...job,
      title,
      customer,
      location,
      assignedTo, // ALWAYS number[]
      start: localStart.toISOString(),
      end: localEnd.toISOString(),
    };

    onSave(updated);
    setEditMode(false);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        {/* HEADER */}
        <header className={styles.header}>
          <div>
            {editMode ? (
              <input
                className={styles.titleInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            ) : (
              <div className={styles.title}>{job.title}</div>
            )}

            <div className={styles.subtitle}>{dateLabel}</div>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        {/* TIME */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>TIME</div>

          {editMode ? (
            <div className={styles.timeEditContainer}>
              <TimePicker value={localStart} onChange={setLocalStart} label="Start" />
              <TimePicker value={localEnd} onChange={setLocalEnd} label="End" />
            </div>
          ) : (
            <div className={styles.sectionValue}>
              {timeLabel} <span className={styles.chip}>{durationLabel}</span>
            </div>
          )}
        </div>

        {/* STAFF */}
<div className={styles.section}>
  <div className={styles.sectionLabel}>ASSIGNED STAFF</div>

  <div className={styles.staffContainer}>
    {assignedTo.map((id) => {
      const emp = employees.find((e) => e.id === id);
      if (!emp) return null;

      return (
        <div
          key={id}
          className={styles.staffChip}
          onClick={() =>
            editMode &&
            setAssignedTo((prev) => prev.filter((x) => x !== id))
          }
        >
          <div className={styles.staffAvatar2}>
            {emp.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>

          <span className={styles.staffName}>{emp.name}</span>

          {editMode && <span className={styles.removeX}>×</span>}
        </div>
      );
    })}
  </div>

  {editMode && (
    <select
      className={styles.staffDropdown}
      onChange={(e) => {
        const id = Number(e.target.value);
        if (id && !assignedTo.includes(id)) {
          setAssignedTo((prev) => [...prev, id]);
        }
      }}
    >
      <option value="">Select staff…</option>
      {employees
        .filter((e) => !assignedTo.includes(e.id))
        .map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
    </select>
  )}
</div>


        {/* CUSTOMER */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>CUSTOMER</div>

          {editMode ? (
            <input
              className={styles.fieldInput}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{customer}</div>
          )}
        </div>

        {/* LOCATION */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>SITE ADDRESS</div>

          {editMode ? (
            <textarea
              className={styles.fieldTextarea}
              rows={2}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{location || "—"}</div>
          )}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          {editMode ? (
            <>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setEditMode(false);
                  setTitle(job.title);
                  setCustomer(job.customer);
                  setLocation(job.location || "");
                  setAssignedTo(Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo]);
                  setLocalStart(new Date(job.start));
                  setLocalEnd(new Date(job.end));
                }}
              >
                Cancel
              </button>

              <button type="button" className={styles.primaryBtn} onClick={handleSaveClick}>
                Save changes
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.deleteBtn} onClick={onDelete}>
                Delete event
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setEditMode(true)}
              >
                Edit event
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarJobDetailsModal;
