// Created by Honeycomb © 2025
import React from "react";
import styles from "./JobPhaseSection.module.css";

interface Props {
  jobId: number;
}

const JobPhaseSection: React.FC<Props> = ({ jobId }) => {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Job Phases</h3>

      <div className={styles.empty}>No job phases yet.</div>
    </div>
  );
};

export default JobPhaseSection;
