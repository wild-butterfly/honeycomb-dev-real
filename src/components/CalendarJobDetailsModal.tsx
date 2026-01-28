// Created by Honeycomb © 2025
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CalendarJobDetailsModal.module.css";
import type { CalendarJob, Employee, Assignment } from "../pages/CalendarPage";
import { useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { toLocalISOString } from "../utils/date";
import ConfirmModal from "./ConfirmModal";

interface Props {
  job?: CalendarJob;
  mode: "view" | "new";

  selectedDate: Date;

  draft?: {
    start: Date;
    end: Date;
    employeeId?: number;
  };
  employees: Employee[];
  onClose: () => void;
  onDelete?: () => void;
  onSave: (job: CalendarJob) => void;
  onStartSchedule?: (jobId: string, employeeId: number) => void;
  onAddEmployee?: (jobId: string, employeeId: number) => Promise<void>;
}

/* ================= CONTACT PARSER ================= */

function parseContactBlock(raw: string) {
  if (!raw.trim())
    return { name: "", emails: [] as string[], phones: [] as string[] };

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

function renderContactCard(rawText: string) {
  const { name, emails, phones } = parseContactBlock(rawText);
  if (!rawText.trim()) return <div className={styles.sectionValue}>—</div>;

  return (
    <div className={styles.contactCard}>
      {name && (
        <div className={styles.contactLine}>
          <UserIcon className={styles.contactIcon} />
          <span className={styles.contactText}>{name}</span>
        </div>
      )}

      {(emails ?? []).map((mail, i) => (
        <div key={i} className={styles.contactLine}>
          <EnvelopeIcon className={styles.contactIcon} />
          <a href={`mailto:${mail}`} className={styles.contactLink}>
            {mail}
          </a>
        </div>
      ))}

      {(phones ?? []).map((phone, i) => (
        <div key={i} className={styles.contactLine}>
          <PhoneIcon className={styles.contactIcon} />
          <a
            href={`tel:${phone.replace(/\D+/g, "")}`}
            className={styles.contactLink}
          >
            {phone}
          </a>
        </div>
      ))}
    </div>
  );
}

/* ================= DATE FORMAT (TIME REMOVED) ================= */

// ✅ Safe ISO for Date (kept because used by upsertAssignment)
const safeISO = (d?: Date | null) =>
  d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : "";

// ✅ Safe: convert any Firestore-ish date value to a valid ISO string (or "")
function toISOFromAny(value: any): string {
  try {
    if (!value) return "";

    if (value instanceof Date) return safeISO(value);

    if (typeof value?.toDate === "function") {
      return safeISO(value.toDate());
    }

    if (typeof value === "object" && typeof value.seconds === "number") {
      const ms =
        value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6);
      return safeISO(new Date(ms));
    }

    if (typeof value === "number") return safeISO(new Date(value));
    if (typeof value === "string") return safeISO(new Date(value));

    return safeISO(new Date(String(value)));
  } catch {
    return "";
  }
}
/* ================= COMPONENT ================= */

const CalendarJobDetailsModal: React.FC<Props> = ({
  job,
  mode,
  selectedDate,
  draft,
  employees,
  onClose,
  onDelete,
  onSave,
  onStartSchedule,
}) => {
  const navigate = useNavigate();

  const isNew = mode === "new";

  const activeJob: CalendarJob = useMemo(() => {
    if (!isNew && job) return job;

    return {
      id: "new",
      title: "",
      customer: "",
      status: "active",
      color: "#fff9e6",
      location: "",
      siteContact: "",
      contactInfo: "",
      notes: "",
      assignments: [],
    };
  }, [isNew, job]);

  /* ================= UI STATE ================= */

  const [editMode, setEditMode] = useState(false);

  // Job fields
  const [title, setTitle] = useState(activeJob.title);
  const [customer, setCustomer] = useState(activeJob.customer);
  const [location, setLocation] = useState(activeJob.location || "");
  const [siteContact, setSiteContact] = useState(activeJob.siteContact || "");
  const [contactInfo, setContactInfo] = useState(activeJob.contactInfo || "");
  const [notes, setNotes] = useState(activeJob.notes || "");
  const [jobColor, setJobColor] = useState(activeJob.color || "#fff9e6");
  const [status, setStatus] = useState<
    "active" | "completed" | "return" | "quote"
  >(activeJob.status || "active");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ================= ASSIGNMENTS (SOURCE OF TRUTH = FIRESTORE) ================= */
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // 🔥 Which employee is currently being edited
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
    null,
  );

  // ================= ASSIGNMENTS BY EMPLOYEE =================
  // employeeId -> assignment[] map
  const assignmentsByEmployee = useMemo(() => {
    const map = new Map<number, Assignment[]>();

    for (const a of assignments) {
      if (!map.has(a.employeeId)) {
        map.set(a.employeeId, []);
      }
      map.get(a.employeeId)!.push(a);
    }

    return map;
  }, [assignments]);

  /* ================= CONTACT PARSE ================= */

  const [contactInfoName, setContactInfoName] = useState("");
  const [contactInfoEmails, setContactInfoEmails] = useState<string[]>([]);
  const [contactInfoPhones, setContactInfoPhones] = useState<string[]>([]);

  useEffect(() => {
    const p = parseContactBlock(contactInfo);
    setContactInfoName(p.name);
    setContactInfoEmails(p.emails);
    setContactInfoPhones(p.phones);
  }, [contactInfo]);

  /* ================= STAFF PICKER ================= */

  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  const openStaffPicker = () => {
    if (!addBtnRef.current) return;
    const rect = addBtnRef.current.getBoundingClientRect();
    setPickerPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 260),
    });
    setShowStaffPicker(true);
  };

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        addBtnRef.current &&
        !addBtnRef.current.contains(e.target as Node)
      ) {
        setShowStaffPicker(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ================= FIRESTORE LIVE ASSIGNMENTS ================= */

  useEffect(() => {
    if (!activeJob?.id || activeJob.id === "new") {
      setAssignments([]);
      setAssignmentsLoaded(true);
      setEditingEmployeeId(null);
      return;
    }

    setAssignments([]);
    setAssignmentsLoaded(false);
    setEditingEmployeeId(null);

    const ref = collection(db, "jobs", String(activeJob.id), "assignments");

    const unsub = onSnapshot(ref, (snap) => {
      const list: Assignment[] = snap.docs.map((d) => {
        const data = d.data() as any;

        return {
          id: d.id,
          employeeId: Number(data.employeeId),
          start: toISOFromAny(data.start),
          end: toISOFromAny(data.end),
          scheduled: data.scheduled !== false,
        };
      });

      setAssignments(list);
      setAssignmentsLoaded(true);

      if (list.length > 0 && editingEmployeeId == null) {
        setEditingEmployeeId(list[0].employeeId);
      }
    });

    return () => unsub();
  }, [activeJob?.id]);

  /* ================= JOB CHANGE RESET ================= */

  useEffect(() => {
    setEditMode(false);

    setTitle(activeJob.title);
    setCustomer(activeJob.customer);
    setLocation(activeJob.location || "");
    setSiteContact(activeJob.siteContact || "");
    setContactInfo(activeJob.contactInfo || "");
    setNotes(activeJob.notes || "");
    setJobColor(activeJob.color || "#fff9e6");
    setStatus(activeJob.status || "active");
  }, [job]);

  // Helpers
  const assignedTo = useMemo(
    () => assignments.map((a) => a.employeeId),
    [assignments],
  );

  const openMap = (address: string) => {
    const encoded = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `https://maps.apple.com/?q=${encoded}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    window.open(url, "_blank");
  };

  const upsertAssignment = async (
    employeeId: number,
    start: Date,
    end: Date,
  ) => {
    if (!activeJob?.id || activeJob.id === "new") return;

    // 🔒 DAY-SAFE assignment id
    const dayKey = toLocalISOString(start).slice(0, 10);
    const assignmentId = `${employeeId}_${dayKey}`;

    const aRef = doc(
      db,
      "jobs",
      String(activeJob.id),
      "assignments",
      assignmentId,
    );

    await setDoc(
      aRef,
      {
        employeeId,
        start: toLocalISOString(start),
        end: toLocalISOString(end),
        scheduled: true,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
  };

  const handleSaveClick = async () => {
    const combined = [
      contactInfoName,
      ...contactInfoEmails,
      ...contactInfoPhones,
    ]
      .filter(Boolean)
      .join("\n");

    // 1) update base job fields (no start/end, no assignedTo)
    await updateDoc(doc(db, "jobs", String(activeJob.id)), {
      title,
      customer,
      location,
      siteContact,
      contactInfo: combined,
      notes,
      color: jobColor,
      status,
    });

    // 2) update local state for CalendarPage (TIME REMOVED => assignments unchanged)
    const updatedLocal: CalendarJob = {
      ...activeJob,
      title,
      customer,
      location,
      siteContact,
      contactInfo,
      notes,
      color: jobColor,
      status,
      assignments,
    };

    onSave(updatedLocal);
    setEditMode(false);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        {/* HEADER – only X */}
        <div className={styles.modalTop}>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        {/* TITLE INPUT – After X */}
        <div className={styles.titleSection}>
          <input
            className={styles.titleInput}
            value={title}
            placeholder="Job title (e.g. A1TT-28419a Test & Tag)"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* CUSTOMER */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>CUSTOMER</div>

          {editMode ? (
            <input
              className={styles.fieldInput}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer name"
            />
          ) : (
            <div className={styles.sectionValue}>{customer || "—"}</div>
          )}
        </div>

        {/* LOCATION */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>SITE ADDRESS</div>

          {editMode ? (
            <input
              className={styles.fieldInput}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter site address"
            />
          ) : location ? (
            <div
              className={styles.siteAddressLink}
              onClick={() => openMap(location)}
            >
              <MapPinIcon className={styles.contactIcon} />
              <span>{location}</span>
            </div>
          ) : (
            <div className={styles.sectionValue}>—</div>
          )}
        </div>

        {/* STAFF */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>ASSIGNED STAFF</div>

          <div className={styles.staffContainer}>
            {!assignmentsLoaded ? (
              <div style={{ opacity: 0.6, fontSize: 13 }}>
                Loading assigned staff…
              </div>
            ) : (
              <>
                {Array.from(assignmentsByEmployee.entries()).map(
                  ([employeeId, empAssignments]) => {
                    const emp = employees.find((e) => e.id === employeeId);
                    if (!emp) return null;

                    return (
                      <div
                        key={`staff-${employeeId}`}
                        className={styles.staffChip}
                        onClick={() => {
                          if (!editMode) return;
                          setEditingEmployeeId(employeeId);
                        }}
                      >
                        <div className={styles.staffAvatar2}>
                          {emp.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <span className={styles.staffName}>{emp.name}</span>

                        {editMode && (
                          <button
                            type="button"
                            className={styles.removeX}
                            aria-label={`Remove ${emp.name}`}
                            onClick={async (e) => {
                              e.stopPropagation();

                              await Promise.all(
                                empAssignments.map((a: Assignment) =>
                                  deleteDoc(
                                    doc(
                                      db,
                                      "jobs",
                                      String(activeJob.id),
                                      "assignments",
                                      String(a.id),
                                    ),
                                  ),
                                ),
                              );

                              if (editingEmployeeId === employeeId) {
                                setEditingEmployeeId(null);
                              }
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
                    onClick={openStaffPicker}
                    type="button"
                    aria-label="Add staff"
                  >
                    +
                  </button>
                )}
              </>
            )}
          </div>

          {/* STAFF PICKER POPUP */}
          {editMode && showStaffPicker && (
            <div
              ref={popupRef}
              className={styles.staffPickerPopup}
              style={{
                position: "fixed",
                top: pickerPos.top,
                left: pickerPos.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {employees.map((emp) => {
                const isSelected = assignmentsByEmployee.has(emp.id);

                return (
                  <div
                    key={`picker-${emp.id}`}
                    className={`${styles.staffPickerItem} ${
                      isSelected ? styles.staffSelected : ""
                    }`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isSelected) return;

                      const baseDate = new Date(selectedDate);
                      baseDate.setHours(0, 0, 0, 0);

                      const start = new Date(baseDate);
                      start.setHours(9, 0, 0, 0);

                      const end = new Date(baseDate);
                      end.setHours(17, 0, 0, 0);

                      await upsertAssignment(emp.id, start, end);

                      setEditingEmployeeId(emp.id);
                      setShowStaffPicker(false);
                    }}
                  >
                    {emp.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SITE CONTACT */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>SITE CONTACT</div>
          {editMode ? (
            <input
              className={styles.fieldInput}
              value={siteContact}
              onChange={(e) => setSiteContact(e.target.value)}
            />
          ) : (
            renderContactCard(siteContact)
          )}
        </div>

        {/* CONTACT INFO */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>CONTACT INFO</div>

          {editMode ? (
            <div className={styles.contactInputsWrapper}>
              <input
                type="text"
                placeholder="Name"
                className={styles.fieldInput}
                value={contactInfoName}
                onChange={(e) => setContactInfoName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email(s) comma separated"
                className={styles.fieldInput}
                value={contactInfoEmails.join(", ")}
                onChange={(e) =>
                  setContactInfoEmails(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
              <input
                type="tel"
                placeholder="Phone(s) comma separated"
                className={styles.fieldInput}
                value={contactInfoPhones.join(", ")}
                onChange={(e) =>
                  setContactInfoPhones(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
          ) : (
            renderContactCard(
              `${contactInfoName}\n${contactInfoEmails.join(
                "\n",
              )}\n${contactInfoPhones.join("\n")}`.trim(),
            )
          )}
        </div>

        {/* NOTES */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>NOTES</div>
          {editMode ? (
            <textarea
              className={styles.fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{notes || "—"}</div>
          )}
        </div>

        {/* STATUS */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>STATUS</div>

          {editMode ? (
            <select
              className={styles.statusSelect}
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "active" | "completed" | "return" | "quote",
                )
              }
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="return">Need to Return</option>
              <option value="quote">Quote / Estimate</option>
            </select>
          ) : (
            <div className={styles.sectionValue}>
              {status === "active" && "Active"}
              {status === "completed" && "Completed"}
              {status === "return" && "Need to Return"}
              {status === "quote" && "Quote Requested"}
            </div>
          )}
        </div>

        {/* COLOR */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>EVENT COLOR</div>

          {editMode ? (
            <div className={styles.colorPickerWrapper}>
              <HexColorPicker color={jobColor} onChange={setJobColor} />
              <div className={styles.colorValue}>{jobColor}</div>
            </div>
          ) : (
            <div
              className={styles.colorPreview}
              style={{
                backgroundColor: jobColor,
                width: "40px",
                height: "20px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          )}
        </div>

        {/* VIEW JOB */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>ACTIONS</div>
          <div className={styles.relatedRow}>
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate(`/jobs/${activeJob.id}`)}
            >
              View Job →
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          {editMode ? (
            <>
              <button
                className={styles.secondaryBtn}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
              <button className={styles.primaryBtn} onClick={handleSaveClick}>
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.deleteBtn}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete event
              </button>
              <button
                className={styles.primaryBtn}
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
            description={
              <>
                This will permanently delete this event from the system.
                <br />
                This action cannot be undone.
              </>
            }
            confirmText="Delete event"
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={async () => {
              if (!onDelete) return;

              await onDelete();
              setShowDeleteConfirm(false);
              onClose?.();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarJobDetailsModal;
