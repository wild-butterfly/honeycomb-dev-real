import React, { useState } from "react";
import styles from "./UserPreferences.module.css";

const UserPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    darkMode: false,
    language: "english",
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>User Preferences</h1>
        <p>Customize your experience</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <fieldset>
            <legend className={styles.legend}>Notifications</legend>

            <div className={styles.switchGroup}>
              <label htmlFor="emailNotifications">Email Notifications</label>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    emailNotifications: e.target.checked,
                  })
                }
              />
            </div>

            <div className={styles.switchGroup}>
              <label htmlFor="invoiceReminders">Invoice Reminders</label>
              <input
                type="checkbox"
                id="invoiceReminders"
                checked={preferences.invoiceReminders}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    invoiceReminders: e.target.checked,
                  })
                }
              />
            </div>
          </fieldset>
        </section>

        <section className={styles.section}>
          <fieldset>
            <legend className={styles.legend}>Display</legend>

            <div className={styles.formGroup}>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    language: e.target.value,
                  })
                }
                className={styles.select}
              >
                <option value="english">English</option>
                <option value="spanish">Español</option>
                <option value="french">Français</option>
                <option value="german">Deutsch</option>
              </select>
            </div>
          </fieldset>
        </section>

        <div className={styles.actions}>
          <button className={styles.saveButton}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
