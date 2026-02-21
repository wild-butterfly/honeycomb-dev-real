import React from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ProfileSettings.module.css";

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Profile Settings</h1>
        <p>Manage your profile information</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.avatarSection}>
            {user?.avatar && (
              <img
                src={user.avatar}
                alt="User avatar"
                className={styles.avatar}
              />
            )}
            <button className={styles.changeButton}>Change Avatar</button>
          </div>
        </section>

        <section className={styles.section}>
          <fieldset>
            <legend className={styles.legend}>Personal Information</legend>

            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={user?.name || ""}
                readOnly
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={user?.email || ""}
                readOnly
                className={styles.input}
              />
            </div>
          </fieldset>
        </section>

        <div className={styles.info}>
          <p>
            To change your profile information, please contact your
            administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
