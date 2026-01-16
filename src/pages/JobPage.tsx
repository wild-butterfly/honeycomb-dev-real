// Created by Honeycomb © 2025
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import styles from "./JobPage.module.css";
import LeftSidebar from "../components/LeftSidebar";
import { db } from "../firebase";
import AssignmentSchedulingSection from "../components/AssignmentSchedulingSection";

/* ===================== TYPES ===================== */

interface JobDoc {
  id: string;
  title?: string;
  notes?: string;
}

/* ===================== COMPONENT ===================== */

const JobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<JobDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ EDIT STATES (BURADA OLMALI)
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  /* LOAD JOB */
  useEffect(() => {
    if (!id) return;

    const loadJob = async () => {
      const snap = await getDoc(doc(db, "jobs", id));
      if (snap.exists()) {
        setJob({
          id: snap.id,
          ...(snap.data() as Omit<JobDoc, "id">),
        });
      }
      setLoading(false);
    };

    loadJob();
  }, [id]);

  if (loading) return <div className={styles.pageWrapper}>Loading…</div>;
  if (!job) return <div className={styles.pageWrapper}>Job not found</div>;

  return (
    <div className={styles.pageWrapper}>
      <LeftSidebar />

      <div className={styles.mainCard}>
        {/* HEADER */}
        <div className={styles.pageHeader}>
          <h1>{job.title}</h1>
        </div>

        {/* DESCRIPTION */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Job Phase Description</h2>

          <div className={styles.detailBox}>
            {!isEditingNotes ? (
              <div
                onClick={() => {
                  setNotesDraft(job.notes || "");
                  setIsEditingNotes(true);
                }}
                className={styles.clickToEdit}
              >
                {job.notes || (
                  <span style={{ color: "#aaa" }}>Add job phase notes…</span>
                )}
              </div>
            ) : (
              <div className={styles.editBox}>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  className={styles.textarea}
                  autoFocus
                />

                <div className={styles.editActionsInline}>
                  <button
                    disabled={savingNotes}
                    onClick={async () => {
                      if (!id) return;
                      setSavingNotes(true);

                      await updateDoc(doc(db, "jobs", id), {
                        notes: notesDraft,
                      });

                      setJob((prev) =>
                        prev ? { ...prev, notes: notesDraft } : prev
                      );

                      setSavingNotes(false);
                      setIsEditingNotes(false);
                    }}
                    className={styles.saveBtn}
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ASSIGNMENT & SCHEDULING */}
        <div className={styles.section}>
          <AssignmentSchedulingSection jobId={job.id} />
        </div>
      </div>
    </div>
  );
};

export default JobPage;
