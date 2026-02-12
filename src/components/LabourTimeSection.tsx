// Created by Honeycomb © 2025

import React, { useEffect, useMemo, useState } from "react";
import styles from "./LabourTimeSection.module.css";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";
import { labourReasons } from "../config/labourReasons";

/* ================= TYPES ================= */

type Employee = {
  id: number;
  name: string;
  rate: number;
};

type LabourEntry = {
  id: number;
  assignment_id?: number;
  employee_id?: number;
  employee_name: string;
  chargeable_hours: number;
  worked_hours: number;
  uncharged_hours: number;
  total: number;
  rate: number;
  created_at: string;
  source?: "auto" | "manual";
};

type UnchargedReason = {
  id: number;
  name: string;
  paid: boolean;
};

type UnchargedRow = {
  reasonId: number;
  name: string;
  minutes: number;
  paid: boolean;
};

type Props = {
  jobId: number;
  assignment: {
    start: Date;
    end: Date;
    id?: number;
    completed?: boolean;
    employee_id?: number;
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

function toSqlString(d: Date) {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
}

/* ================= COMPONENT ================= */

export default function LabourTimeEntrySection({ jobId, assignment }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<LabourEntry[]>([]);
  const [reasons] = useState<UnchargedReason[]>(labourReasons);

  const [employeeId, setEmployeeId] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  const [date, setDate] = useState(toDateInput(assignment.start));
  const [startTime, setStartTime] = useState(toTimeInput(assignment.start));
  const [endTime, setEndTime] = useState(toTimeInput(assignment.end));
  const [description, setDescription] = useState("");

  const [unchargedRows, setUnchargedRows] = useState<UnchargedRow[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<number>(0);
  const [tempMinutes, setTempMinutes] = useState<number>(0);

  const [editingEntry, setEditingEntry] = useState<LabourEntry | null>(null);

  /* ================= LOAD ================= */

  const loadLabour = async () => {
    const data = await apiGet<LabourEntry[]>(`/jobs/${jobId}/labour`);
    setEntries(data ?? []);
  };

  useEffect(() => {
    apiGet<Employee[]>("/employees").then((r) => setEmployees(r ?? []));
    loadLabour();
  }, [jobId]);

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

  const totalUnchargedHours = useMemo(
    () => unchargedRows.reduce((t, r) => t + r.minutes, 0) / 60,
    [unchargedRows],
  );

  const chargeableHours = Math.max(0, workedHours - totalUnchargedHours);
  const total = chargeableHours * rate;

  /* ================= AUTO GENERATE ================= */

  useEffect(() => {
    const autoGenerate = async () => {
      if (!assignment?.completed) return;
      if (!assignment?.id) return;
      if (!assignment?.employee_id) return;
      if (!employees.length) return;

      // Prevent duplicate generation
      const exists = entries.some((e) => e.assignment_id === assignment.id);
      if (exists) return;

      const emp = employees.find((e) => e.id === assignment.employee_id);
      if (!emp) return;

      const worked = calcHours(
        new Date(assignment.start),
        new Date(assignment.end),
      );

      await apiPost(`/jobs/${jobId}/labour`, {
        assignment_id: assignment.id,
        employee_id: assignment.employee_id,
        start_time: toSqlString(new Date(assignment.start)),
        end_time: toSqlString(new Date(assignment.end)),
        worked_hours: worked,
        uncharged_hours: 0,
        chargeable_hours: worked,
        rate: emp.rate,
        total: worked * emp.rate,
        description: "Auto-generated from completed assignment",
        source: "auto",
      });

      await loadLabour();
    };

    autoGenerate();
  }, [
    assignment?.id,
    assignment?.completed,
    assignment?.employee_id,
    assignment?.start,
    assignment?.end,
    employees,
    entries,
    jobId,
  ]);

  /* ================= UNCHARGED ================= */

  const handleAddUncharged = () => {
    if (!selectedReasonId || !tempMinutes) return;

    const reason = reasons.find((r) => r.id === selectedReasonId);
    if (!reason) return;

    setUnchargedRows((prev) => [
      ...prev,
      {
        reasonId: reason.id,
        name: reason.name,
        minutes: tempMinutes,
        paid: reason.paid,
      },
    ]);

    setTempMinutes(0);
  };

  const handleRemoveUncharged = (index: number) => {
    setUnchargedRows((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!employeeId) return alert("Select employee");

    if (editingEntry) {
      await apiPut(`/jobs/${jobId}/labour/${editingEntry.id}`, {
        start_time: toSqlString(startDate),
        end_time: toSqlString(endDate),
        worked_hours: workedHours,
        uncharged_hours: totalUnchargedHours,
        chargeable_hours: chargeableHours,
        rate,
        total,
        description,
        uncharged: unchargedRows,
      });

      setEditingEntry(null);
    } else {
      await apiPost(`/jobs/${jobId}/labour`, {
        assignment_id: null,
        employee_id: employeeId,
        start_time: toSqlString(startDate),
        end_time: toSqlString(endDate),
        worked_hours: workedHours,
        uncharged_hours: totalUnchargedHours,
        chargeable_hours: chargeableHours,
        rate,
        total,
        description,
        uncharged: unchargedRows,
        source: "manual",
      });
    }

    await loadLabour();
    setDescription("");
    setUnchargedRows([]);
    setSelectedReasonId(0);
  };

  const handleEdit = (entry: LabourEntry) => {
    setEditingEntry(entry);
    setEmployeeId(entry.employee_id ?? 0);
    setRate(entry.rate);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete entry?")) return;
    await apiDelete(`/jobs/${jobId}/labour/${id}`);
    await loadLabour();
  };

  /* ================= GROUP ================= */

  const groupedEntries = useMemo(() => {
    return Object.values(
      entries.reduce((acc: any, entry) => {
        if (!acc[entry.employee_name]) {
          acc[entry.employee_name] = {
            name: entry.employee_name,
            rows: [],
            totalChargeable: 0,
            totalValue: 0,
          };
        }

        acc[entry.employee_name].rows.push(entry);
        acc[entry.employee_name].totalChargeable += Number(
          entry.chargeable_hours || 0,
        );
        acc[entry.employee_name].totalValue += Number(entry.total || 0);

        return acc;
      }, {}),
    );
  }, [entries]);

  /* ================= UI ================= */

  return (
    <div className={styles.layout}>
      {/* LEFT FORM */}
      <div className={styles.leftCard}>
        <h3>{editingEntry ? "Edit time entry" : "Add time entry"}</h3>

        <div className={styles.inlineRow}>
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
            className={styles.rateInput}
          />
        </div>

        <div className={styles.inlineRow}>
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

        {/* UNCHARGED */}
        <div className={styles.unchargedBox}>
          <div className={styles.inlineRow}>
            <select
              value={selectedReasonId}
              onChange={(e) => setSelectedReasonId(Number(e.target.value))}
            >
              <option value={0}>Uncharged reason</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.paid ? "PAID" : "UNPAID"})
                </option>
              ))}
            </select>

            <input
              type="number"
              value={tempMinutes}
              onChange={(e) => setTempMinutes(Number(e.target.value))}
              placeholder="minutes"
            />

            <button onClick={handleAddUncharged}>+ Add</button>
          </div>

          {unchargedRows.length === 0 && (
            <div className={styles.noUncharged}>No uncharged time entered</div>
          )}

          {unchargedRows.map((row, index) => (
            <div key={index} className={styles.unchargedRow}>
              <span>{row.name}</span>
              <span>{row.minutes} min</span>
              <button onClick={() => handleRemoveUncharged(index)}>✕</button>
            </div>
          ))}
        </div>

        <div className={styles.summaryStrip}>
          <div>Worked {workedHours.toFixed(2)}</div>
          <div>Uncharged {totalUnchargedHours.toFixed(2)}</div>
          <div>Chargeable {chargeableHours.toFixed(2)}</div>
          <div className={styles.money}>${total.toFixed(2)}</div>
        </div>

        <button className={styles.primaryBtn} onClick={handleSave}>
          {editingEntry ? "Save changes" : "+ Add time entry"}
        </button>
      </div>

      {/* RIGHT SUMMARY */}
      <div className={styles.rightCard}>
        {groupedEntries.map((emp: any, idx: number) => (
          <div key={idx} className={styles.employeeSection}>
            <div className={styles.employeeHeader}>
              <div className={styles.avatar}></div>
              <h3>
                {emp.name} | ${emp.totalValue.toFixed(2)}
              </h3>
            </div>

            <div className={styles.tableHeader}>
              <span>Rate</span>
              <span>Chargeable</span>
              <span>Uncharged</span>
              <span>Charged Out</span>
              <span></span>
            </div>

            {emp.rows.map((row: LabourEntry) => (
              <div key={row.id} className={styles.tableRow}>
                <span>${row.rate.toFixed(2)}</span>
                <span>{Number(row.chargeable_hours).toFixed(2)}</span>
                <span>{Number(row.uncharged_hours).toFixed(2)}</span>
                <span className={styles.money}>
                  ${Number(row.total).toFixed(2)}
                </span>

                <div className={styles.actions}>
                  <button onClick={() => handleEdit(row)}>✏</button>
                  <button onClick={() => handleDelete(row.id)}>✕</button>
                </div>
              </div>
            ))}

            <div className={styles.employeeTotals}>
              {emp.totalChargeable.toFixed(2)} hrs | $
              {emp.totalValue.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
