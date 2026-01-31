import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import styles from "./LabourTimeEntrySection.module.css";

/* ================= TYPES ================= */

type Employee = {
  id: string;
  name: string;
  role: string;
  rate: number;
};

type Reason = {
  id: string;
  name: string;
  chargeable: boolean;
};

type UnchargedRow = {
  reasonId: string;
  minutes: number;
};

type SavedEntry = {
  id: string;
  employeeName: string;
  start: string;
  end: string;
  chargeable: number;
  total: number;
};

/* ================= FALLBACK REASONS ================= */

const FALLBACK_REASONS: Reason[] = [
  { id: "travel", name: "Travel Time", chargeable: true },
  { id: "office", name: "Office Work", chargeable: true },
  { id: "prep", name: "Prep Work", chargeable: true },
  { id: "training", name: "Supervision / Training", chargeable: true },
  { id: "quotes", name: "Quotes / Estimates", chargeable: true },
  { id: "other", name: "Other", chargeable: true },
  { id: "paid_lunch", name: "Paid Lunch", chargeable: true },
  { id: "unpaid_lunch", name: "Unpaid Lunch", chargeable: false },
  { id: "unpaid_breaks", name: "Unpaid Breaks", chargeable: false },
  { id: "annual", name: "Annual Leave", chargeable: true },
  { id: "sick", name: "Sick Leave", chargeable: true },
  { id: "public", name: "Public Holiday", chargeable: true },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
/* ================= COMPONENT ================= */

export default function LabourTimeEntrySection({ jobId }: { jobId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reasons, setReasons] = useState<Reason[]>(FALLBACK_REASONS);

  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* FORM */
  const [employeeId, setEmployeeId] = useState("");
  const [rate, setRate] = useState<number>(0);

  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");

  /* Fergus-style uncharged */
  const [unchargedRows, setUnchargedRows] = useState<UnchargedRow[]>([]);
  const [tempReasonId, setTempReasonId] = useState<string>(
    FALLBACK_REASONS[0]?.id ?? "",
  );
  const [tempMinutes, setTempMinutes] = useState<number>(0);

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "employees"));

      // ✅ no "id" duplication bug
      setEmployees(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: String(data.name ?? ""),
            role: String(data.role ?? ""),
            rate: Number(data.rate ?? 0),
          };
        }),
      );
    };
    load();
  }, []);

  /* ================= LOAD REASONS (optional) =================
     Eğer unchargedReasons koleksiyonun varsa buradan çekelim,
     yoksa fallback kalsın.
  */

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const snap = await getDocs(collection(db, "unchargedReasons"));
        if (!snap.empty) {
          const loaded: Reason[] = snap.docs.map((d) => {
            const data: any = d.data();
            return {
              id: d.id,
              name: String(data.name ?? data.label ?? "Unnamed"),
              chargeable: Boolean(data.chargeable ?? data.paid ?? true),
            };
          });

          setReasons(loaded);
          setTempReasonId(loaded[0]?.id ?? "");
        } else {
          setReasons(FALLBACK_REASONS);
          setTempReasonId(FALLBACK_REASONS[0]?.id ?? "");
        }
      } catch {
        setReasons(FALLBACK_REASONS);
        setTempReasonId(FALLBACK_REASONS[0]?.id ?? "");
      }
    };

    loadReasons();
  }, []);

  /* ================= CALCS ================= */

  const workedHours = useMemo(() => {
    if (!date || !start || !end) return 0;

    const s = new Date(`${date}T${start}`);
    const e = new Date(`${date}T${end}`);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;

    const diff = (e.getTime() - s.getTime()) / 3600000;
    return diff > 0 ? diff : 0;
  }, [date, start, end]);

  const unchargedTotal = useMemo(() => {
    const totalMinutes = unchargedRows.reduce(
      (t, r) => t + (Number(r.minutes) || 0),
      0,
    );

    return totalMinutes / 60; // 🔥 saat'e çevir
  }, [unchargedRows]);

  const chargeableHours = useMemo(() => {
    // ✅ worked - uncharged (min 0)
    return Math.max(0, workedHours - unchargedTotal);
  }, [workedHours, unchargedTotal]);

  const chargedOut = useMemo(() => {
    return Math.max(0, Number(rate) || 0) * chargeableHours;
  }, [rate, chargeableHours]);

  const money = (n: number) => Number(n || 0).toFixed(2);
  const hours = (n: number) => Number(n || 0).toFixed(2);

  /* ================= UNCHARGED ADD/REMOVE ================= */

  const addUnchargedRow = () => {
    const mins = Number(tempMinutes);

    if (!tempReasonId) return alert("Select uncharged reason");
    if (!mins || mins <= 0) return alert("Enter minutes (> 0)");

    setUnchargedRows((prev) => [
      ...prev,
      { reasonId: tempReasonId, minutes: mins },
    ]);

    setTempMinutes(0);
  };

  const removeUnchargedRow = (idx: number) => {
    setUnchargedRows((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!employeeId) return alert("Select employee");
    if (!date || !start || !end) return alert("Select date/start/end");
    if (workedHours <= 0) return alert("End time must be after start time");

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return alert("Invalid employee");
    /* ================= SAVE OR EDIT ================= */
    if (editingId) {
      setSavedEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                start,
                end,
                chargeable: chargeableHours,
                total: chargedOut,
              }
            : e,
        ),
      );

      setEditingId(null);
    }
    // ✅ NEW ENTRY (Firestore save)
    const docRef = await addDoc(collection(db, "labourEntries"), {
      jobId,
      employeeId,
      employeeName: emp.name,
      role: emp.role,
      date,
      startTime: start,
      endTime: end,
      rate: Number(rate) || 0,
      workedHours,
      uncharged: unchargedTotal,
      chargeable: chargeableHours,
      chargedOut,
      description,
      createdAt: Timestamp.now(),
    });

    setSavedEntries((prev) => [
      ...prev,
      {
        id: docRef.id,
        employeeName: emp.name,
        start,
        end,
        chargeable: chargeableHours,
        total: chargedOut,
      },
    ]);
  };

  /* ================= EDIT ================= */

  const handleEdit = (entry: SavedEntry) => {
    setEmployeeId(
      employees.find((e) => e.name === entry.employeeName)?.id ?? "",
    );

    setStart(entry.start);
    setEnd(entry.end);

    setEditingId(entry.id);
  };

  /* ================= UI ================= */

  return (
    <div className={styles.wrapper}>
      <div className={styles.layout}>
        {/* LEFT */}
        <div className={styles.formSide}>
          <h3>Add time entry</h3>

          <div className={styles.rowTop}>
            <select
              value={employeeId}
              onChange={(e) => {
                const id = e.target.value;
                setEmployeeId(id);

                const emp = employees.find((x) => x.id === id);
                setRate(emp ? Number(emp.rate) || 0 : 0);
              }}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            {/* Rate input ($ icon inside like Fergus) */}
            <div className={styles.moneyInput}>
              <span>$</span>
              <input
                type="number"
                step="1"
                min={0}
                value={rate}
                onChange={(e) =>
                  setRate(Math.max(0, Number(e.target.value) || 0))
                }
                title="Charge out rate"
              />
            </div>
          </div>

          <div className={styles.rowTime}>
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
            <span className={styles.arrow}>→</span>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <textarea
            placeholder="Work description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Uncharged (Fergus style) */}
          <div className={styles.unchargedBlock}>
            <div className={styles.unchargedTitle}>Uncharged time</div>

            <div className={styles.unchargedRow}>
              <select
                value={tempReasonId}
                onChange={(e) => setTempReasonId(e.target.value)}
              >
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.chargeable ? "(PAID)" : "(UNPAID)"}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="5"
                min={0}
                placeholder="minutes"
                value={tempMinutes}
                onChange={(e) =>
                  setTempMinutes(Math.max(0, Number(e.target.value) || 0))
                }
                title="Minutes"
              />

              <button type="button" onClick={addUnchargedRow}>
                + Add
              </button>
            </div>

            <div className={styles.unchargedTable}>
              <div className={styles.unchargedHead}>
                <span>Reason</span>
                <span>Duration</span>
                <span />
              </div>

              {unchargedRows.length === 0 ? (
                <div className={styles.unchargedEmpty}>
                  No uncharged time entered
                </div>
              ) : (
                unchargedRows.map((r, idx) => (
                  <div
                    key={`${r.reasonId}-${idx}`}
                    className={styles.unchargedItem}
                  >
                    <span>
                      {reasons.find((x) => x.id === r.reasonId)?.name ??
                        "Unknown"}
                    </span>
                    <span>{r.minutes} min</span>
                    <button
                      type="button"
                      onClick={() => removeUnchargedRow(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button className={styles.primaryBtn} onClick={handleSave}>
            + Add time entry
          </button>
        </div>

        {/* RIGHT COLUMN (summary + entries birlikte) */}
        <div className={styles.rightSide}>
          {/* LIVE SUMMARY */}
          <div className={styles.summarySide}>
            <h4>Live Summary</h4>

            <div>Rate: ${money(rate)}</div>
            <div>Worked: {hours(workedHours)}h</div>
            <div>Uncharged: {hours(unchargedTotal)}h</div>
            <div>Chargeable: {hours(chargeableHours)}h</div>

            <hr />

            <div className={styles.total}>${money(chargedOut)}</div>
          </div>

          {/* SAVED ENTRIES LIST */}
          {savedEntries.length > 0 && (
            <div className={styles.savedList}>
              <h4>Entries</h4>

              {savedEntries.map((e) => (
                <div key={e.id} className={styles.savedRow}>
                  <div className={styles.avatar}>
                    {getInitials(e.employeeName)}
                  </div>

                  <span className={styles.name}>{e.employeeName}</span>

                  <span>
                    {e.start} → {e.end}
                  </span>

                  <span>{e.chargeable.toFixed(2)}h</span>
                  <span>${e.total.toFixed(2)}</span>

                  <button onClick={() => handleEdit(e)}>Edit</button>

                  <button
                    onClick={() =>
                      setSavedEntries((prev) =>
                        prev.filter((x) => x.id !== e.id),
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
