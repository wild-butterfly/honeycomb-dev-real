// Created by Honeycomb © 2025

import React, { useEffect, useState, useMemo } from "react";
import styles from "./AssignmentSchedulingSection.module.css";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

/* ================= TYPES ================= */
type Employee = {
  id: number;
  name: string;
};

type Assignment = {
  id: number;
  employee_id: number;
  start_time: string; // DB string "YYYY-MM-DD HH:mm:ss"
  end_time: string;
};

/* ================= HELPERS ================= */
function toInputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toInputTime(value?: string | null) {
  return value ? value.slice(11, 16) : "";
}

function calcHours(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const sh = Number(start.slice(11, 13));
  const sm = Number(start.slice(14, 16));
  const eh = Number(end.slice(11, 13));
  const em = Number(end.slice(14, 16));
  if ([sh, sm, eh, em].some((v) => isNaN(v))) return 0;

  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;

  if (endMin <= startMin) endMin += 24 * 60;

  return Math.round(((endMin - startMin) / 60) * 4) / 4;
}

/* ================= COMPONENT ================= */
type Props = {
  jobId: number;
  onSelectAssignment?: (a: { start_time: string; end_time: string }) => void;
};

const AssignmentSchedulingSection: React.FC<Props> = ({
  jobId,
  onSelectAssignment,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  /* ================= LOAD ================= */
  const loadAll = async () => {
    const [emps, rawAssignments] = await Promise.all([
      apiGet<Employee[]>("/employees"),
      apiGet<any[]>(`/assignments?job_id=${jobId}`),
    ]);

    setEmployees(emps ?? []);

    const normalized: Assignment[] = (rawAssignments ?? []).map((a) => ({
      id: Number(a.id),
      employee_id: Number(a.employee_id),
      start_time:
        a.start_time ?? a.start ?? a.startTime ?? "1970-01-01 00:00:00",
      end_time: a.end_time ?? a.end ?? a.endTime ?? "1970-01-01 00:00:00",
    }));

    setAssignments(normalized);
  };

  useEffect(() => {
    loadAll();
  }, [jobId]);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!selectedEmployee || !date || !start || !end) return;

    let endTimeStr = `${date} ${end}:00`;
    if (end <= start) {
      const [y, m, d] = date.split("-").map(Number);
      const dd = String(d + 1).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const yyyy = y;
      endTimeStr = `${yyyy}-${mm}-${dd} ${end}:00`;
    }

    const payload = {
      employee_id: selectedEmployee,
      start_time: `${date} ${start}:00`,
      end_time: endTimeStr,
    };

    if (editingId) {
      await apiPut(`/assignments/${editingId}`, payload);
    } else {
      await apiPost(`/assignments`, { job_id: jobId, ...payload });
    }

    resetForm();
    loadAll();
  };

  const handleEdit = (a: Assignment) => {
    setEditingId(a.id);
    setSelectedEmployee(a.employee_id);
    setDate(toInputDate(a.start_time));
    setStart(toInputTime(a.start_time));
    setEnd(toInputTime(a.end_time));
  };

  const handleDelete = async (id: number) => {
    await apiDelete(`/assignments/${id}`);
    loadAll();
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedEmployee(null);
    setDate("");
    setStart("");
    setEnd("");
  };

  /* ================= GROUP ================= */
  const grouped = useMemo(
    () =>
      employees.map((emp) => ({
        employee: emp,
        entries: assignments.filter((a) => a.employee_id === emp.id),
      })),
    [employees, assignments],
  );

  const totalHours = useMemo(
    () =>
      assignments.reduce(
        (sum, a) => sum + calcHours(a.start_time, a.end_time),
        0,
      ),
    [assignments],
  );

  /* ================= UI ================= */
  return (
    <div className={styles.wrapper}>
      <h3>Scheduling</h3>

      {/* CREATE / EDIT */}
      <div className={styles.assignRow}>
        <select
          value={selectedEmployee ?? ""}
          onChange={(e) => setSelectedEmployee(Number(e.target.value))}
        >
          <option value="">Select employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />

        <button className={styles.primaryBtn} onClick={handleSave}>
          {editingId ? "Update" : "Schedule"}
        </button>
        {editingId && (
          <button className={styles.assignBtn} onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>

      {/* LIST */}
      {grouped.map(({ employee, entries }) =>
        entries.length ? (
          <div key={employee.id} className={styles.employeeBlock}>
            <h4>{employee.name}</h4>

            <div className={styles.headerRow}>
              <div>Date</div>
              <div>Start</div>
              <div>End</div>
              <div>Hours</div>
              <div />
            </div>

            {entries.map((a) => (
              <div
                key={a.id}
                className={styles.entryRow}
                onClick={() =>
                  onSelectAssignment?.({
                    start_time: a.start_time,
                    end_time: a.end_time,
                  })
                }
              >
                <div>{toInputDate(a.start_time)}</div>
                <div>{toInputTime(a.start_time)}</div>
                <div>{toInputTime(a.end_time)}</div>
                <div>{calcHours(a.start_time, a.end_time)}</div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(a);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(a.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null,
      )}

      <div className={styles.totalRow}>Total Scheduled Hours: {totalHours}</div>
    </div>
  );
};

export default AssignmentSchedulingSection;
