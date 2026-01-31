// Created by Honeycomb © 2025
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import styles from "./AssignmentSchedulingSection.module.css";
import { useNavigate } from "react-router-dom";
import AssignedEmployees, { AssignedEmployee } from "./AssignedEmployees";
import ConfirmModal from "./ConfirmModal";
import {
  jobsCol,
  employeesCol,
  assignmentsCol,
  jobDoc,
  assignmentDoc,
} from "../lib/firestorePaths";

/* ================= HELPERS ================= */

function toIsoSafe(v: any): string | undefined {
  if (!v) return;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
}

function calcHours(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const diff = Date.parse(endIso) - Date.parse(startIso);
  return diff > 0 ? Math.round((diff / 36e5) * 4) / 4 : 0;
}

/* ================= COMPONENT ================= */

const AssignmentSchedulingSection: React.FC<{ jobId: string }> = ({
  jobId,
}) => {
  const navigate = useNavigate();
  const safeJobId = String(jobId);

  const [employees, setEmployees] = useState<any[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<
    AssignedEmployee[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [confirmUnassign, setConfirmUnassign] = useState<{
    assignmentId: string;
    employeeName: string;
  } | null>(null);

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    getDocs(collection(db, employeesCol())).then((snap) =>
      setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) =>
      map.set(e.id, e.name || e.fullName || e.displayName || "Employee"),
    );
    return map;
  }, [employees]);

  /* ================= LOAD ASSIGNMENTS ================= */

  useEffect(() => {
    if (!safeJobId) return;

    const unsub = onSnapshot(
      collection(db, assignmentsCol(safeJobId)),
      (snap) => {
        const grouped = new Map<string, AssignedEmployee>();

        snap.docs.forEach((d) => {
          const a = d.data();
          const empId = String(a.employeeId);

          if (!grouped.has(empId)) {
            grouped.set(empId, {
              employeeId: empId,
              name: employeeNameById.get(empId) || "Loading...",
              schedules: [],
              labour: {
                enteredHours: 0,
                completed: false,
                hasUnscheduled: false,
              },
              unscheduledAssignmentId: undefined,
            });
          }

          const target = grouped.get(empId)!;

          const startIso = toIsoSafe(a.start);
          const endIso = toIsoSafe(a.end);

          if (a.scheduled === false) {
            if (!target.unscheduledAssignmentId) {
              target.unscheduledAssignmentId = d.id;
            }

            target.labour.hasUnscheduled = true;

            return;
          }

          if (!startIso || !endIso) return;

          target.schedules.push({
            assignmentId: d.id,
            start: startIso,
            end: endIso,
            hours: calcHours(startIso, endIso),
            completed: a.labourCompleted === true,
          });
        });

        // ✅ LABOUR COMPLETED badge logic
        grouped.forEach((emp) => {
          const hasSchedules = emp.schedules.length > 0;
          const allCompleted = emp.schedules.every((s) => s.completed === true);

          if (!hasSchedules && emp.labour.hasUnscheduled) {
            emp.labour.completed = null; // ⭐ ASSIGNED
          } else {
            emp.labour.completed = hasSchedules && allCompleted;
          }
        });
        setAssignedEmployees(Array.from(grouped.values()));
      },
    );

    return () => unsub();
  }, [safeJobId, employeeNameById]);

  /* ================= ASSIGN ================= */

  const handleAssign = async () => {
    if (!selectedEmployee) return;

    const snap = await getDocs(collection(db, assignmentsCol(safeJobId)));

    const exists = snap.docs.find(
      (d) =>
        String(d.data().employeeId) === selectedEmployee &&
        d.data().scheduled === false,
    );

    if (exists) {
      setSelectedEmployee("");
      return;
    }

    await addDoc(collection(db, assignmentsCol(safeJobId)), {
      employeeId: selectedEmployee,
      scheduled: false,
      labourCompleted: false,
      createdAt: serverTimestamp(),
    });

    setSelectedEmployee("");
  };

  /* ================= TOGGLE ASSIGNMENT COMPLETED ================= */

  const handleToggleAssignmentCompleted = async (
    assignmentId: string,
    completed: boolean,
  ) => {
    await updateDoc(doc(db, assignmentDoc(safeJobId, assignmentId)), {
      labourCompleted: completed,
      labourCompletedAt: completed ? serverTimestamp() : null,
    });

    const snap = await getDocs(collection(db, assignmentsCol(safeJobId)));

    const scheduledAssignments = snap.docs
      .map((d) => d.data())
      .filter((a) => a.scheduled !== false);

    const hasIncomplete = scheduledAssignments.some(
      (a) => a.labourCompleted !== true,
    );

    await updateDoc(doc(db, jobDoc(safeJobId)), {
      status:
        !hasIncomplete && scheduledAssignments.length > 0
          ? "completed"
          : "active",
      completedAt:
        !hasIncomplete && scheduledAssignments.length > 0
          ? serverTimestamp()
          : null,
    });
  };

  /* ================= RENDER ================= */

  return (
    <div className={styles.wrapper}>
      <h3>Assignment & Scheduling</h3>

      <div className={styles.assignRow}>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <button className={styles.assignBtn} onClick={handleAssign}>
          Assign
        </button>

        <button
          className={styles.primaryBtn}
          disabled={!selectedEmployee}
          onClick={async () => {
            if (!selectedEmployee) return;

            const snap = await getDocs(
              collection(db, assignmentsCol(safeJobId)),
            );

            let scheduledId: string | null = null;
            let unscheduledId: string | null = null;

            snap.docs.forEach((d) => {
              const a = d.data();
              if (String(a.employeeId) !== selectedEmployee) return;

              // scheduled doc (start/end veya scheduled !== false)
              if (a.scheduled !== false) scheduledId = d.id;
              // unscheduled doc
              if (a.scheduled === false) unscheduledId = d.id;
            });

            // 1) scheduled varsa onu kullan
            let assignmentId: string | null = scheduledId ?? unscheduledId;

            // 2) hiç yoksa create
            if (!assignmentId) {
              const ref = await addDoc(
                collection(db, assignmentsCol(safeJobId)),
                {
                  employeeId: selectedEmployee,
                  scheduled: false,
                  labourCompleted: false,
                  createdAt: serverTimestamp(),
                },
              );
              assignmentId = ref.id;
            }

            navigate(
              `/dashboard/calendar?mode=schedule&jobId=${safeJobId}&employeeId=${selectedEmployee}&assignmentId=${assignmentId}`,
            );
          }}
        >
          Schedule
        </button>
      </div>

      <AssignedEmployees
        employees={assignedEmployees}
        onUnassign={(assignmentId, name) =>
          setConfirmUnassign({
            assignmentId,
            employeeName: name,
          })
        }
        onToggleAssignmentCompleted={handleToggleAssignmentCompleted}
      />

      {confirmUnassign && (
        <ConfirmModal
          title="Remove assignment?"
          description={
            <>
              This will remove <strong>{confirmUnassign.employeeName}</strong>{" "}
              from this scheduled day.
              <br />
              This action cannot be undone.
            </>
          }
          onCancel={() => setConfirmUnassign(null)}
          onConfirm={async () => {
            const snap = await getDocs(
              collection(db, assignmentsCol(safeJobId)),
            );

            const deletes = snap.docs
              .filter(
                (d) =>
                  String(d.data().employeeId) ===
                    String(confirmUnassign.assignmentId.split("_")[0]) ||
                  d.id === confirmUnassign.assignmentId,
              )
              .map((d) => deleteDoc(d.ref));

            await Promise.all(deletes);

            setConfirmUnassign(null);
          }}
        />
      )}
    </div>
  );
};

export default AssignmentSchedulingSection;
