// Created by Honeycomb © 2025
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

import styles from "./AssignmentSchedulingSection.module.css";
import { useNavigate } from "react-router-dom";
import AssignedEmployees, { AssignedEmployee } from "./AssignedEmployees";
import LabourTimeEntrySection from "./LabourTimeEntrySection";

/* ================= TYPES ================= */

interface Props {
  jobId: string;
}

interface EmployeeDoc {
  id: string; // 🔒 Firestore ID
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
  if (typeof v === "object" && typeof v.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return !isNaN(d.getTime()) ? d : null;
  }
  if (v instanceof Date) return !isNaN(v.getTime()) ? v : null;
  return null;
}

function toIsoSafe(v: any): string | undefined {
  const d = toDateSafe(v);
  return d ? d.toISOString() : undefined;
}

function calcHours(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.round((e - s) / (1000 * 60 * 60));
}

function uniqueScheduleKey(start?: string, end?: string) {
  return `${start || "x"}__${end || "y"}`;
}

/* ================= COMPONENT ================= */

const AssignmentSchedulingSection: React.FC<Props> = ({ jobId }) => {
  const navigate = useNavigate();
  const safeJobId = String(jobId);

  /* ================= STATE ================= */

  const [activeTab, setActiveTab] = useState<TabType>("scheduling");
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<
    AssignedEmployee[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  /* ================= TAB SAFETY ================= */

  useEffect(() => {
    if (!ENABLED_TABS.includes(activeTab)) setActiveTab("scheduling");
  }, [activeTab]);

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "employees"));
      setEmployees(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    })();
  }, []);

  /* ================= NAME LOOKUP ================= */

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();

    employees.forEach((e) => {
      const name = e.name || e.fullName || e.displayName || `Employee ${e.id}`;
      map.set(String(e.id), name);
    });

    return map;
  }, [employees]);

  /* ================= LOAD ASSIGNMENTS ================= */

  useEffect(() => {
    if (!safeJobId) return;

    const unsub = onSnapshot(
      collection(db, "jobs", safeJobId, "assignments"),
      async (snap) => {
        const grouped = new Map<string, AssignedEmployee>();

        for (const d of snap.docs) {
          const data = d.data() as any;

          const empId = String(
            data.employeeId ?? data.empId ?? data.employee ?? d.id
          );

          if (!grouped.has(empId)) {
            grouped.set(empId, {
              assignmentId: d.id,
              employeeId: String(empId),
              name: employeeNameById.get(empId) || "Loading...",
              schedules: [],
              labour: { enteredHours: 0, completed: false },
            });
          }

          const target = grouped.get(empId);
          if (!target) continue;

          target.name =
            employeeNameById.get(empId) || target.name || `Employee ${empId}`;

          // NEW FORMAT
          if (Array.isArray(data.schedules)) {
            for (const s of data.schedules) {
              const startIso = toIsoSafe(s?.start);
              const endIso = toIsoSafe(s?.end);
              if (!startIso || !endIso) continue;

              const key = uniqueScheduleKey(startIso, endIso);
              if (
                target.schedules.some(
                  (x) => uniqueScheduleKey(x.start, x.end) === key
                )
              )
                continue;

              target.schedules.push({
                start: startIso,
                end: endIso,
                hours: calcHours(startIso, endIso),
              });
            }
            continue;
          }

          // LEGACY FORMAT
          const startIso = toIsoSafe(data.start);
          const endIso = toIsoSafe(data.end);

          if (startIso && endIso) {
            const key = uniqueScheduleKey(startIso, endIso);
            if (
              !target.schedules.some(
                (x) => uniqueScheduleKey(x.start, x.end) === key
              )
            ) {
              target.schedules.push({
                start: startIso,
                end: endIso,
                hours: calcHours(startIso, endIso),
              });
            }
          }
        }

        grouped.forEach((v) =>
          v.schedules.sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          )
        );

        // 🔥 MISSING NAMES (Firestore needs STRING IDS)
        const missing = Array.from(grouped.values())
          .filter((x) => !x.name || x.name === "Loading...")
          .map((x) => String(x.employeeId));

        if (missing.length > 0) {
          const empSnap = await getDocs(
            query(
              collection(db, "employees"),
              where("__name__", "in", missing.slice(0, 10))
            )
          );

          empSnap.docs.forEach((e) => {
            const emp = e.data() as any;
            const id = String(e.id);
            const target = grouped.get(id);
            if (target) {
              target.name =
                emp.name || emp.fullName || emp.displayName || `Employee ${id}`;
            }
          });
        }

        setAssignedEmployees(Array.from(grouped.values()));
      }
    );

    return () => unsub();
  }, [safeJobId, employeeNameById]);

  /* ================= ASSIGN ================= */

  const handleAssign = async () => {
    if (!selectedEmployee) return;

    await setDoc(
      doc(db, "jobs", safeJobId, "assignments", selectedEmployee),
      {
        employeeId: selectedEmployee,
        schedules: [],
        createdAt: new Date(),
      },
      { merge: true }
    );

    setSelectedEmployee("");
  };

  /* ================= UNASSIGN ================= */

  const handleUnassignEmployee = async (assignmentId: string) => {
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
                `/dashboard/calendar?mode=schedule&jobId=${safeJobId}&employeeId=${selectedEmployee}`
              )
            }
          >
            Schedule
          </button>
        </div>

        {activeTab === "scheduling" && (
          <AssignedEmployees
            employees={assignedEmployees}
            onUnassign={handleUnassignEmployee}
          />
        )}

        {activeTab === "labour" && (
          <LabourTimeEntrySection
            jobId={safeJobId}
            employees={assignedEmployees.map((emp) => ({
              id: emp.employeeId,
              name: emp.name ?? "Unnamed employee",
              role: "Technician",
              rate: 95,
            }))}
          />
        )}
      </div>
    </div>
  );
};

export default AssignmentSchedulingSection;
