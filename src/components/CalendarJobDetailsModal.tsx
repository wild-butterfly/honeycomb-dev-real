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

import {
  getJobStart,
  getJobEnd,
  getAssignedEmployeeIds,
} from "../utils/jobTime";

interface Props {
  job: CalendarJob;
  employees: Employee[];
  onClose: () => void;
  onDelete: () => void;
  onSave: (job: CalendarJob) => void;
  onStartSchedule: (jobId: string, employeeId: number) => void;
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

/* ================= DATE FORMAT ================= */

// ✅ Safe ISO for Date
const safeISO = (d?: Date | null) =>
  d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : "";

// ✅ Safe: convert any Firestore-ish date value to a valid ISO string (or "")
// handles: ISO string, Date, number(ms), {seconds,nanoseconds}, Firestore Timestamp-like
function toISOFromAny(value: any): string {
  try {
    if (!value) return "";

    // Already a Date
    if (value instanceof Date) return safeISO(value);

    // Firestore Timestamp object (has toDate)
    if (typeof value?.toDate === "function") {
      const d = value.toDate();
      return safeISO(d);
    }

    // { seconds, nanoseconds }
    if (
      typeof value === "object" &&
      typeof value.seconds === "number" &&
      typeof value.nanoseconds === "number"
    ) {
      const ms = value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6);
      const d = new Date(ms);
      return safeISO(d);
    }

    // number (ms)
    if (typeof value === "number") {
      const d = new Date(value);
      return safeISO(d);
    }

    // string
    if (typeof value === "string") {
      // If it's already ISO-ish, new Date should parse it
      const d = new Date(value);
      return safeISO(d);
    }

    // fallback
    const d = new Date(String(value));
    return safeISO(d);
  } catch {
    return "";
  }
}

// ✅ Safe: HH:MM for <input type="time">
const safeTimeValue = (d?: Date | null) => {
  const iso = safeISO(d);
  // input type="time" needs HH:MM
  return iso ? iso.substring(11, 16) : "00:00";
};

// ✅ Safe: validate Date
const isValidDate = (d: any): d is Date =>
  d instanceof Date && !isNaN(d.getTime());

function formatDateLine(start: Date, end: Date) {
  // ✅ Guard: if invalid dates sneak in, don't crash UI
  if (!isValidDate(start) || !isValidDate(end)) {
    return {
      dateLabel: "—",
      timeLabel: "—",
      durationLabel: "—",
    };
  }

  const dateLabel = start.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeLabel =
    start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) +
    " – " +
    end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  return {
    dateLabel,
    timeLabel,
    durationLabel:
      hours && mins ? `${hours}h ${mins}m` : hours ? `${hours}h` : `${mins}m`,
  };
}

/* ================= COMPONENT ================= */

