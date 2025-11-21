// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import { useParams } from "react-router-dom";
import { CalendarJob } from "./CalendarPage";
import styles from "./JobPage.module.css";

interface Props {
  jobs: CalendarJob[];
}

const JobPage: React.FC<Props> = ({ jobs }) => {
  const { id } = useParams();
  const job = jobs.find((j) => j.id === Number(id));

  if (!job)
    return <div className={styles.empty}>Job not found</div>;

  return (
    <div className={styles.container}>
      <h1>{job.title}</h1>

      <div className={styles.section}>
        <strong>Customer:</strong> {job.customer}
      </div>

      {job.location && (
        <div className={styles.section}>
          <strong>Location:</strong> {job.location}
        </div>
      )}

      <div className={styles.section}>
        <strong>Date:</strong>{" "}
        {new Date(job.start).toLocaleDateString()}
      </div>

      <div className={styles.section}>
        <strong>Time:</strong>{" "}
        {new Date(job.start).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {" — "}
        {new Date(job.end).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <div className={styles.section}>
        <strong>Assigned staff:</strong> {job.assignedTo.join(", ")}
      </div>
    </div>
  );
};

export default JobPage;
