// src/components/TeamScheduleCard.tsx
// Honeycomb © 2026

import React from "react";
import styles from "./TeamScheduleCard.module.css";

import {
  UserGroupIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface Props {
  job: any;
}

const TeamScheduleCard: React.FC<Props> = ({ job }) => {
  const assigned = job?.assigned_staff ?? 0;
  const scheduled = job?.scheduled_hours ?? 0;
  const logged = job?.logged_hours ?? 0;

  const variance = logged - scheduled;

  return (
    <div className={styles.card}>
      {/* HEADER */}

      <div className={styles.header}>
        <UserGroupIcon className={styles.headerIcon} />

        <div className={styles.title}>Team & Scheduling</div>
      </div>

      {/* BODY */}

      <div className={styles.body}>
        {/* ASSIGNED */}

        <div className={styles.row}>
          <UserGroupIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Assigned Staff</div>

            <div className={styles.value}>{assigned}</div>
          </div>
        </div>

        {/* SCHEDULED */}

        <div className={styles.row}>
          <ClockIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Scheduled Hours</div>

            <div className={styles.value}>{scheduled}h</div>
          </div>
        </div>

        {/* LOGGED */}

        <div className={styles.row}>
          <CalendarDaysIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Logged Hours</div>

            <div className={styles.value}>{logged}h</div>
          </div>
        </div>

        {/* VARIANCE */}

        <div className={styles.row}>
          <ArrowTrendingUpIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Variance</div>

            <div className={variance >= 0 ? styles.positive : styles.negative}>
              {variance >= 0 ? "+" : ""}
              {variance}h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamScheduleCard;
