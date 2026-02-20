// Created by Honeycomb © 2025

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import styles from "./CalendarJobDetailsModal.module.css";
import { useNavigate } from "react-router-dom";
import type { CalendarJob, Employee, Assignment } from "../types/calendar";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";
import ConfirmModal from "./ConfirmModal";

import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

/* ================= CONTACT PARSER ================= */

function parseContactBlock(raw: string) {
  if (!raw?.trim()) return { name: "", emails: [], phones: [] };

  const lines = raw.split("\n").map((l) => l.trim());
  const emails: string[] = [];
  const phones: string[] = [];
  let name = "";

  lines.forEach((line) => {
    if (!name && line && !line.includes("@") && !/\d/.test(line)) name = line;
    if (line.includes("@")) emails.push(line);
    if (/^\+?\d[\d\s()-]{5,}\d$/.test(line)) phones.push(line);
  });

  return { name, emails, phones };
}

/*==================LOCAL TIME HELPER=================*/
function toLocalSqlTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
}
/* ================= PROPS ================= */

interface Props {
  job: CalendarJob;
  employees: Employee[];
  focusedAssignmentId?: number | null;
  onClose: () => void;
  onSave: (job: CalendarJob) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onAssignmentsChanged?: () => Promise<void> | void;
}
/* ================= COMPONENT ================= */

