// LabourTimeEntrySection.tsx
// Created by Honeycomb © 2025

import React, { useEffect, useMemo, useState } from "react";
import styles from "./LabourTimeSection.module.css";
import { apiGet, apiPost, apiDelete } from "../services/api";

/* ================= TYPES ================= */

type Employee = {
  id: number;
  name: string;
  rate: number;
};

type LabourEntry = {
  id: number;
  employee_name: string;
  chargeable_hours: number;
  total: number;
};

type UnchargedRow = {
  reason: string;
  minutes: number;
};

type Props = {
  jobId: number;
  assignment: {
    start: Date;
    end: Date;
    id?: number; // optional ama önerilir
  };
};

/* ================= UTILS ================= */

const pad = (n: number) => String(n).padStart(2, "0");

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function calcHours(start: Date, end: Date) {
  let diff = end.getTime() - start.getTime();
  if (diff <= 0) diff += 24 * 60 * 60 * 1000;
  return Math.round((diff / 36e5) * 4) / 4;
}

/* ================= COMPONENT ================= */

export default function LabourTimeEntrySection({ jobId, assignment }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<LabourEntry[]>([]);

  /* FORM STATE */
  const [employeeId, setEmployeeId] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  const [date, setDate] = useState(toDateInput(assignment.start));
  const [startTime, setStartTime] = useState(toTimeInput(assignment.start));
  const [endTime, setEndTime] = useState(toTimeInput(assignment.end));

  const [description, setDescription] = useState("");

  const [unchargedRows, setUnchargedRows] = useState<UnchargedRow[]>([]);
  const [tempReason, setTempReason] = useState("");
  const [tempMinutes, setTempMinutes] = useState(0);

  /* ================= LOAD ================= */

  useEffect(() => {
    apiGet<Employee[]>("/employees").then((r) => setEmployees(r ?? []));

    apiGet<LabourEntry[]>(
      assignment.id
        ? `/jobs/${jobId}/labour?assignment_id=${assignment.id}`
        : `/jobs/${jobId}/labour`,
    ).then((r) => setEntries(r ?? []));
  }, [jobId, assignment]);

  /* ================= TIME ================= */

  const startDate = useMemo(
    () => new Date(`${date}T${startTime}`),
    [date, startTime],
  );

  const endDate = useMemo(
    () => new Date(`${date}T${endTime}`),
    [date, endTime],
  );

  const workedHours = useMemo(
    () => calcHours(startDate, endDate),
    [startDate, endDate],
  );

  const unchargedHours = useMemo(
    () => unchargedRows.reduce((t, r) => t + r.minutes, 0) / 60,
    [unchargedRows],
  );

  const chargeableHours = Math.max(0, workedHours - unchargedHours);
  const total = Math.max(0, chargeableHours * rate);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!employeeId) return alert("Select employee");

    await apiPost(`/jobs/${jobId}/labour`, {
      assignment_id: assignment.id,
      employee_id: employeeId,
      start_time: startDate,
      end_time: endDate,
      worked_hours: workedHours,
      uncharged_hours: unchargedHours,
      chargeable_hours: chargeableHours,
      rate,
      total,
      description,
      uncharged: unchargedRows,
    });

    setDescription("");
    setUnchargedRows([]);

    const refreshed = await apiGet<LabourEntry[]>(
      assignment.id
        ? `/jobs/${jobId}/labour?assignment_id=${assignment.id}`
        : `/jobs/${jobId}/labour`,
    );

    setEntries(refreshed ?? []);
  };

  /* ================= UI ================= */

  return (
    <div className={styles.wrapper}>
      <h3>Labour</h3>

      {/* ADD TIME ENTRY */}
      <div className={styles.card}>
        <h4>Add time entry</h4>

        <div className={styles.row}>
          <select
            value={employeeId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setEmployeeId(id);
              const emp = employees.find((x) => x.id === id);
              setRate(emp?.rate ?? 0);
            }}
          >
            <option value={0}>Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            placeholder="$ Rate"
          />
        </div>

        <div className={styles.row}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <span>→</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <textarea
          placeholder="Work description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={styles.summary}>
          <div>Worked: {workedHours.toFixed(2)}h</div>
          <div>Uncharged: {unchargedHours.toFixed(2)}h</div>
          <div>Chargeable: {chargeableHours.toFixed(2)}h</div>
          <div className={styles.total}>${total.toFixed(2)}</div>
        </div>

        <div className={styles.unchargedRow}>
          <input
            placeholder="Uncharged reason"
            value={tempReason}
            onChange={(e) => setTempReason(e.target.value)}
          />
          <input
            type="number"
            placeholder="minutes"
            value={tempMinutes}
            onChange={(e) => setTempMinutes(Number(e.target.value))}
          />
          <button
            onClick={() => {
              if (!tempReason || !tempMinutes) return;
              setUnchargedRows((p) => [
                ...p,
                { reason: tempReason, minutes: tempMinutes },
              ]);
              setTempReason("");
              setTempMinutes(0);
            }}
          >
            + Add
          </button>
        </div>

        <button className={styles.primaryBtn} onClick={handleSave}>
          + Add time entry
        </button>
      </div>

      {/* LIST */}
      <div className={styles.card}>
        {entries.length === 0 ? (
          <div className={styles.empty}>No time entries</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className={styles.listRow}>
              <span>{e.employee_name}</span>
              <span>{e.chargeable_hours.toFixed(2)}h</span>
              <span>${e.total.toFixed(2)}</span>
              <button onClick={() => apiDelete(`/labour/${e.id}`)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
