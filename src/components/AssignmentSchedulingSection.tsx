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
    getDocs(collection(db, "employees")).then((snap) =>
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
      collection(db, "jobs", safeJobId, "assignments"),
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
              labour: { enteredHours: 0, completed: false },
              unscheduledAssignmentId: undefined,
            });
          }

          const target = grouped.get(empId)!;

          const startIso = toIsoSafe(a.start);
          const endIso = toIsoSafe(a.end);

          if (!startIso || !endIso) {
            target.unscheduledAssignmentId = d.id;
            return;
          }

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
          emp.labour.completed =
            emp.schedules.length > 0 &&
            emp.schedules.every((s) => s.completed === true);
        });

        setAssignedEmployees(Array.from(grouped.values()));
      },
    );

    return () => unsub();
  }, [safeJobId, employeeNameById]);

  /* ================= ASSIGN ================= */

  const handleAssign = async () => {
    if (!selectedEmployee) return;

    await addDoc(collection(db, "jobs", safeJobId, "assignments"), {
      employeeId: selectedEmployee,
      scheduled: false,
      labourCompleted: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "jobs", safeJobId), {
      status: "active",
      completedAt: null,
    });

    setSelectedEmployee("");
  };

  /* ================= TOGGLE ASSIGNMENT COMPLETED ================= */

  const handleToggleAssignmentCompleted = async (
    assignmentId: string,
    completed: boolean,
  ) => {
    await updateDoc(doc(db, "jobs", safeJobId, "assignments", assignmentId), {
      labourCompleted: completed,
      labourCompletedAt: completed ? serverTimestamp() : null,
    });

    const snap = await getDocs(
      collection(db, "jobs", safeJobId, "assignments"),
    );

    const scheduledAssignments = snap.docs
      .map((d) => d.data())
      .filter((a) => a.scheduled !== false);

    const hasIncomplete = scheduledAssignments.some(
      (a) => a.labourCompleted !== true,
    );

    await updateDoc(doc(db, "jobs", safeJobId), {
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

            const ref = await addDoc(
              collection(db, "jobs", safeJobId, "assignments"),
              {
                employeeId: selectedEmployee,
                scheduled: false,
                labourCompleted: false,
                createdAt: serverTimestamp(),
              },
            );

            navigate(
              `/dashboard/calendar?mode=schedule&jobId=${safeJobId}&employeeId=${selectedEmployee}&assignmentId=${ref.id}`,
            );
          }}
        >
          Schedule
        </button>
      </div>

      <AssignedEmployees
        employees={assignedEmployees}
        onUnassign={(id, name) =>
          setConfirmUnassign({ assignmentId: id, employeeName: name })
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
            await deleteDoc(
              doc(
                db,
                "jobs",
                safeJobId,
                "assignments",
                confirmUnassign.assignmentId,
              ),
            );
            setConfirmUnassign(null);
          }}
        />
      )}
    </div>
  );
};

export default AssignmentSchedulingSection;
