import React from "react";
import styles from "./ActivitySection.module.css";

const ActivitySection: React.FC<{ job: any }> = ({ job }) => {
  const activities = [
    {
      date: "30 Oct 2025",
      title: "Prices Held for 2026",
      description: "Client confirmed pricing agreement for next cycle.",
      type: "update",
    },
    {
      date: "18 Dec 2024",
      title: "Logo Updated",
      description: "Client requested to use Asset Test & Tag logo.",
      type: "note",
    },
  ];

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Activity & Notes</h2>

      <div className={styles.timeline}>
        {activities.map((a, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.dot}></div>

            <div className={styles.content}>
              <div className={styles.date}>{a.date}</div>
              <div className={styles.title}>{a.title}</div>
              <div className={styles.description}>{a.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivitySection;
