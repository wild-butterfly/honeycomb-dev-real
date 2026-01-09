// Created by Honeycomb © 2025
import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
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
  id: string;
  name?: string;
  fullName?: string;
  displayName?: string;
}

type TabType = "scheduling" | "labour";

const ENABLED_TABS: TabType[] = ["scheduling", "labour"];

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
  const [selectedEmployee, setSelectedEmployee] = useState("");

  /* ================= SCHEDULE HANDLER ================= */

  const handleScheduleClick = () => {
    if (!safeJobId) return;

    navigate(`/dashboard/calendar?view=day&jobId=${safeJobId}`);
  };

  /* ================= TAB SAFETY ================= */

  useEffect(() => {
    if (!ENABLED_TABS.includes(activeTab)) {
      setActiveTab("scheduling");
    }
  }, [activeTab]);

  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {
    const loadEmployees = async () => {
      const snap = await getDocs(collection(db, "employees"));
      setEmployees(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    };
    loadEmployees();
  }, []);

  /* ================= LOAD ASSIGNED EMPLOYEES (SINGLE SOURCE OF TRUTH) ================= */

  useEffect(() => {
    if (!safeJobId) return;

    const unsub = onSnapshot(
      collection(db, "jobs", safeJobId, "assignments"),
      async (snap) => {
        if (snap.empty) {
          setAssignedEmployees([]);
          return;
        }

        const assignmentDocs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // 🔹 Unique employee IDs
        const employeeIds = Array.from(
          new Set(assignmentDocs.map((a) => String(a.employeeId)))
        );

        if (employeeIds.length === 0) {
          setAssignedEmployees([]);
          return;
        }

        const empQuery = query(
          collection(db, "employees"),
          where("__name__", "in", employeeIds.slice(0, 10))
        );

        const empSnap = await getDocs(empQuery);

        const employeesMap = new Map(
          empSnap.docs.map((d) => [d.id, d.data() as any])
        );

        const list: AssignedEmployee[] = assignmentDocs.map((a) => {
          const emp = employeesMap.get(String(a.employeeId));

          const hours =
            a.start && a.end
              ? Math.round(
                  (new Date(a.end).getTime() - new Date(a.start).getTime()) /
                    (1000 * 60 * 60)
                )
              : 0;

          return {
            employeeId: String(a.employeeId),
            name:
              emp?.name ||
              emp?.fullName ||
              emp?.displayName ||
              "Unnamed employee",
            schedules: [
              {
                start: a.start ?? null,
                end: a.end ?? null,
                hours,
              },
            ],
            labour: {
              enteredHours: 0,
              completed: false,
            },
          };
        });

        setAssignedEmployees(list);
      }
    );

    return () => unsub();
  }, [safeJobId]);

  /* ================= ASSIGN ================= */
  const handleAssign = async () => {
    if (!selectedEmployee) return;

    await setDoc(
      doc(db, "jobs", safeJobId, "assignments", selectedEmployee),
      {
        employeeId: selectedEmployee,
        start: null,
        end: null,
        createdAt: new Date(),
      },
      { merge: true }
    );

    setSelectedEmployee("");
  };

  /* ================= UNASSIGN ================= */

  const handleUnassignEmployee = async (employeeId: string) => {
    await deleteDoc(doc(db, "jobs", safeJobId, "assignments", employeeId));
  };

  /* ================= RENDER ================= */

  return (
    <div className={styles.wrapper}>
      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "scheduling" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("scheduling")}
        >
          Scheduling
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "labour" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("labour")}
        >
          Labour
        </button>
      </div>

      {/* CARD */}
      <div className={styles.card}>
        <h3 className={styles.title}>Assignment & Scheduling</h3>

        {/* ASSIGN ROW */}
        <div className={styles.assignRow}>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className={styles.select}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name ||
                  emp.fullName ||
                  emp.displayName ||
                  `Employee ${emp.id}`}
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
            onClick={() => {
              navigate(
                `/dashboard/calendar?mode=schedule&jobId=${jobId}&employeeId=${selectedEmployee}`
              );
            }}
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
