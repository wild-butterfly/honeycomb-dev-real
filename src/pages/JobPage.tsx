// src/pages/JobPage.tsx
// Created by Honeycomb © 2025

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./JobPage.module.css";
import Toast from "../components/Toast";
import LeftSidebar from "../components/LeftSidebar";

import LabourTimeEntrySection from "../components/LabourTimeSection";
import JobAssignedEmployeesSection from "../components/JobAssignedEmployeesSection";
import AssigneeFilterBar from "../components/AssigneeFilterBar";

import type { Assignment, Employee } from "../types/calendar";
import { apiGet, apiPut, apiDelete } from "../services/api";

/* ================= TYPES ================= */

interface JobDoc {
  id: string;
  title?: string;
  notes?: string;
  assignees?: {
    employee_id: number;
    name: string;
  }[];
}

type TabType = "scheduling" | "labour";

type AssignmentRange = {
  start: Date;
  end: Date;
};

/* ================= COMPONENT ================= */

const JobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedAssignee, setSelectedAssignee] = useState<number | "all">(
    "all",
  );
  const [job, setJob] = useState<JobDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>("scheduling");

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignees, setAssignees] = useState<Employee[]>([]);

  /* 🔑 ACTIVE ASSIGNMENT (SOURCE OF TRUTH) */
  const [activeAssignment, setActiveAssignment] =
    useState<AssignmentRange | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  /* ================= NOTES ================= */

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  /* ================= LOAD JOB ================= */

  useEffect(() => {
    if (!id) return;

    const loadJob = async () => {
      try {
        const data = await apiGet<any>(`/jobs/${id}`);
        const resolvedJob: JobDoc | null = data?.job ?? data;

        if (!resolvedJob || !resolvedJob.id) {
          throw new Error("Invalid job response");
        }

        setJob(resolvedJob);

        setAssignees(
          (resolvedJob.assignees ?? []).map((a: any) => ({
            id: Number(a.employee_id),
            name: a.name,
          })),
        );
      } catch (err) {
        console.error("Failed to load job:", err);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  /* ================= LOAD ASSIGNMENTS + EMPLOYEES ================= */

  useEffect(() => {
    if (!id) return;

    const loadRelations = async () => {
      try {
        const [aRes, eRes] = await Promise.all([
          apiGet<any[]>(`/assignments?job_id=${id}`),
          apiGet<Employee[]>(`/employees`),
        ]);

        setAssignments(
          (aRes ?? []).map((a) => ({
            id: Number(a.id),
            employee_id: Number(a.employee_id),
            start: new Date(a.start_time.replace(" ", "T")),
            end: new Date(a.end_time),
            completed: Boolean(a.completed),
          })),
        );

        setEmployees(eRes ?? []);
      } catch (err) {
        console.error("Failed to load assignments/employees", err);
      }
    };

    loadRelations();
  }, [id]);

  useEffect(() => {
    if (assignments.length > 0 && !activeAssignment) {
      setActiveAssignment({
        start: assignments[0].start,
        end: assignments[0].end,
      });
    }
  }, [assignments]);

  /* ================= SAVE NOTES ================= */

  const handleSaveNotes = async () => {
    if (!id) return;

    setSavingNotes(true);
    await apiPut(`/jobs/${id}`, { notes: notesDraft });

    setJob((prev) => (prev ? { ...prev, notes: notesDraft } : prev));
    setSavingNotes(false);
    setIsEditingNotes(false);
  };

  //MARK LABOUR AS COMPLETED FUNCTION

  const handleCompleteAssignments = async (assignmentIds: number[]) => {
    try {
      console.log("Completing assignments:", assignmentIds);

      await apiPut("/assignments/complete", {
        assignmentIds,
      });

      setAssignments((prev) =>
        prev.map((a) =>
          assignmentIds.includes(a.id) ? { ...a, completed: true } : a,
        ),
      );
    } catch (err) {
      console.error("Failed to complete assignments", err);
      alert("Failed to mark labour as completed");
    }
  };

  //MARK AS INCOMPLETED FUCTION
  const handleReopenAssignments = async (assignmentIds: number[]) => {
    try {
      await apiPut("/assignments/reopen", { assignmentIds });

      setAssignments((prev) =>
        prev.map((a) =>
          assignmentIds.includes(a.id) ? { ...a, completed: false } : a,
        ),
      );
    } catch (err) {
      console.error("Failed to reopen assignments", err);
      alert("Failed to reopen labour");
    }
  };

  //DELETE EMPLOYEE FUNCTION

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await apiDelete(`/assignments/${assignmentId}`);

      // 🔥 UI state update
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert("Failed to remove scheduled time");
    }
  };

  //UNASSIGN FUNCTION
  const handleUnassignEmployee = async (employeeId: number) => {
    if (!id) return;

    try {
      await apiPut(`/jobs/${id}/unassign`, {
        employee_id: employeeId,
      });

      // 🔥 UI state update
      setAssignees((prev) => prev.filter((e) => e.id !== employeeId));
    } catch (err) {
      console.error("Failed to unassign employee", err);
      alert("Failed to remove employee from job");
    }
  };

  //ASSIGN JOB
  const handleAssignEmployee = async () => {
    if (!id || selectedAssignee === "all") return;

    try {
      await apiPut(`/jobs/${id}/assign`, {
        employee_id: selectedAssignee,
      });

      const employee = employees.find((e) => e.id === selectedAssignee);
      if (!employee) return;

      setAssignees((prev) => {
        if (prev.some((a) => a.id === employee.id)) return prev;
        return [...prev, employee];
      });

      // ✅ PREMIUM FEEDBACK
      setToast(`${employee.name} assigned to job`);
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Failed to assign employee", err);
      setToast("Failed to assign employee");
      setTimeout(() => setToast(null), 2500);
    }
  };

  //CLONE
  const handleScheduleEmployee = () => {
    if (!id) return;

    const params = new URLSearchParams({
      mode: "clone",
      job: id,
    });

    if (selectedAssignee !== "all") {
      params.set("employee", String(selectedAssignee));
    }

    navigate(`/dashboard/calendar?${params.toString()}`);
  };
  /* ================= UI STATES ================= */

  if (loading) {
    return <div className={styles.pageWrapper}>Loading…</div>;
  }

  if (!job) {
    return <div className={styles.pageWrapper}>Job not found</div>;
  }

  /* ================= UI ================= */

  return (
    <div className={styles.pageWrapper}>
      {toast && <Toast message={toast} />}
      <LeftSidebar />

      <div className={styles.mainCard}>
        {/* HEADER */}
        <div className={styles.pageHeader}>
          <h1>{job.title}</h1>
        </div>

        {/* NOTES */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Job Phase Description</h2>

          <div className={styles.detailBox}>
            {!isEditingNotes ? (
              <div
                className={styles.clickToEdit}
                onClick={() => {
                  setNotesDraft(job.notes || "");
                  setIsEditingNotes(true);
                }}
              >
                {job.notes || (
                  <span style={{ color: "#aaa" }}>Add job phase notes…</span>
                )}
              </div>
            ) : (
              <div className={styles.editBox}>
                <textarea
                  className={styles.textarea}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  autoFocus
                />
                <div className={styles.editActionsInline}>
                  <button
                    className={styles.saveBtn}
                    disabled={savingNotes}
                    onClick={handleSaveNotes}
                  >
                    Save
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => setIsEditingNotes(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className={styles.section}>
          <div className={styles.sectionTabs}>
            <button
              className={
                activeTab === "scheduling"
                  ? styles.sectionTabActive
                  : styles.sectionTab
              }
              onClick={() => setActiveTab("scheduling")}
            >
              Scheduling
            </button>

            <button
              className={
                activeTab === "labour"
                  ? styles.sectionTabActive
                  : styles.sectionTab
              }
              onClick={() => setActiveTab("labour")}
            >
              Labour
            </button>
          </div>

          <div className={styles.sectionContent}>
            {/* SCHEDULING */}
            {activeTab === "scheduling" && (
              <>
                {/* ASSIGNEE FILTER */}
                <AssigneeFilterBar
                  employees={employees.map((e) => ({
                    id: e.id,
                    name: e.name,
                  }))}
                  selectedAssignee={selectedAssignee}
                  onChange={setSelectedAssignee}
                />

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    disabled={selectedAssignee === "all"}
                    onClick={handleAssignEmployee}
                  >
                    Assign
                  </button>

                  <button
                    disabled={selectedAssignee === "all"}
                    onClick={handleScheduleEmployee}
                  >
                    Schedule
                  </button>
                </div>

                {/* EXISTING SECTION – UNCHANGED */}
                <JobAssignedEmployeesSection
                  assignments={assignments}
                  assignees={assignees}
                  employees={employees}
                  onSelectAssignment={(range) => {
                    setActiveAssignment(range);
                    setActiveTab("labour");
                  }}
                  onCompleteAssignments={handleCompleteAssignments}
                  onReopenAssignments={handleReopenAssignments}
                  onDeleteAssignment={handleDeleteAssignment}
                  onUnassignEmployee={handleUnassignEmployee}
                />
              </>
            )}

            {/* ================= LABOUR ================= */}
            {activeTab === "labour" && activeAssignment && (
              <LabourTimeEntrySection
                jobId={Number(job.id)}
                assignment={activeAssignment}
              />
            )}

            {/* GUARD */}
            {activeTab === "labour" && !activeAssignment && (
              <div style={{ padding: 16, color: "#888" }}>
                Select a scheduled time block first
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPage;
