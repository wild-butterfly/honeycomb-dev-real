// LabourTimeEntrySection.tsx
// Created by Honeycomb © 2025

import React, { useEffect, useMemo, useState } from "react";
import styles from "./LabourTimeEntrySection.module.css";
import { apiGet, apiPost, apiDelete } from "../services/api";

/* ================= TYPES ================= */

type Employee = {
  id: number;
  name: string;
  role: string;
  rate: number;
};

type UnchargedRow = {
  reason: string;
  minutes: number;
};

type LabourEntry = {
  id: number;
  employee_name: string;
  chargeable_hours: number;
  total: number;
};

/* ================= UTILS ================= */
const safeNum = (v: any, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const clamp0 = (n: number) => Math.max(0, n);

function calcHours(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const sh = Number(start.slice(11, 13));
  const sm = Number(start.slice(14, 16));
  const eh = Number(end.slice(11, 13));
  const em = Number(end.slice(14, 16));
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  return Math.round(((endMin - startMin) / 60) * 4) / 4;
}

function toInputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
function toInputTime(value?: string | null) {
  return value ? value.slice(11, 16) : "";
}

/* ================= COMPONENT ================= */
type Props = {
  jobId: number;
  assignment: {
    start_time: string;
    end_time: string;
  } | null;
};

export default function LabourTimeEntrySection({ jobId, assignment }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<LabourEntry[]>([]);

  const [employeeId, setEmployeeId] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [description, setDescription] = useState("");

  const [unchargedRows, setUnchargedRows] = useState<UnchargedRow[]>([]);
  const [tempReason, setTempReason] = useState("");
  const [tempMinutes, setTempMinutes] = useState(0);

  /* ================= LOAD ================= */
  useEffect(() => {
    apiGet<Employee[]>("/employees").then((r) => setEmployees(r ?? []));
    apiGet<LabourEntry[]>(`/jobs/${jobId}/labour`).then((r) =>
      setEntries(r ?? []),
    );
  }, [jobId]);

  /* ================= TIME ================= */
  const workedHours = useMemo(() => {
    if (!assignment) return 0;
    return calcHours(assignment.start_time, assignment.end_time);
  }, [assignment]);

  const unchargedTotal = useMemo(() => {
    const mins = unchargedRows.reduce((t, r) => t + safeNum(r.minutes), 0);
    return mins / 60;
  }, [unchargedRows]);

  const chargeableHours = useMemo(
    () => clamp0(workedHours - unchargedTotal),
    [workedHours, unchargedTotal],
  );

  const total = useMemo(
    () => clamp0(rate * chargeableHours),
    [rate, chargeableHours],
  );

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!employeeId) return alert("Select employee");
    if (!assignment) return alert("Select assignment");
    if (workedHours <= 0) return alert("Invalid assignment duration");

    await apiPost(`/jobs/${jobId}/labour`, {
      employee_id: employeeId,
      assignment_start: assignment.start_time,
      assignment_end: assignment.end_time,
      worked_hours: workedHours,
      uncharged_hours: unchargedTotal,
      chargeable_hours: chargeableHours,
      rate,
      total,
      description,
      uncharged: unchargedRows,
    });

    setEmployeeId(0);
    setRate(0);
    setDescription("");
    setUnchargedRows([]);

    const refreshed = await apiGet<LabourEntry[]>(`/jobs/${jobId}/labour`);
    setEntries(refreshed ?? []);
  };

  const handleDelete = async (id: number) => {
    await apiDelete(`/labour/${id}`);
    setEntries((p) => p.filter((x) => x.id !== id));
  };

  /* ================= UI ================= */
  return (
    <div className={styles.wrapper}>
      <h3>Labour</h3>

      {!assignment && (
        <div className={styles.notice}>Select assignment first</div>
      )}

      <div className={styles.form}>
        <select
          value={employeeId}
          onChange={(e) => {
            const id = Number(e.target.value);
            setEmployeeId(id);
            const emp = employees.find((x) => x.id === id);
            setRate(emp ? emp.rate : 0);
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
          onChange={(e) => setRate(safeNum(e.target.value))}
          placeholder="Rate"
        />

        <div className={styles.summary}>
          <div>Worked: {workedHours.toFixed(2)}h</div>
          <div>Uncharged: {unchargedTotal.toFixed(2)}h</div>
          <div>Chargeable: {chargeableHours.toFixed(2)}h</div>
          <div className={styles.total}>${total.toFixed(2)}</div>
        </div>

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={styles.unchargedRow}>
          <input
            placeholder="Reason"
            value={tempReason}
            onChange={(e) => setTempReason(e.target.value)}
          />
          <input
            type="number"
            placeholder="minutes"
            value={tempMinutes}
            onChange={(e) => setTempMinutes(safeNum(e.target.value))}
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

        <button
          className={styles.primaryBtn}
          onClick={handleSave}
          disabled={!assignment}
        >
          + Add labour
        </button>
      </div>

      {entries.length > 0 && (
        <div className={styles.list}>
          {entries.map((e) => (
            <div key={e.id} className={styles.row}>
              <span>{e.employee_name}</span>
              <span>{e.chargeable_hours.toFixed(2)}h</span>
              <span>${e.total.toFixed(2)}</span>
              <button onClick={() => handleDelete(e.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
