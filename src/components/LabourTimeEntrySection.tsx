// Created by Honeycomb © 2025
import React, { useCallback, useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import styles from "./LabourTimeEntrySection.module.css";

/* ================= FALLBACK REASONS ================= */

const FALLBACK_REASONS = [
  { id: "travel", name: "Travel Time", chargeable: true },
  { id: "office", name: "Office Work", chargeable: true },
  { id: "prep", name: "Prep Work", chargeable: true },
  { id: "training", name: "Supervision / Training", chargeable: true },
  { id: "quotes", name: "Quotes / Estimates", chargeable: true },
  { id: "other", name: "Other", chargeable: true },
  { id: "paid_lunch", name: "Paid Lunch", chargeable: true },
  { id: "unpaid_lunch", name: "Unpaid Lunch", chargeable: false },
  { id: "unpaid_breaks", name: "Unpaid Breaks", chargeable: false },
  { id: "first_hour", name: "First Hour Charge", chargeable: true },
  { id: "annual", name: "Annual Leave", chargeable: true },
  { id: "sick", name: "Sick Leave", chargeable: true },
  { id: "public", name: "Public Holiday", chargeable: true },
];

/* ================= TYPES ================= */

export type LabourEmployee = {
  id: string; // ✅ string
  name: string;
  role: string;
  rate: number;
};

interface Props {
  jobId: string;
  employees: LabourEmployee[];
}

interface LabourEntry {
  id: string;

  jobId: string;
  employeeId: string; // ✅ string
  employeeName: string;
  role: string;

  date: string;
  startTime: string;
  endTime: string;

  workedHours: number;
  rate: number;
  chargedOut: number;

  reason: string;
  paid: boolean;
  description: string;

  createdAt: Timestamp;
}

type Reason = { id: string; name: string; chargeable: boolean };

/* ================= COMPONENT ================= */

const LabourTimeEntrySection: React.FC<Props> = ({ jobId, employees }) => {
  /* ---------- STATE ---------- */

  const [entries, setEntries] = useState<LabourEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState<string | null>(null); // ✅ string|null
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

  const [reasons, setReasons] = useState<Reason[]>(FALLBACK_REASONS);
  const [selectedReason, setSelectedReason] = useState("");

  /* ---------- LOAD REASONS ---------- */

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const snap = await getDocs(collection(db, "unchargedReasons"));
        if (!snap.empty) {
          const loaded: Reason[] = snap.docs.map((d) => {
            const data: any = d.data();
            return {
              id: d.id,
              name: data.name ?? data.label ?? "Unnamed",
              chargeable: Boolean(data.chargeable ?? data.paid),
            };
          });

          setReasons(loaded);
          setSelectedReason(loaded[0]?.id ?? "");
        } else {
          setSelectedReason(FALLBACK_REASONS[0].id);
        }
      } catch {
        setSelectedReason(FALLBACK_REASONS[0].id);
      }
    };

    loadReasons();
  }, []);

  /* ---------- LOAD ENTRIES ---------- */

  const loadEntries = useCallback(async () => {
    if (!jobId) return;

    try {
      const q = query(
        collection(db, "labourEntries"),
        where("jobId", "==", jobId),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const list = snap.docs.map((d) => {
        const data = d.data() as any;

        return {
          id: d.id,
          jobId: String(data.jobId ?? ""),
          employeeId: String(data.employeeId ?? ""),
          employeeName: String(data.employeeName ?? ""),
          role: String(data.role ?? ""),
          date: String(data.date ?? ""),
          startTime: String(data.startTime ?? ""),
          endTime: String(data.endTime ?? ""),
          workedHours: Number(data.workedHours ?? 0),
          rate: Number(data.rate ?? 0),
          chargedOut: Number(data.chargedOut ?? 0),
          reason: String(data.reason ?? ""),
          paid: Boolean(data.paid ?? false),
          description: String(data.description ?? ""),
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt
              : Timestamp.now(),
        } as LabourEntry;
      });

      setEntries(list);
    } catch (err) {
      console.error("🔥 loadEntries failed:", err);
    }
  }, [jobId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  /* ---------- SAVE ---------- */

  const handleSave = async () => {
    if (!employeeId) return alert("Select employee");

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return alert("Select employee");

    const reasonObj = reasons.find((r) => r.id === selectedReason);
    if (!reasonObj) return alert("Select reason");

    if (!date || !startTime || !endTime) {
      return alert("Date and time required");
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return alert("Invalid date/time");
    }

    const workedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (workedHours <= 0) return alert("End time must be after start time");

    const chargedOut = reasonObj.chargeable ? workedHours * emp.rate : 0;

    const payload: Omit<LabourEntry, "id"> = {
      jobId,
      employeeId: emp.id, // ✅ string
      employeeName: emp.name,
      role: emp.role,
      date,
      startTime,
      endTime,
      workedHours,
      rate: emp.rate,
      chargedOut,
      reason: reasonObj.name,
      paid: reasonObj.chargeable,
      description,
      createdAt: Timestamp.now(),
    };

    if (editingId) {
      await updateDoc(doc(db, "labourEntries", editingId), payload);
      await loadEntries();
    } else {
      const ref = await addDoc(collection(db, "labourEntries"), payload);
      setEntries((prev) => [{ id: ref.id, ...payload }, ...prev]);
    }

    resetForm();
  };

  /* ---------- EDIT / DELETE ---------- */

  const handleEdit = (e: LabourEntry) => {
    setEditingId(e.id);
    setEmployeeId(e.employeeId); // ✅ string
    setDate(e.date);
    setStartTime(e.startTime);
    setEndTime(e.endTime);
    setDescription(e.description);

    const r = reasons.find((x) => x.name === e.reason);
    setSelectedReason(r?.id ?? reasons[0]?.id ?? "");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this time entry?")) return;
    await deleteDoc(doc(db, "labourEntries", id));
    await loadEntries();
  };

  const resetForm = () => {
    setEditingId(null);
    setEmployeeId(null);
    setDate("");
    setStartTime("");
    setEndTime("");
    setDescription("");
  };

  /* ---------- GROUP ---------- */

  const grouped = entries.reduce<Record<string, LabourEntry[]>>((acc, e) => {
    const key = String(e.employeeId);
    acc[key] = acc[key] || [];
    acc[key].push(e);
    return acc;
  }, {});

  /* ---------- RENDER ---------- */

  return (
    <div className={styles.wrapper}>
      <h3>Add time entry</h3>

      <div className={styles.form}>
        <select
          value={employeeId ?? ""}
          onChange={(e) => setEmployeeId(e.target.value || null)}
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
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
        >
          {reasons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} {r.chargeable ? "(PAID)" : "(UNPAID)"}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Work description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="button" onClick={handleSave}>
          {editingId ? "Update time entry" : "+ Add time entry"}
        </button>
      </div>

      {/* ===== SUMMARY ===== */}
      {Object.entries(grouped).map(([empKey, empEntries]) => {
        const totalHours = empEntries.reduce((s, e) => s + e.workedHours, 0);
        const totalCharge = empEntries.reduce((s, e) => s + e.chargedOut, 0);

        return (
          <div key={empKey} className={styles.employeeBlock}>
            <h4>
              {empEntries[0].employeeName} | ${empEntries[0].rate.toFixed(2)}
            </h4>

            <div className={styles.headerRow}>
              <span>Date</span>
              <span>Time</span>
              <span>Rate</span>
              <span>Chargeable</span>
              <span>Uncharged</span>
              <span>Charged Out</span>
              <span />
            </div>

            {empEntries.map((e) => (
              <div key={e.id} className={styles.entryRow}>
                <span>{e.date}</span>
                <span>
                  {e.startTime} – {e.endTime}
                </span>
                <span>${e.rate.toFixed(2)}</span>
                <span>{e.paid ? e.workedHours.toFixed(2) : "0.00"}</span>
                <span>{e.paid ? "0.00" : e.workedHours.toFixed(2)}</span>
                <span>${e.chargedOut.toFixed(2)}</span>
                <span className={styles.actions}>
                  <button onClick={() => handleEdit(e)}>✏️</button>
                  <button onClick={() => handleDelete(e.id)}>❌</button>
                </span>
              </div>
            ))}

            <div className={styles.totalRow}>
              <strong>Total</strong>
              <span />
              <span />
              <span>{totalHours.toFixed(2)}</span>
              <span>0.00</span>
              <span>${totalCharge.toFixed(2)}</span>
              <span />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LabourTimeEntrySection;
