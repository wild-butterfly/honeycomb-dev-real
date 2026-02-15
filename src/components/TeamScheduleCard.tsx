import React from "react";
import styles from "./TeamScheduleCard.module.css";

const TeamScheduleCard: React.FC<{ job: any }> = ({ job }) => {
  return (
    <div className={styles.card}>
      <h3>Team & Scheduling</h3>

      <div className={styles.infoRow}>
        <span>Assigned Staff</span>
        <span>{job.assigned_staff || 0}</span>
      </div>

      <div className={styles.infoRow}>
        <span>Scheduled</span>
        <span>{job.scheduled_hours || 0}h</span>
      </div>

      <div className={styles.infoRow}>
        <span>Logged</span>
        <span>{job.completed_hours || 0}h</span>
      </div>

      <div className={styles.infoRow}>
        <span>Variance</span>
        <span>{(job.completed_hours || 0) - (job.scheduled_hours || 0)}h</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.infoRow}>
        <span>Next Visit</span>
        <span>{job.next_visit || "—"}</span>
      </div>

      <div className={styles.infoRow}>
        <span>Upcoming Booking</span>
        <span>{job.upcoming_booking || 0}</span>
      </div>
    </div>
  );
};

export default TeamScheduleCard;
