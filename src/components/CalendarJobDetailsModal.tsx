// Created by Honeycomb © 2025
import React, { useEffect, useState } from "react";
import styles from "./CalendarJobDetailsModal.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import TimePicker from "../components/TimePicker";
import { useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";

interface Props {
  job: CalendarJob;
  employees: Employee[];
  allJobs: CalendarJob[];
  onClose: () => void;
  onDelete: () => void;
  onSave: (job: CalendarJob) => void;
}

function formatDateLine(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);

  const dateLabel = s.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeLabel =
    s.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) +
    " – " +
    e.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

  const durationMinutes = Math.round((e.getTime() - s.getTime()) / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  let durationLabel = "";
  if (hours && mins) durationLabel = `${hours}h ${mins}m`;
  else if (hours) durationLabel = `${hours}h`;
  else durationLabel = `${mins}m`;

  return { dateLabel, timeLabel, durationLabel };
}

const CalendarJobDetailsModal: React.FC<Props> = ({
  job,
  employees,
  allJobs,
  onClose,
  onDelete,
  onSave,
}) => {
  const navigate = useNavigate();

  const { dateLabel, timeLabel, durationLabel } = formatDateLine(
    job.start,
    job.end
  );

  const [editMode, setEditMode] = useState(false);

  const [jobColor, setJobColor] = useState(job.color || "#fff8e1");

  const [title, setTitle] = useState(job.title);
  const [customer, setCustomer] = useState(job.customer);
  const [location, setLocation] = useState(job.location || "");
  const [siteContact, setSiteContact] = useState(job.siteContact || "");
  const [contactInfo, setContactInfo] = useState(job.contactInfo || "");
  const [notes, setNotes] = useState(job.notes || "");

  const [assignedTo, setAssignedTo] = useState<number[]>(
    Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo]
  );

  const [localStart, setLocalStart] = useState(new Date(job.start));
  const [localEnd, setLocalEnd] = useState(new Date(job.end));

  // SEARCH JOB
  const [search, setSearch] = useState("");
  const [jobResults, setJobResults] = useState<CalendarJob[]>([]);

  useEffect(() => {
    if (search.length < 2) {
      setJobResults([]);
      return;
    }

    const lower = search.toLowerCase();

    const filtered = allJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(lower) ||
        j.customer.toLowerCase().includes(lower) ||
        (j.location && j.location.toLowerCase().includes(lower))
    );

    setJobResults(filtered);
  }, [search]);

  function fillJobFields(j: CalendarJob) {
    setTitle(j.title);
    setCustomer(j.customer);
    setLocation(j.location || "");
    setSiteContact(j.siteContact || "");
    setContactInfo(j.contactInfo || "");
    setNotes(j.notes || "");
    setAssignedTo(
      Array.isArray(j.assignedTo) ? j.assignedTo : [j.assignedTo]
    );
  }

  // Reset fields when job changes
  useEffect(() => {
    setEditMode(false);
    setTitle(job.title);
    setCustomer(job.customer);
    setLocation(job.location || "");
    setSiteContact(job.siteContact || "");
    setContactInfo(job.contactInfo || "");
    setNotes(job.notes || "");
    setAssignedTo(
      Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo]
    );
    setLocalStart(new Date(job.start));
    setLocalEnd(new Date(job.end));
    setJobColor(job.color || "#fff8e1");
  }, [job]);

  /* SAVE CHANGES */
  const handleSaveClick = () => {
    const updated: CalendarJob = {
      ...job,
      title,
      customer,
      location,
      siteContact,
      contactInfo,
      notes,
      assignedTo,
      start: localStart.toISOString(),
      end: localEnd.toISOString(),
      color: jobColor,
    };

    onSave(updated);
    setEditMode(false);
  };

  const pastelPalette = [
    // Honey & cream
    "#fff8e1", "#fff4d4", "#ffefc2", "#fceec0",

    // Mint
    "#eaf7e9", "#dff4e4", "#d2efdc", "#c8ecd6",

    // Aqua
    "#e9f9ff", "#ddf5ff", "#d3eff7", "#cfe9f5",

    // Peach
    "#ffedea", "#ffe7e3", "#ffe3d6", "#ffdccc",

    // Lavender
    "#f6edff", "#f2e6ff", "#ecdfff", "#e7d7fa",
  ];

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>

        {/* SEARCH JOB */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>SEARCH JOB</div>

          <input
            className={styles.searchInput}
            placeholder="Search existing jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {jobResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {jobResults.map((j) => (
                <div
                  key={j.id}
                  className={styles.searchItem}
                  onClick={() => {
                    fillJobFields(j);
                    setSearch("");
                    setJobResults([]);
                  }}
                >
                  <div className={styles.searchTitle}>{j.title}</div>
                  <div className={styles.searchCustomer}>{j.customer}</div>
                  <div className={styles.searchAddress}>{j.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>

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
              <div className={styles.title}>{job.title}</div>
            )}
            <div className={styles.subtitle}>{dateLabel}</div>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        {/* TIME */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>TIME</div>

          {editMode ? (
            <div className={styles.timeEditContainer}>
              <TimePicker value={localStart} onChange={setLocalStart} label="Start" />
              <TimePicker value={localEnd} onChange={setLocalEnd} label="End" />
            </div>
          ) : (
            <div className={styles.sectionValue}>
              {timeLabel} <span className={styles.chip}>{durationLabel}</span>
            </div>
          )}
        </div>

        {/* ASSIGNED STAFF */}
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
                  onClick={() =>
                    editMode &&
                    setAssignedTo((prev) => prev.filter((x) => x !== id))
                  }
                >
                  <div className={styles.staffAvatar2}>
                    {emp.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  <span className={styles.staffName}>{emp.name}</span>

                  {editMode && <span className={styles.removeX}>×</span>}
                </div>
              );
            })}
          </div>

          {editMode && (
            <select
              className={styles.staffDropdown}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id && !assignedTo.includes(id)) {
                  setAssignedTo((prev) => [...prev, id]);
                }
              }}
            >
              <option value="">Select staff…</option>
              {employees
                .filter((e) => !assignedTo.includes(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* CUSTOMER */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>CUSTOMER</div>
          {editMode ? (
            <input
              className={styles.fieldInput}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{customer}</div>
          )}
        </div>

        {/* LOCATION */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>SITE ADDRESS</div>
          {editMode ? (
            <textarea
              className={styles.fieldTextarea}
              value={location}
              rows={2}
              onChange={(e) => setLocation(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{location || "—"}</div>
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
            <div className={styles.sectionValue}>{siteContact || "—"}</div>
          )}
        </div>

        {/* CONTACT INFO */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>CONTACT INFO</div>
          {editMode ? (
            <input
              className={styles.fieldInput}
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{contactInfo || "—"}</div>
          )}
        </div>

        {/* NOTES */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>NOTES</div>
          {editMode ? (
            <textarea
              className={styles.fieldTextarea}
              value={notes}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
            />
          ) : (
            <div className={styles.sectionValue}>{notes || "—"}</div>
          )}
        </div>

        {/* COLOR PICKER + PALETTE */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>EVENT COLOR</div>

          {editMode ? (
            <>
              <div className={styles.colorPaletteRow}>
                {pastelPalette.map((c) => (
                  <div
                    key={c}
                    className={styles.colorDot}
                    style={{
                      backgroundColor: c,
                      border:
                        jobColor === c
                          ? "2px solid #c6a300"
                          : "1px solid #d4d4d4",
                      boxShadow:
                        jobColor === c
                          ? "0 0 6px rgba(198,163,0,0.6)"
                          : "none",
                    }}
                    onClick={() => setJobColor(c)}
                  />
                ))}
              </div>

              <div className={styles.colorPickerWrapper}>
                <HexColorPicker color={jobColor} onChange={setJobColor} />
                <input
                  className={styles.colorHexInput}
                  value={jobColor}
                  onChange={(e) => setJobColor(e.target.value)}
                />
              </div>
            </>
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

        {/* RELATED */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>RELATED EVENTS</div>

          <div className={styles.relatedRow}>
            <div className={styles.relatedTag}>
              {job.futureEvents?.length ?? 0} FUTURE EVENTS
            </div>

            <div className={styles.relatedTag}>
              {job.pastEvents?.length ?? 0} PAST EVENTS
            </div>

            <button
              className={styles.viewAllBtn}
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              View full job →
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          {editMode ? (
            <>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setEditMode(false);
                  setTitle(job.title);
                  setCustomer(job.customer);
                  setLocation(job.location || "");
                  setSiteContact(job.siteContact || "");
                  setContactInfo(job.contactInfo || "");
                  setNotes(job.notes || "");
                  setAssignedTo(
                    Array.isArray(job.assignedTo)
                      ? job.assignedTo
                      : [job.assignedTo]
                  );
                  setLocalStart(new Date(job.start));
                  setLocalEnd(new Date(job.end));
                  setJobColor(job.color || "#fff8e1");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveClick}
              >
                Save changes
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.deleteBtn} onClick={onDelete}>
                Delete event
              </button>

              <button
                type="button"
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
