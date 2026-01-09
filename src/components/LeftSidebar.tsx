import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LeftSidebar.module.css";

// HEROICONS
import {
  DocumentTextIcon,
  ClockIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";

const LeftSidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.sidebar}>

      {/* JOB OVERVIEW */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Job Overview</div>

        <button className={styles.menuItem} onClick={() => navigate("summary")}>
          <DocumentTextIcon className={styles.icon} />
          Job Summary
        </button>

        <button className={styles.menuItem} onClick={() => navigate("history")}>
          <ClockIcon className={styles.icon} />
          History
        </button>

        <button className={styles.menuItem} onClick={() => navigate("files")}>
          <PhotoIcon className={styles.icon} />
          Files & Photos
        </button>

        <button className={styles.menuItem} onClick={() => navigate("financial")}>
          <CurrencyDollarIcon className={styles.icon} />
          Financial Summary
        </button>

        <button className={styles.menuItem} onClick={() => navigate("cost")}>
          <ChartBarIcon className={styles.icon} />
          Cost Report
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Quick Actions</div>

        <button className={styles.menuItem} onClick={() => navigate("invoice")}>
          <DocumentDuplicateIcon className={styles.icon} />
          Invoicing
        </button>

        <button
          className={styles.quickAction}
          onClick={() => navigate("quick-note")}
        >
          <PencilSquareIcon className={styles.icon} />
          Quick Note
        </button>
      </div>

      {/* JOB PHASES */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Job Phases</div>

        <button className={styles.menuItem} onClick={() => navigate("phases")}>
          <WrenchScrewdriverIcon className={styles.icon} />
          View Job Phases
        </button>
      </div>
      
    </div>
  );
};

export default LeftSidebar;
