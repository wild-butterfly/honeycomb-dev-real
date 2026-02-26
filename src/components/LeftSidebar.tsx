import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import styles from "./LeftSidebar.module.css";

// HEROICONS
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const LeftSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  if (!id) return null;

  // Always use /dashboard/jobs/:id for job sidebar links
  const basePath = `/dashboard/jobs/${id}`;

  const go = (path: string) => {
    navigate(`${basePath}/${path}`);
  };

  const isActive = (path: string) =>
    location.pathname === `${basePath}/${path}`;

  return (
    <div className={styles.sidebar}>
      {/* JOB OVERVIEW */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Job Overview</div>

        <button
          className={`${styles.menuItem} ${isActive("summary") ? styles.active : ""}`}
          onClick={() => go("summary")}
        >
          <DocumentTextIcon className={styles.icon} />
          Job Summary
        </button>

        <button
          className={`${styles.menuItem} ${isActive("employee-notes") ? styles.active : ""}`}
          onClick={() => go("employee-notes")}
        >
          <ChatBubbleLeftRightIcon className={styles.icon} />
          Employee Notes
        </button>

        <button
          className={`${styles.menuItem} ${isActive("files-photos") ? styles.active : ""}`}
          onClick={() => go("files-photos")}
        >
          <PhotoIcon className={styles.icon} />
          Files & Photos
        </button>

        <button
          className={`${styles.menuItem} ${isActive("financial-summary") ? styles.active : ""}`}
          onClick={() => go("financial-summary")}
        >
          <CurrencyDollarIcon className={styles.icon} />
          Financial Summary
        </button>

        <button
          className={`${styles.menuItem} ${isActive("cost-report") ? styles.active : ""}`}
          onClick={() => go("cost-report")}
        >
          <ChartBarIcon className={styles.icon} />
          Cost Report
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Quick Actions</div>

        <button
          className={`${styles.menuItem} ${isActive("invoicing") ? styles.active : ""}`}
          onClick={() => go("invoicing")}
        >
          <DocumentDuplicateIcon className={styles.icon} />
          Invoicing
        </button>

        <button
          className={`${styles.quickAction} ${isActive("quick-note") ? styles.active : ""}`}
          onClick={() => go("quick-note")}
        >
          <PencilSquareIcon className={styles.icon} />
          Quick Note
        </button>
      </div>

      {/* JOB PHASES */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Job Phases</div>

        <button
          className={`${styles.menuItem} ${isActive("phases") ? styles.active : ""}`}
          onClick={() => go("phases")}
        >
          <WrenchScrewdriverIcon className={styles.icon} />
          View Job Phases
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;
