import React from "react";
import styles from "./DataPrivacySettings.module.css";

const DataPrivacySettings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Data & Privacy</h1>
        <p>Manage your data and privacy settings</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Data Export</h3>
          <p className={styles.description}>
            Download a copy of your data in a portable format
          </p>
          <button className={styles.button}>Export My Data</button>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Privacy Policy</h3>
          <p className={styles.description}>
            Review our privacy policy and how we handle your data
          </p>
          <button className={styles.button}>Read Privacy Policy</button>
        </section>

        <section
          className={styles.section}
          style={{ borderLeftColor: "#ef4444" }}
        >
          <h3 className={styles.sectionTitle} style={{ color: "#991b1b" }}>
            Delete Account
          </h3>
          <p className={styles.description}>
            Permanently delete your account and all associated data
          </p>
          <button className={styles.dangerButton}>Delete Account</button>
        </section>
      </div>
    </div>
  );
};

export default DataPrivacySettings;
