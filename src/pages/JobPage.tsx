// pages/JobPage.tsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./JobPage.module.css";

const JobPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className={styles.jobPageWrapper}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSectionTitle}>JOB OVERVIEW</div>
        <ul className={styles.menuList}>
          <li className={styles.active}>Job Summary</li>
          <li>Financial Summary</li>
          <li>Cost Report</li>
          <li>Notes & History</li>
          <li>Files & Photos</li>
        </ul>

        <div className={styles.sidebarSectionTitle}>TOOLS</div>
        <ul className={styles.menuList}>
          <li>Invoicing</li>
          <li>Tasks</li>
          <li>Forms</li>
          <li>Hazards</li>
          <li>Certificates</li>
          <li>Checklists</li>
        </ul>

        <div className={styles.sidebarSectionTitle}>COSTINGS</div>
        <ul className={styles.menuList}>
          <li>Reconciliation</li>
          <li>Purchase Orders</li>
        </ul>

        <div className={styles.sidebarSectionTitle}>JOB PHASES (1)</div>
        <div className={styles.jobPhaseBox}>
          <button className={styles.addJobPhaseBtn}>+ Add job phase</button>
          <div className={styles.phaseItem}>
            <span>A | Test & Tag - 16/02/2026</span>
            <span>$0.00</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        {/* TOP HEADER */}
        <div className={styles.header}>
          <h1>A1TT-{id} — Test & Tag — 16/02/2026</h1>

          <div className={styles.headerRight}>
            <span className={styles.status}>ACTIVE</span>
            <span className={styles.notSent}>TOT - NOT SENT</span>
            <button className={styles.settingsBtn}>Job Settings ▾</button>
          </div>
        </div>

        {/* SUBHEADER */}
        <div className={styles.subHeader}>
          <div className={styles.subLeft}>
            <span>0 Notes</span>
            <span>0 Variations</span>
            <span>Asset Test & Tag (Nick Scali)</span>
            <span>⭐ 5</span>
          </div>
          <div className={styles.subRight}>
            Site Manager: Nick Scali — Essendon
          </div>
        </div>

        {/* JOB PHASE SECTION */}
        <div className={styles.phaseHeader}>
          <h2>A1TT-{id}a — Test & Tag — 16/02/2026</h2>
          <button className={styles.markInvoiceBtn}>✔ Mark as ready to invoice</button>
        </div>

        <div className={styles.phaseProgressBar}>
          <span>To Schedule</span>
          <span>→</span>
          <span>To Start</span>
          <span>→</span>
          <span>In Progress</span>
          <span>→</span>
          <span>Labour Complete</span>
          <span>→</span>
          <span>To Invoice</span>
          <span>→</span>
          <span>To Be Approved</span>
          <span>→</span>
          <span>Invoiced</span>
        </div>

        {/* JOB PHASE DESCRIPTION */}
        <section className={styles.sectionBox}>
          <h3>Job Phase Description</h3>
          <p>
            Mon 16th Feb, 2026<br />
            120 items due for testing (80 × SP 12 monthly) (40 × RCD 2 yearly)<br />
            Booked with Steve Lucy via email. KH<br />
            RED tags used last visit.<br />
            PLS TEST USING ASSET TEST & TAG LOGO<br />
            DO NOT TEST FLOOR STOCK
          </p>
        </section>

        {/* JOB CHECKLISTS */}
        <section className={styles.sectionBox}>
          <h3>Job Phase Checklists (0)</h3>
          <button className={styles.addButton}>Add Checklist ▾</button>
        </section>

        {/* FORMS */}
        <section className={styles.sectionBox}>
          <h3>Forms (0)</h3>
          <button className={styles.addButton}>Add Form ▾</button>
        </section>

        {/* ASSIGNMENT & SCHEDULING */}
        <section className={styles.sectionBox}>
          <h3>Assignment & Scheduling</h3>

          <div className={styles.scheduleActions}>
            <select>
              <option>Assign</option>
            </select>
            <button className={styles.scheduleBtn}>Schedule</button>
          </div>

          {/* ASSIGNED EMPLOYEES */}
          <div className={styles.employeeCard}>
            <div className={styles.empHeader}>
              <strong>Askin Fear</strong>
              <span className={styles.labourBadge}>LABOUR NOT COMPLETED</span>
            </div>
            <div>Scheduled: Monday, 16 Feb 2026 02:00 pm – 05:00 pm (3 hours)</div>
            <div>Time Entry: Labour not entered</div>
          </div>

          <div className={styles.employeeCard}>
            <div className={styles.empHeader}>
              <strong>Daniel Fear</strong>
              <span className={styles.labourBadge}>LABOUR NOT COMPLETED</span>
            </div>
            <div>Scheduled: Monday, 16 Feb 2026 02:00 pm – 05:00 pm (3 hours)</div>
            <div>Time Entry: Labour not entered</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default JobPage;
