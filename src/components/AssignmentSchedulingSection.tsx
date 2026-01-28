// Created by Honeycomb © 2025
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import styles from "./AssignmentSchedulingSection.module.css";
import { useNavigate } from "react-router-dom";
import AssignedEmployees, { AssignedEmployee } from "./AssignedEmployees";
import LabourTimeEntrySection from "./LabourTimeEntrySection";
import ConfirmModal from "./ConfirmModal";

/* ================= TYPES ================= */

interface Props {
  jobId: string;
}

interface EmployeeDoc {
  id: string;
  name?: string;
  fullName?: string;
  displayName?: string;
}

type TabType = "scheduling" | "labour";
const ENABLED_TABS: TabType[] = ["scheduling", "labour"];

/* ================= HELPERS ================= */

function toDateSafe(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  return null;
}

function toIsoSafe(v: any): string | undefined {
  const d = toDateSafe(v);
  return d ? d.toISOString() : undefined;
}

function calcHours(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const s = Date.parse(startIso);
  const e = Date.parse(endIso);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 0;
  return Math.round(((e - s) / 36e5) * 4) / 4;
}

/* ================= COMPONENT ================= */

const AssignmentSchedulingSection: React.FC<Props> = ({ jobId }) => {
  const navigate = useNavigate();
  const safeJobId = String(jobId);

  const [activeTab, setActiveTab] = useState<TabType>("scheduling");
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<
    AssignedEmployee[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const [confirmUnassign, setConfirmUnassign] = useState<{
    assignmentId: string;
    employeeName: string;
  } | null>(null);

  /* ================= TAB SAFETY ================= */

  useEffect(() => {
    if (!ENABLED_TABS.includes(activeTab)) {
      setActiveTab("scheduling");
    }
  }, [activeTab]);

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "employees"));
      setEmployees(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })),
      );
    })();
  }, []);

  /* ================= NAME LOOKUP ================= */

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      map.set(
        String(e.id),
        e.name || e.fullName || e.displayName || `Employee ${e.id}`,
      );
    });
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
          const data = d.data() as any;
          const empId = String(data.employeeId);

          if (!empId) return;

          if (!grouped.has(empId)) {
            grouped.set(empId, {
              employeeId: empId,
              name: employeeNameById.get(empId) || "Loading...",
              schedules: [],
              labour: { enteredHours: 0, completed: false },
            });
          }

          if (data.scheduled === false) return;

          const startIso = toIsoSafe(data.start);
          const endIso = toIsoSafe(data.end);
          if (!startIso || !endIso) return;

          const target = grouped.get(empId);
          if (!target) return;

          target.schedules.push({
            assignmentId: d.id, // 🔑 TEKİL GÜN
            start: startIso,
            end: endIso,
            hours: calcHours(startIso, endIso),
          });
        });

        grouped.forEach((v) =>
          v.schedules.sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
          ),
        );

        setAssignedEmployees(Array.from(grouped.values()));
      },
    );

    return () => unsub();
  }, [safeJobId, employeeNameById]);

  /* ================= ASSIGN ================= */

  const handleAssign = async () => {
    if (!selectedEmployee) return;

    if (assignedEmployees.some((e) => e.employeeId === selectedEmployee)) {
      setSelectedEmployee("");
      return;
    }

    await addDoc(collection(db, "jobs", safeJobId, "assignments"), {
      employeeId: selectedEmployee,
      scheduled: false,
      createdAt: serverTimestamp(),
      role: "technician",
    });

    setSelectedEmployee("");
  };

  const handleUnassignRequest = (
    assignmentId: string,
    employeeName: string,
  ) => {
    setConfirmUnassign({ assignmentId, employeeName });
  };

  /* ================= UNASSIGN (SINGLE DAY) ================= */

  const handleUnassignAssignment = async (assignmentId: string) => {
    await deleteDoc(doc(db, "jobs", safeJobId, "assignments", assignmentId));
  };

  /* ================= RENDER ================= */

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {ENABLED_TABS.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.active : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t === "scheduling" ? "Scheduling" : "Labour"}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <h3 className={styles.title}>Assignment & Scheduling</h3>

        <div className={styles.assignRow}>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className={styles.select}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name || emp.fullName || emp.displayName}
              </option>
            ))}
          </select>

          <button
            className={styles.assignBtn}
            disabled={!selectedEmployee}
            onClick={handleAssign}
          >
            Assign
          </button>

          <button
            className={styles.primaryBtn}
            onClick={() =>
              selectedEmployee &&
              navigate(
                `/dashboard/calendar?mode=schedule&jobId=${safeJobId}&employeeId=${selectedEmployee}`,
              )
            }
          >
            Schedule
          </button>
        </div>

        {activeTab === "scheduling" && (
          <AssignedEmployees
            employees={assignedEmployees}
            onUnassign={handleUnassignRequest}
          />
        )}

        {activeTab === "labour" && (
          <LabourTimeEntrySection
            jobId={safeJobId}
            employees={assignedEmployees.map((emp) => ({
              id: emp.employeeId,
              name: emp.name,
              role: "Technician",
              rate: 95,
            }))}
          />
        )}
      </div>
      {confirmUnassign && (
        <ConfirmModal
          title="Remove scheduled assignment?"
          description={
            <>
              This will remove <strong>{confirmUnassign.employeeName}</strong>{" "}
              from this scheduled day.
              <br />
              This action cannot be undone.
            </>
          }
          confirmText="Remove"
          onCancel={() => setConfirmUnassign(null)}
          onConfirm={async () => {
            const payload = confirmUnassign; // ✅ TS için
            if (!payload) return;

            await deleteDoc(
              doc(db, "jobs", safeJobId, "assignments", payload.assignmentId),
            );
            setConfirmUnassign(null);
          }}
        />
      )}
    </div>
  );
};

export default AssignmentSchedulingSection;
