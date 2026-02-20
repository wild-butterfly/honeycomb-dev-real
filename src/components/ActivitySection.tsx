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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 5;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const limit = pageSize + 1;
        const offset = page * pageSize;
        const data = await apiGet<ActivityItem[]>(
          `/jobs/${jobId}/activity?limit=${limit}&offset=${offset}`,
        );

        const items = data || [];
        setHasMore(items.length > pageSize);
        setActivity(items.slice(0, pageSize));
      } catch (err) {
        console.error("Activity load failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId, page]);

  const formatTime = (date: string) => {
    return date;
  };

  const extractScheduleRange = (title: string) => {
    const matches = title.match(
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}\s*-\s*\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g,
    );

    if (!matches || matches.length === 0) return null;
    return matches[matches.length - 1].replace(/\s*-\s*/, " - ");
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

        {activity.map((item, index) => {
          const scheduleRange = extractScheduleRange(item.title);
          const displayTime = scheduleRange ?? formatTime(item.date);

          return (
            <div key={index} className={styles.item}>
              {/* ICON COLUMN */}

              <div className={styles.iconWrapper}>
                <div className={styles.iconDot} />

                {index !== activity.length - 1 && (
                  <div className={styles.line} />
                )}
              </div>

              {/* CONTENT */}

              <div className={styles.content}>
                <div className={styles.itemTitle}>{item.title}</div>

                <div className={styles.subtitle}>{item.user_name}</div>

                <div className={styles.time}>{displayTime}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          type="button"
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
        >
          Previous
        </button>

        <span className={styles.pageInfo}>Page {page + 1}</span>

        <button
          className={styles.pageButton}
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActivitySection;
