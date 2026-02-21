import React from "react";
import styles from "./SecuritySettings.module.css";

const SecuritySettings: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Security</h1>
        <p>Manage your account security</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Password</h3>
          <p className={styles.description}>
            Change your password regularly to keep your account secure
          </p>
          <button className={styles.button}>Change Password</button>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Two-Factor Authentication</h3>
          <p className={styles.description}>
            Add an extra layer of security to your account
          </p>
          <button className={styles.button}>Enable 2FA</button>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Active Sessions</h3>
          <p className={styles.description}>
            Manage your active sessions across devices
          </p>
          <button className={styles.button}>View Sessions</button>
        </section>
      </div>
    </div>
  );
};

export default SecuritySettings;
