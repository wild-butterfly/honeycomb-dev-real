// src/pages/JobPage.tsx
// Created by Honeycomb © 2025

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import styles from "./JobPage.module.css";
import LeftSidebar from "../components/LeftSidebar";
import AssignmentSchedulingSection from "../components/AssignmentSchedulingSection";
import LabourTimeEntrySection from "../components/LabourTimeEntrySection";

import { apiGet, apiPut } from "../services/api";

/* ================= TYPES ================= */
interface JobDoc {
  id: string;
  title?: string;
  notes?: string;
}

type TabType = "scheduling" | "labour";

type AssignmentRange = {
  start_time: string;
  end_time: string;
};

/* ================= COMPONENT ================= */
const JobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<JobDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>("scheduling");

  /* 🔑 ACTIVE ASSIGNMENT (SOURCE OF TRUTH) */
  const [activeAssignment, setActiveAssignment] =
    useState<AssignmentRange | null>(null);

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
      } catch (err) {
        console.error("Failed to load job:", err);
        setJob(null);
      }

      setLoading(false);
    };

    loadJob();
  }, [id]);

  /* ================= SAVE NOTES ================= */
  const handleSaveNotes = async () => {
    if (!id) return;

    setSavingNotes(true);
    await apiPut(`/jobs/${id}`, { notes: notesDraft });
    setJob((prev) => (prev ? { ...prev, notes: notesDraft } : prev));
    setSavingNotes(false);
    setIsEditingNotes(false);
  };

  /* ================= UI STATES ================= */
  if (loading) return <div className={styles.pageWrapper}>Loading…</div>;
  if (!job) return <div className={styles.pageWrapper}>Job not found</div>;

  /* ================= UI ================= */
  return (
    <div className={styles.pageWrapper}>
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
              <AssignmentSchedulingSection
                jobId={Number(job.id)}
                onSelectAssignment={(range) => {
                  setActiveAssignment(range);
                  setActiveTab("labour");
                }}
              />
            )}

            {/* LABOUR */}
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
