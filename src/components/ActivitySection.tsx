import React, { useEffect, useState } from "react";
import styles from "./ActivitySection.module.css";
import { ClockIcon } from "@heroicons/react/24/outline";
import { apiGet } from "../services/api";

interface ActivityItem {
  type: string;
  title: string;
  user_name: string;
  date: string;
}

interface Props {
  jobId: number;
}

const ActivitySection: React.FC<Props> = ({ jobId }) => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<ActivityItem[]>(`/jobs/${jobId}/activity`);

        setActivity(data || []);
      } catch (err) {
        console.error("Activity load failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId]);

  const formatTime = (date: string) => {
    const d = new Date(date);

    return d.toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.card}>
      {/* HEADER */}

      <div className={styles.header}>
        <ClockIcon className={styles.headerIcon} />

        <div className={styles.title}>Activity</div>
      </div>

      {/* CONTENT */}

      <div className={styles.timeline}>
        {loading && <div className={styles.empty}>Loading activity...</div>}

        {!loading && activity.length === 0 && (
          <div className={styles.empty}>No activity yet</div>
        )}

        {activity.map((item, index) => (
          <div key={index} className={styles.item}>
            {/* ICON COLUMN */}

            <div className={styles.iconWrapper}>
              <div className={styles.iconDot} />

              {index !== activity.length - 1 && <div className={styles.line} />}
            </div>

            {/* CONTENT */}

            <div className={styles.content}>
              <div className={styles.itemTitle}>{item.title}</div>

              <div className={styles.subtitle}>{item.user_name}</div>

              <div className={styles.time}>{formatTime(item.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivitySection;
