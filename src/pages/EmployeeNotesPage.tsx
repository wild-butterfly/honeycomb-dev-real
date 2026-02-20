// src/pages/EmployeeNotesPage.tsx
// Created by Honeycomb © 2026
// Employee notes - contact changes, special instructions, field observations

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./EmployeeNotesPage.module.css";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { apiGet, apiPost, apiDelete, logout } from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import LeftSidebar from "../components/LeftSidebar";
import Footer from "../components/Footer";

interface EmployeeNote {
  id: number;
  job_id: number;
  employee_id: number;
  employee_name: string;
  note: string;
  created_at: string;
}

const EmployeeNotesPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();

  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await apiGet<EmployeeNote[]>(`/jobs/${jobId}/notes`);
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to load notes", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadNotes();
    }
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!noteInput.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const newNote = await apiPost<EmployeeNote>(`/jobs/${jobId}/notes`, {
        note: noteInput.trim(),
      });

      if (newNote) {
        setNotes((prev) => [newNote, ...prev]);
        setNoteInput("");
      }
    } catch (err) {
      console.error("Failed to create note", err);
      setError("Failed to create note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      await apiDelete(`/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note", err);
      setError("Failed to delete note");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Parse raw YYYY-MM-DD HH:MM:SS format
      const match = dateStr.match(
        /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
      );
      if (!match) return dateStr;

      const [, year, month, day, hour, minute] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
      );

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 60) {
        return diffMins < 1 ? "Just now" : `${diffMins}m ago`;
      }

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours}h ago`;
      }

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      }

      return date.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DashboardNavbar onLogout={logout} />

      <div className={styles.pageWrapper}>
        <LeftSidebar />

        <div className={styles.main}>
          <div className={styles.pageContainer}>
            <div className={styles.card}>
              {/* HEADER */}
              <div className={styles.header}>
                <ChatBubbleLeftRightIcon className={styles.headerIcon} />
                <div className={styles.title}>Employee Notes</div>
              </div>

              <div className={styles.subtitle}>
                Document contact changes, special instructions, or field
                observations
              </div>

              {/* ADD NOTE FORM */}
              <form onSubmit={handleSubmit} className={styles.form}>
                <textarea
                  className={styles.textarea}
                  placeholder="Add a note (e.g., 'Customer requested to call before arrival', 'Gate code: 1234', etc.)"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting || !noteInput.trim()}
                >
                  {submitting ? "Adding..." : "Add Note"}
                </button>
              </form>

              {error && <div className={styles.error}>{error}</div>}

              {/* NOTES LIST */}
              <div className={styles.notesList}>
                {loading && (
                  <div className={styles.empty}>Loading notes...</div>
                )}

                {!loading && notes.length === 0 && (
                  <div className={styles.empty}>
                    No notes yet. Add one above to get started!
                  </div>
                )}

                {notes.map((note) => (
                  <div key={note.id} className={styles.noteItem}>
                    {/* AVATAR + BUBBLE */}
                    <div className={styles.noteRow}>
                      <div className={styles.avatar}>
                        {getInitials(note.employee_name)}
                      </div>

                      <div className={styles.bubbleWrapper}>
                        {/* SPEECH BUBBLE */}
                        <div className={styles.bubble}>
                          <div className={styles.noteContent}>{note.note}</div>
                        </div>

                        {/* FOOTER (NAME + TIME) */}
                        <div className={styles.noteFooter}>
                          <span className={styles.noteName}>
                            {note.employee_name}
                          </span>
                          <span className={styles.noteDot}>•</span>
                          <span className={styles.noteTime}>
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* DELETE BUTTON */}
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(note.id)}
                        title="Delete note"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default EmployeeNotesPage;
