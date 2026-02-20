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

interface GroupedActivity {
  dateLabel: string;
  items: ActivityItem[];
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      const match = dateStr.match(/(\d{2}):(\d{2})/);
      if (!match) return dateStr;

      const [, hour, minute] = match;
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? "pm" : "am";
      const displayHour =
        hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;

      return `${displayHour}:${minute}${ampm}`;
    } catch {
      return dateStr;
    }
  };

  const groupByDate = (items: ActivityItem[]): GroupedActivity[] => {
    const groups: { [key: string]: ActivityItem[] } = {};

    items.forEach((item) => {
      const match = item.date.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return;

      const [, year, month, day] = match;
      const dateKey = `${year}-${month}-${day}`;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([key, items]) => {
      const [year, month, day] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dateLabel = date.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      return { dateLabel, items };
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

        {!loading &&
          activity.length > 0 &&
          groupByDate(activity).map((group, groupIndex) => (
            <div key={groupIndex} className={styles.dateGroup}>
              {/* DATE HEADER */}
              <div className={styles.dateHeader}>
                <div className={styles.dateLabel}>{group.dateLabel}</div>
              </div>

              {/* ITEMS FOR THIS DATE */}
              <div className={styles.dateItems}>
                {group.items.map((item, index) => {
                  const scheduleRange = extractScheduleRange(item.title);

                  return (
                    <div key={index} className={styles.activityCard}>
                      <div className={styles.activityRow}>
                        {/* TIME */}
                        <div className={styles.activityTime}>
                          {formatTimeOnly(item.date)}
                        </div>

                        {/* AVATAR */}
                        <div className={styles.avatar}>
                          {getInitials(item.user_name)}
                        </div>

                        {/* CONTENT */}
                        <div className={styles.activityContent}>
                          <div className={styles.activityTitle}>
                            {item.title}
                          </div>

                          <div className={styles.activityMeta}>
                            <span className={styles.activityUser}>
                              {item.user_name}
                            </span>
                            {scheduleRange && (
                              <>
                                <span className={styles.activityDot}>•</span>
                                <span className={styles.activitySchedule}>
                                  {scheduleRange}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