const CalendarJobDetailsModal: React.FC<Props> = ({
  job,
  employees,
  onClose,
  onDelete,
  onSave,
  onStartSchedule,
}) => {
  const navigate = useNavigate();

  /* ================= INITIAL TIME (SAFE) ================= */

  const initialStart = useMemo<Date>(
    () => getJobStart(job) ?? new Date(),
    [job]
  );

  const initialEnd = useMemo<Date>(() => getJobEnd(job) ?? new Date(), [job]);

  /* ================= UI STATE ================= */

  const [editMode, setEditMode] = useState(false);

  // Job fields
  const [title, setTitle] = useState(job.title);
  const [customer, setCustomer] = useState(job.customer);
  const [location, setLocation] = useState(job.location || "");
  const [siteContact, setSiteContact] = useState(job.siteContact || "");
  const [contactInfo, setContactInfo] = useState(job.contactInfo || "");
  const [notes, setNotes] = useState(job.notes || "");
  const [jobColor, setJobColor] = useState(job.color || "#fff9e6");
  const [status, setStatus] = useState<
    "active" | "completed" | "return" | "quote"
  >(job.status || "active");

  /* ================= ASSIGNMENTS (SOURCE OF TRUTH = FIRESTORE) ================= */

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  /* ================= TIME EDIT ================= */

  const [localStart, setLocalStart] = useState<Date>(initialStart);
  const [localEnd, setLocalEnd] = useState<Date>(initialEnd);

  /* ================= COMPUTED LABELS ================= */

  const { dateLabel, timeLabel, durationLabel } = useMemo(
    () => formatDateLine(localStart, localEnd),
    [localStart, localEnd]
  );

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
    if (!job?.id) return;

    const ref = collection(db, "jobs", String(job.id), "assignments");

    const unsub = onSnapshot(ref, (snap) => {
      const list: Assignment[] = snap.docs.map((d) => {
        const data = d.data() as any;

        // ✅ normalize start/end to ISO strings or ""
        const startISO = toISOFromAny(data.start);
        const endISO = toISOFromAny(data.end);

        return {
          id: d.id,
          employeeId: Number(data.employeeId),
          start: startISO,
          end: endISO,
        };
      });

      setAssignments(list);

      // ✅ derive time range from valid assignments only
      // ✅ derive time range from valid assignments only
      const validStarts = list
        .map((a) => (a.start ? new Date(a.start) : null))
        .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()))
        .map((d) => d.getTime());

      const validEnds = list
        .map((a) => (a.end ? new Date(a.end) : null))
        .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()))
        .map((d) => d.getTime());

      if (validStarts.length > 0 && validEnds.length > 0) {
        const newStart = new Date(Math.min(...validStarts));
        const newEnd = new Date(Math.max(...validEnds));

        // ✅ only set if valid (extra safe)
        if (isValidDate(newStart)) setLocalStart(newStart);
        if (isValidDate(newEnd)) setLocalEnd(newEnd);
      }
    });

    return () => unsub();
  }, [job?.id]);

  /* ================= JOB CHANGE RESET ================= */

  useEffect(() => {
    setEditMode(false);

    setTitle(job.title);
    setCustomer(job.customer);
    setLocation(job.location || "");
    setSiteContact(job.siteContact || "");
    setContactInfo(job.contactInfo || "");
    setNotes(job.notes || "");
    setJobColor(job.color || "#fff9e6");
    setStatus(job.status || "active");

    // SAFE fallback
    const s = getJobStart(job) ?? new Date();
    const e = getJobEnd(job) ?? new Date();
    setLocalStart(isValidDate(s) ? s : new Date());
    setLocalEnd(isValidDate(e) ? e : new Date());

    // ❗ assignments BURADA SET EDİLMİYOR
    // çünkü Firestore snapshot source of truth
  }, [job]);

  // Helpers
  const assignedTo = useMemo(
    () => assignments.map((a) => a.employeeId),
    [assignments]
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
    end: Date
  ) => {
    const aRef = doc(
      db,
      "jobs",
      String(job.id),
      "assignments",
      String(employeeId)
    );
    await setDoc(
      aRef,
      {
        employeeId,
        start: safeISO(start),
        end: safeISO(end),
      },
      { merge: true }
    );
  };

  const removeAssignment = async (employeeId: number) => {
    const aRef = doc(
      db,
      "jobs",
      String(job.id),
      "assignments",
      String(employeeId)
    );
    await deleteDoc(aRef);
  };

  const updateAllAssignmentTimes = async (start: Date, end: Date) => {
    // update every assignment doc to new time window
    await Promise.all(
      (assignments ?? []).map((a) => upsertAssignment(a.employeeId, start, end))
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
    await updateDoc(doc(db, "jobs", String(job.id)), {
      title,
      customer,
      location,
      siteContact,
      contactInfo: combined,
      notes,
      color: jobColor,
      status,
    });

    // 2) update assignment times (single window for all)
    await updateAllAssignmentTimes(localStart, localEnd);

    // 3) update local state for CalendarPage
    const updatedLocal: CalendarJob = {
      ...job,
      title,
      customer,
      location,
      siteContact,
      contactInfo: combined,
      notes,
      color: jobColor,
      status,

      // ✅ never call localStart.toISOString() directly
      assignments: assignments.map((a) => ({
        ...a,
        start: safeISO(localStart),
        end: safeISO(localEnd),
      })),
    };

    onSave(updatedLocal);
    setEditMode(false);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        {/* HEADER */}
        <header className={styles.header}>
          <div>
            {editMode ? (
              <input
                className={styles.titleInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            ) : (
              <div className={styles.title}>{title}</div>
            )}
            <div className={styles.subtitle}>{dateLabel}</div>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

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

        {/* TIME */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>TIME</div>

          {editMode ? (
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12 }}>Start</label>
                <input
                  type="time"
                  value={safeTimeValue(localStart)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    const base = isValidDate(localStart)
                      ? localStart
                      : new Date();
                    const d = new Date(base);
                    d.setHours(h, m, 0, 0);
                    setLocalStart(d);
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12 }}>End</label>
                <input
                  type="time"
                  value={safeTimeValue(localEnd)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    const base = isValidDate(localEnd) ? localEnd : new Date();
                    const d = new Date(base);
                    d.setHours(h, m, 0, 0);
                    setLocalEnd(d);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.sectionValue}>{timeLabel}</div>
          )}
        </div>

        {/* STAFF */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>ASSIGNED STAFF</div>

          <div className={styles.staffContainer}>
            {assignedTo.map((id) => {
              const emp = employees.find((e) => e.id === id);
              if (!emp) return null;

              return (
                <div
                  key={id}
                  className={styles.staffChip}
                  onClick={async () => {
                    if (!editMode) return;
                    await removeAssignment(id);
                  }}
                  style={{ cursor: editMode ? "pointer" : "default" }}
                  title={editMode ? "Click to remove" : ""}
                >
                  <div className={styles.staffAvatar2}>
                    {emp.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <span className={styles.staffName}>{emp.name}</span>

                  {editMode && <span className={styles.removeX}>×</span>}
                </div>
              );
            })}

            {/* ADD BUTTON (only in edit mode) */}
            {editMode && (
              <button
                ref={addBtnRef}
                className={styles.staffAddChip}
                onClick={openStaffPicker}
                type="button"
              >
                +
              </button>
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
            >
              {employees.map((emp) => {
                const isSelected = assignedTo.includes(emp.id);

                return (
                  <div
                    key={emp.id}
                    className={`${styles.staffPickerItem} ${
                      isSelected ? styles.staffSelected : ""
                    }`}
                    onClick={() => {
                      onStartSchedule(job.id, emp.id);
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
                      .filter(Boolean)
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
                      .filter(Boolean)
                  )
                }
              />
            </div>
          ) : (
            renderContactCard(
              `${contactInfoName}\n${contactInfoEmails.join(
                "\n"
              )}\n${contactInfoPhones.join("\n")}`.trim()
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
                  e.target.value as "active" | "completed" | "return" | "quote"
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
              onClick={() => navigate(`/jobs/${job.id}`)}
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
              <button className={styles.deleteBtn} onClick={onDelete}>
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
      </div>
    </div>
  );
};

export default CalendarJobDetailsModal;
