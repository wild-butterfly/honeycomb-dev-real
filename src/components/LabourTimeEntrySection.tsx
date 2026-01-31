// Created by Honeycomb © 2025
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import styles from "./LabourTimeEntrySection.module.css";

/* ================= TYPES ================= */

type Employee = {
  id: string;
  name: string;
  role: string;
  rate: number;
  avatarUrl?: string; // optional (ileride Firestore’dan gelir)
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

type LabourEntryDoc = {
  id: string;
  jobId: string;
  employeeId: string;
  employeeName: string;

  date: string;
  startTime: string;
  endTime: string;

  rate: number;
  chargeable: number;
  total: number;

  description?: string;
  unchargedRows?: UnchargedRow[];
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
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clamp0 = (n: number) => Math.max(0, n);

/* ================= COMPONENT ================= */

export default function LabourTimeEntrySection({ jobId }: { jobId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reasons, setReasons] = useState<Reason[]>(FALLBACK_REASONS);

  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);

  /* ADD FORM */
  const [employeeId, setEmployeeId] = useState("");
  const [rate, setRate] = useState<number>(0);

  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");

  const [unchargedRows, setUnchargedRows] = useState<UnchargedRow[]>([]);
  const [tempReasonId, setTempReasonId] = useState<string>(
    FALLBACK_REASONS[0]?.id ?? "",
  );
  const [tempMinutes, setTempMinutes] = useState<number>(0);

  /* EDIT MODAL */
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editRate, setEditRate] = useState<number>(0);

  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [editUnchargedRows, setEditUnchargedRows] = useState<UnchargedRow[]>(
    [],
  );
  const [editTempReasonId, setEditTempReasonId] = useState<string>(
    FALLBACK_REASONS[0]?.id ?? "",
  );
  const [editTempMinutes, setEditTempMinutes] = useState<number>(0);

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "employees"));

      setEmployees(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: String(data.name ?? ""),
            role: String(data.role ?? ""),
            rate: safeNum(data.rate, 0),
            avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
          };
        }),
      );
    };
    load();
  }, []);

  /* ================= LOAD REASONS (optional) ================= */

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
          setEditTempReasonId(loaded[0]?.id ?? "");
        } else {
          setReasons(FALLBACK_REASONS);
          setTempReasonId(FALLBACK_REASONS[0]?.id ?? "");
          setEditTempReasonId(FALLBACK_REASONS[0]?.id ?? "");
        }
      } catch {
        setReasons(FALLBACK_REASONS);
        setTempReasonId(FALLBACK_REASONS[0]?.id ?? "");
        setEditTempReasonId(FALLBACK_REASONS[0]?.id ?? "");
      }
    };

    loadReasons();
  }, []);

  /* ================= LOAD SAVED ENTRIES (Firestore) ================= */

  useEffect(() => {
    if (!jobId) return;

    const loadSaved = async () => {
      const qy = query(
        collection(db, "labourEntries"),
        where("jobId", "==", jobId),
        orderBy("createdAt", "desc"),
      );

      const snap = await getDocs(qy);

      const rows: SavedEntry[] = snap.docs.map((d) => {
        const data: any = d.data();

        const breakdown = Array.isArray(data.unchargedBreakdown)
          ? data.unchargedBreakdown
          : [];

        const mappedUncharged: UnchargedRow[] = breakdown.map((b: any) => ({
          reasonId: String(b.reasonId ?? ""),
          minutes: Math.round(safeNum(b.hours, 0) * 60),
        }));

        return {
          id: d.id,
          jobId: String(data.jobId ?? jobId),

          employeeId: String(data.employeeId ?? ""),
          employeeName: String(data.employeeName ?? ""),

          date: String(data.date ?? ""),
          start: String(data.startTime ?? data.start ?? ""),
          end: String(data.endTime ?? data.end ?? ""),

          rate: safeNum(data.rate, 0),

          description: String(data.description ?? ""),

          unchargedRows: mappedUncharged,

          chargeable: safeNum(data.chargeable, 0),
          total: safeNum(data.chargedOut, 0),
        };
      });

      setSavedEntries(rows);
    };

    loadSaved();
  }, [jobId]);

  /* ================= CALCS (ADD FORM) ================= */

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
      (t, r) => t + safeNum(r.minutes, 0),
      0,
    );
    return totalMinutes / 60;
  }, [unchargedRows]);

  const chargeableHours = useMemo(
    () => clamp0(workedHours - unchargedTotal),
    [workedHours, unchargedTotal],
  );

  const chargedOut = useMemo(
    () => clamp0(safeNum(rate, 0) * chargeableHours),
    [rate, chargeableHours],
  );

  /* ================= CALCS (EDIT MODAL) ================= */

  const editWorkedHours = useMemo(() => {
    if (!editDate || !editStart || !editEnd) return 0;

    const s = new Date(`${editDate}T${editStart}`);
    const e = new Date(`${editDate}T${editEnd}`);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;

    const diff = (e.getTime() - s.getTime()) / 3600000;
    return diff > 0 ? diff : 0;
  }, [editDate, editStart, editEnd]);

  const editUnchargedTotal = useMemo(() => {
    const totalMinutes = editUnchargedRows.reduce(
      (t, r) => t + safeNum(r.minutes, 0),
      0,
    );
    return totalMinutes / 60;
  }, [editUnchargedRows]);

  const editChargeableHours = useMemo(
    () => clamp0(editWorkedHours - editUnchargedTotal),
    [editWorkedHours, editUnchargedTotal],
  );

  const editChargedOut = useMemo(
    () => clamp0(safeNum(editRate, 0) * editChargeableHours),
    [editRate, editChargeableHours],
  );

  const money = (n: number) => safeNum(n, 0).toFixed(2);
  const hours = (n: number) => safeNum(n, 0).toFixed(2);

  /* ================= UNCHARGED (ADD FORM) ================= */

  const addUnchargedRow = () => {
    const mins = safeNum(tempMinutes, 0);

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

  /* ================= UNCHARGED (EDIT MODAL) ================= */

  const addEditUnchargedRow = () => {
    const mins = safeNum(editTempMinutes, 0);

    if (!editTempReasonId) return alert("Select uncharged reason");
    if (!mins || mins <= 0) return alert("Enter minutes (> 0)");

    setEditUnchargedRows((prev) => [
      ...prev,
      { reasonId: editTempReasonId, minutes: mins },
    ]);
    setEditTempMinutes(0);
  };

  const removeEditUnchargedRow = (idx: number) => {
    setEditUnchargedRows((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ================= SAVE (ADD NEW) ================= */

  const handleSave = async () => {
    if (!employeeId) return alert("Select employee");
    if (!date || !start || !end) return alert("Select date/start/end");
    if (workedHours <= 0) return alert("End time must be after start time");

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return alert("Invalid employee");

    /* ================= EDIT MODE ================= */
    if (editingId) {
      try {
        await updateDoc(doc(db, "labourEntries", editingId), {
          startTime: start,
          endTime: end,
          workedHours,
          chargeable: chargeableHours,
          chargedOut,
          description,
        });
      } catch {
        // Firestore'da yoksa sadece local update
      }

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
      return;
    }

    /* ================= CREATE MODE ================= */
    const docRef = await addDoc(collection(db, "labourEntries"), {
      jobId,
      employeeId,
      employeeName: emp.name,
      role: emp.role,
      date,
      startTime: start,
      endTime: end,
      rate,
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

    setDate("");
    setStart("");
    setEnd("");
    setDescription("");
    setUnchargedRows([]);
  };

  /* ================= EDIT (OPEN MODAL) ================= */

  const handleEdit = async (entry: SavedEntry) => {
    const snap = await getDoc(doc(db, "labourEntries", entry.id));

    if (!snap.exists()) return;

    const data = snap.data() as LabourEntryDoc;

    setEditingId(entry.id);

    setEditEmployeeId(data.employeeId);
    setEditRate(data.rate);

    setEditDate(data.date);
    setEditStart(data.startTime);
    setEditEnd(data.endTime);

    setEditDescription(data.description ?? "");
    setEditUnchargedRows(data.unchargedRows ?? []);

    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    await updateDoc(doc(db, "jobs", jobId, "labourEntries", editingId), {
      employeeId: editEmployeeId,
      rate: editRate,
      date: editDate,
      start: editStart,
      end: editEnd,
      description: editDescription,
      unchargedRows: editUnchargedRows,
    });

    setIsEditOpen(false);
    setEditingId(null);
  };

  /* ================= UPDATE (SAVE MODAL) ================= */

  const handleUpdate = async () => {
    if (!editingId) return;

    if (!editEmployeeId) return alert("Select employee");
    if (!editDate || !editStart || !editEnd)
      return alert("Select date/start/end");
    if (editWorkedHours <= 0) return alert("End time must be after start time");

    const emp = employees.find((e) => e.id === editEmployeeId);
    if (!emp) return alert("Invalid employee");

    const payload = {
      jobId,

      employeeId: editEmployeeId,
      employeeName: emp.name,
      role: emp.role,

      date: editDate,
      startTime: editStart,
      endTime: editEnd,

      rate: safeNum(editRate, 0),
      workedHours: editWorkedHours,
      uncharged: editUnchargedTotal,
      chargeable: editChargeableHours,
      chargedOut: editChargedOut,
      description: editDescription,

      unchargedBreakdown: editUnchargedRows.map((r) => ({
        reasonId: r.reasonId,
        reasonName: reasons.find((x) => x.id === r.reasonId)?.name ?? "Unknown",
        hours: safeNum(r.minutes, 0) / 60,
      })),
    };

    await updateDoc(doc(db, "labourEntries", editingId), payload);

    setSavedEntries((prev) =>
      prev.map((e) =>
        e.id === editingId
          ? {
              ...e,

              employeeId: editEmployeeId,
              employeeName: emp.name,

              date: editDate,
              start: editStart,
              end: editEnd,

              rate: safeNum(editRate, 0),

              description: editDescription,

              unchargedRows: editUnchargedRows,

              chargeable: editChargeableHours,
              total: editChargedOut,
            }
          : e,
      ),
    );

    setIsEditOpen(false);
    setEditingId(null);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (entryId: string) => {
    // Firestore delete + local remove
    await deleteDoc(doc(db, "labourEntries", entryId));
    setSavedEntries((prev) => prev.filter((x) => x.id !== entryId));
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
                setRate(emp ? safeNum(emp.rate, 0) : 0);
              }}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <div className={styles.moneyInput}>
              <span>$</span>
              <input
                type="number"
                step="1"
                min={0}
                value={rate}
                onChange={(e) => setRate(clamp0(safeNum(e.target.value, 0)))}
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

          {/* Uncharged */}
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
                  setTempMinutes(clamp0(safeNum(e.target.value, 0)))
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

        {/* RIGHT */}
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

          {/* ENTRIES */}
          {savedEntries.length > 0 && (
            <div className={styles.savedList}>
              <h4>Entries</h4>

              {savedEntries.map((e) => (
                <div key={e.id} className={styles.savedRow}>
                  <div className={styles.avatar}>
                    {getInitials(e.employeeName)}
                  </div>

                  <span className={styles.name}>{e.employeeName}</span>

                  <span className={styles.timeBlock}>
                    <span className={styles.timeTop}>{e.start}</span>
                    <span className={styles.timeArrow}>→</span>
                    <span className={styles.timeBottom}>{e.end}</span>
                  </span>

                  <span className={styles.hoursCell}>
                    {e.chargeable.toFixed(2)}h
                  </span>
                  <span className={styles.moneyCell}>
                    ${e.total.toFixed(2)}
                  </span>

                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(e)}
                  >
                    Edit
                  </button>

                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(e.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {isEditOpen && (
        <div
          className={styles.modalOverlay}
          onMouseDown={() => setIsEditOpen(false)}
        >
          <div
            className={styles.modalCard}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Edit time entry</div>

              <button
                className={styles.modalClose}
                onClick={() => setIsEditOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.rowTop}>
                <select
                  value={editEmployeeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setEditEmployeeId(id);

                    const emp = employees.find((x) => x.id === id);
                    setEditRate(emp ? safeNum(emp.rate, 0) : 0);
                  }}
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>

                <div className={styles.moneyInput}>
                  <span>$</span>
                  <input
                    type="number"
                    step="1"
                    min={0}
                    value={editRate}
                    onChange={(e) =>
                      setEditRate(clamp0(safeNum(e.target.value, 0)))
                    }
                    title="Charge out rate"
                  />
                </div>
              </div>

              <div className={styles.rowTime}>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
                <span className={styles.arrow}>→</span>
                <input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                />
              </div>

              <textarea
                placeholder="Work description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />

              <div className={styles.unchargedBlock}>
                <div className={styles.unchargedTitle}>Uncharged time</div>

                <div className={styles.unchargedRow}>
                  <select
                    value={editTempReasonId}
                    onChange={(e) => setEditTempReasonId(e.target.value)}
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
                    value={editTempMinutes}
                    onChange={(e) =>
                      setEditTempMinutes(clamp0(safeNum(e.target.value, 0)))
                    }
                    title="Minutes"
                  />

                  <button type="button" onClick={addEditUnchargedRow}>
                    + Add
                  </button>
                </div>

                <div className={styles.unchargedTable}>
                  <div className={styles.unchargedHead}>
                    <span>Reason</span>
                    <span>Duration</span>
                    <span />
                  </div>

                  {editUnchargedRows.length === 0 ? (
                    <div className={styles.unchargedEmpty}>
                      No uncharged time entered
                    </div>
                  ) : (
                    editUnchargedRows.map((r, idx) => (
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
                          onClick={() => removeEditUnchargedRow(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.modalSummary}>
                <div>Worked: {hours(editWorkedHours)}h</div>
                <div>Uncharged: {hours(editUnchargedTotal)}h</div>
                <div>Chargeable: {hours(editChargeableHours)}h</div>
                <div className={styles.modalTotal}>
                  ${money(editChargedOut)}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
                <button className={styles.primaryBtn} onClick={handleUpdate}>
                  Save time entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