const CalendarJobDetailsModal: React.FC<Props> = ({
  job,
  employees,
  onClose,
  onSave,
  onDelete,
  onAssignmentsChanged,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  // 🔒 ACTIVE JOB GUARD (race condition fix)
  const activeJobIdRef = useRef<number | null>(null);

  const navigate = useNavigate();
  /* ================= STATE ================= */

  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(job.title ?? "");
  const [client, setClient] = useState(job.client ?? "");
  const [address, setAddress] = useState(job.address ?? "");
  const [notes, setNotes] = useState(job.notes ?? "");
  const [color, setColor] = useState(job.color ?? "#fff9e6");

  type UIStatus = "active" | "completed" | "return" | "quote";
  const [status, setStatus] = useState<UIStatus>(
    job.status === "completed" ||
      job.status === "return" ||
      job.status === "quote"
      ? job.status
      : "active",
  );

  /* ASSIGNMENTS */
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  /* DATE / TIME (READ ONLY, FROM ASSIGNMENTS) */
  const primaryAssignment = assignments[0];

  const startDate = useMemo(() => {
    return primaryAssignment?.start ? new Date(primaryAssignment.start) : null;
  }, [primaryAssignment]);

  const endDate = useMemo(() => {
    return primaryAssignment?.end ? new Date(primaryAssignment.end) : null;
  }, [primaryAssignment]);

  const formattedDate = useMemo(() => {
    if (!startDate) return "—";
    return startDate.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [startDate]);

  const formattedTimeRange = useMemo(() => {
    if (!startDate || !endDate) return "—";
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
      });

    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }, [startDate, endDate]);

  const durationHours = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  }, [startDate, endDate]);

  /* CONTACT INFO */
  const [contactName, setContactName] = useState("");
  const [contactEmails, setContactEmails] = useState<string[]>([]);
  const [contactPhones, setContactPhones] = useState<string[]>([]);

  /* ASSIGNMENTS */

  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>();

  /* ================= INIT ================= */
  useEffect(() => {
    setContactName(job.contact_name ?? "");
    setContactEmails(job.contact_email ? [job.contact_email] : []);
    setContactPhones(job.contact_phone ? [job.contact_phone] : []);
  }, [job.id]);

  /* ================= LOAD ASSIGNMENTS ================= */

  const loadAssignments = async () => {
    const jobId = Number(job.id);
    activeJobIdRef.current = jobId;

    setLoadingAssignments(true);
    try {
      const data = await apiGet<any[]>(`/assignments?job_id=${jobId}`);

      if (activeJobIdRef.current !== jobId) return;

      setAssignments(
        (data ?? []).map((a) => ({
          id: Number(a.id),
          employee_id: Number(a.employee_id),
          start: new Date(a.start_time.replace(" ", "T")),
          end: new Date(a.end_time),
          completed: Boolean(a.completed),
        })),
      );
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    setAssignments([]);
    loadAssignments();
  }, [job.id]);
  /* ================= MAP BY EMPLOYEE ================= */

  const assignmentsByEmployee = useMemo(() => {
    const map = new Map<number, Assignment[]>();

    assignments.forEach((a) => {
      if (!map.has(a.employee_id)) {
        map.set(a.employee_id, []);
      }
      map.get(a.employee_id)!.push(a);
    });

    return map;
  }, [assignments]);

  const derivedStatus = useMemo(() => {
    if (!assignments.length) return "active";
    return assignments.every((a) => a.completed) ? "completed" : "active";
  }, [assignments]);

  /* ================= STAFF ACTIONS ================= */

  const addEmployee = async (employeeId: number) => {
    const baseStart = assignments[0]?.start
      ? new Date(assignments[0].start)
      : new Date();

    const start = baseStart;
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await apiPost("/assignments", {
      job_id: job.id,
      employee_id: employeeId,
      start_time: toLocalSqlTime(start),
      end_time: toLocalSqlTime(end),
    });

    await loadAssignments();
    await onAssignmentsChanged?.();
  };

  const removeAssignment = async (assignmentId: number) => {
    await apiDelete(`/assignments/${assignmentId}`);
    await loadAssignments();
    await onAssignmentsChanged?.();
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    await onSave({
      ...job,
      title,
      client,
      address,
      notes,
      status,
      color,

      contact_name: contactName || null,
      contact_email: contactEmails[0] || null,
      contact_phone: contactPhones[0] || null,

      assignments,
    });

    setEditMode(false);
  };

  const handleViewJob = () => {
    onClose();
    navigate(`/dashboard/jobs/${job.id}`);
  };

  /* ================= RENDER ================= */

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      onClick={(e) => {
        if (editMode) return;
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className={styles.modalTop}>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* DATE & TIME SUMMARY */}
        <div className={styles.dateTimeBlock}>
          <div className={styles.dateText}>{formattedDate}</div>

          <div className={styles.timeRow}>
            <span className={styles.timeRange}>{formattedTimeRange}</span>

            <span className={styles.durationBadge}>{durationHours}h</span>
          </div>
        </div>

        {/* TITLE */}
        <div className={styles.titleSection}>
          {editMode ? (
            <input
              className={`${styles.fieldInput} ${styles.titleField}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              autoFocus
            />
          ) : (
            <div className={styles.titleDisplay}>{title || "Untitled job"}</div>
          )}
        </div>

        {/* CUSTOMER */}
        <Section label="CUSTOMER">
          {editMode ? (
            <input
              className={styles.fieldInput}
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          ) : (
            <Value>{client}</Value>
          )}
        </Section>

        {/* SITE ADDRESS */}
        <Section label="SITE ADDRESS">
          {editMode ? (
            <input
              className={styles.fieldInput}
              placeholder="Street address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          ) : address ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconRow}
            >
              <MapPinIcon className={styles.icon} />
              <span>{address}</span>
            </a>
          ) : (
            <Value>—</Value>
          )}
        </Section>

        {/* SITE CONTACT */}
        <Section label="SITE CONTACT">
          {editMode ? (
            <div className={styles.contactEdit}>
              <input
                className={styles.fieldInput}
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <input
                className={styles.fieldInput}
                placeholder="Email"
                value={contactEmails[0] ?? ""}
                onChange={(e) =>
                  setContactEmails(e.target.value ? [e.target.value] : [])
                }
              />

              <input
                className={styles.fieldInput}
                placeholder="Phone"
                value={contactPhones[0] ?? ""}
                onChange={(e) =>
                  setContactPhones(e.target.value ? [e.target.value] : [])
                }
              />
            </div>
          ) : (
            <div className={styles.contactBlock}>
              {contactName && (
                <div className={styles.iconRow}>
                  <UserIcon className={styles.icon} />
                  <span>{contactName}</span>
                </div>
              )}

              {contactEmails[0] && (
                <a
                  href={`mailto:${contactEmails[0]}`}
                  className={styles.iconRow}
                >
                  <EnvelopeIcon className={styles.icon} />
                  <span>{contactEmails[0]}</span>
                </a>
              )}

              {contactPhones[0] && (
                <a href={`tel:${contactPhones[0]}`} className={styles.iconRow}>
                  <PhoneIcon className={styles.icon} />
                  <span>{contactPhones[0]}</span>
                </a>
              )}

              {!contactName && !contactEmails[0] && !contactPhones[0] && (
                <Value>—</Value>
              )}
            </div>
          )}
        </Section>

        {/* NOTES */}
        <Section label="NOTES">
          {editMode ? (
            <textarea
              className={styles.fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          ) : (
            <Value>{notes}</Value>
          )}
        </Section>

        {/* ASSIGNED STAFF */}
        <Section label="ASSIGNED STAFF">
          <div className={styles.staffContainer}>
            {Array.from(assignmentsByEmployee.entries()).map(
              ([empId, list]) => {
                const emp = employees.find((e) => e.id === empId);
                if (!emp) return null;

                const initials = emp.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={empId}
                    className={styles.staffChip}
                    title={emp.name} // 👈 hover tooltip
                  >
                    <div className={styles.staffAvatar2}>{initials}</div>

                    {editMode && (
                      <button
                        className={styles.removeX}
                        onClick={() => {
                          const first = list[0];
                          if (first) removeAssignment(first.id);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              },
            )}

            {editMode && (
              <button
                ref={addBtnRef}
                className={styles.staffAddChip}
                onClick={() => {
                  const r = addBtnRef.current?.getBoundingClientRect();
                  if (!r) return;

                  const PICKER_HEIGHT = 280; // CSS ile uyumlu
                  const PICKER_WIDTH = 260;
                  const MARGIN = 12;

                  const viewportHeight = window.innerHeight;

                  // ➕ butonun dikey ortası
                  const buttonCenterY = r.top + r.height / 2;

                  let top: number;

                  // Alt tarafa sığmıyorsa yukarı kaydır
                  if (
                    buttonCenterY + PICKER_HEIGHT / 2 >
                    viewportHeight - MARGIN
                  ) {
                    top = viewportHeight - PICKER_HEIGHT - MARGIN;
                  }
                  // Üst tarafa taşıyorsa aşağı kaydır
                  else if (buttonCenterY - PICKER_HEIGHT / 2 < MARGIN) {
                    top = MARGIN;
                  }
                  // 🎯 Butonun orta üstüne hizala
                  else {
                    top = buttonCenterY - PICKER_HEIGHT / 2;
                  }

                  let left = r.left + r.width / 2 - PICKER_WIDTH / 2;
                  left = Math.max(MARGIN, left);

                  setPickerPos({ top, left });
                  setShowStaffPicker(true);
                }}
              >
                +
              </button>
            )}
          </div>
        </Section>

        {/* STATUS */}
        <Section label="STATUS">
          {editMode ? (
            <select
              className={styles.statusSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as UIStatus)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="return">Need to Return</option>
              <option value="quote">Quote</option>
            </select>
          ) : (
            <Value>
              {derivedStatus
                ? derivedStatus.charAt(0).toUpperCase() + derivedStatus.slice(1)
                : "—"}
            </Value>
          )}
        </Section>

        {/* COLOR */}
        <Section label="EVENT COLOR">
          {editMode ? (
            <HexColorPicker color={color} onChange={setColor} />
          ) : (
            <div
              className={styles.colorPreview}
              style={{ background: color }}
            />
          )}
        </Section>

        <Section label="ACTIONS">
          <button
            className={`${styles.btnBase} ${styles.primaryBtn}`}
            onClick={handleViewJob}
          >
            View Job →
          </button>
        </Section>

        {/* FOOTER */}
        <div className={styles.footer}>
          {editMode ? (
            <>
              <button
                className={`${styles.btnBase} ${styles.cancelBtn}`}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>

              <button
                className={`${styles.btnBase} ${styles.saveBtn}`}
                onClick={handleSave}
              >
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                className={`${styles.btnBase} ${styles.deleteBtn}`}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete event
              </button>

              <button
                className={`${styles.btnBase} ${styles.primaryBtn}`}
                onClick={() => setEditMode(true)}
              >
                Edit event
              </button>
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <ConfirmModal
            title="Delete this event?"
            description="This action cannot be undone."
            confirmText="Delete event"
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={async () => {
              await onDelete(Number(job.id));
              setShowDeleteConfirm(false);
              onClose();
            }}
          />
        )}
      </div>

      {/* STAFF PICKER */}
      {showStaffPicker &&
        createPortal(
          <>
            {/* BACKDROP */}
            <div
              className={styles.staffPickerBackdrop}
              onClick={() => setShowStaffPicker(false)}
            />

            {/* PICKER */}
            <div
              className={styles.staffPicker}
              style={
                pickerPos
                  ? {
                      top: pickerPos.top,
                      left: pickerPos.left,
                    }
                  : { visibility: "hidden" }
              }
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.staffPickerHeader}>Assign staff</div>

              <div className={styles.staffPickerList}>
                {employees.map((emp) => {
                  const assigned = assignmentsByEmployee.has(emp.id);

                  const initials = emp.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      className={`${styles.staffPickerItem} ${
                        assigned ? styles.staffPickerItemSelected : ""
                      }`}
                      onClick={() => {
                        if (assigned) {
                          // 🔁 REMOVE (toggle off)
                          const list = assignmentsByEmployee.get(emp.id);
                          if (list?.[0]) {
                            removeAssignment(list[0].id);
                          }
                        } else {
                          // ➕ ADD (toggle on)
                          addEmployee(emp.id);
                        }
                      }}
                    >
                      <div className={styles.staffPickerLeft}>
                        <div className={styles.staffPickerAvatar}>
                          {initials}
                        </div>
                        <span className={styles.staffPickerName}>
                          {emp.name}
                        </span>
                      </div>

                      {assigned && (
                        <span className={styles.staffPickerCheck}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                className={styles.staffPickerClose}
                onClick={() => setShowStaffPicker(false)}
              >
                Close
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

/* ================= HELPERS ================= */

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className={styles.section}>
    <div className={styles.sectionLabel}>{label}</div>
    {children}
  </div>
);

const Value: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={styles.sectionValue}>{children || "—"}</div>
);

export default CalendarJobDetailsModal;
