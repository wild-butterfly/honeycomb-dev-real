import React, { useState } from "react";
import styles from "./UserPreferences.module.css";
import { useTheme } from "../context/ThemeContext";

const UserPreferences: React.FC = () => {
  const { isDark, toggleDark } = useTheme();

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    browserAlerts: false,
    language: "english",
  });


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Preferences</h1>
        <p className={styles.subtitle}>
          Personalize how Flowody notifies you and displays your workspace.
        </p>
      </div>

      <div className={styles.content}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            <p className={styles.sectionDesc}>
              Choose the alerts you want to receive.
            </p>
          </div>

          <fieldset className={styles.fieldset}>
            <label className={styles.preferenceRow} htmlFor="emailNotifications">
              <span className={styles.preferenceTextWrap}>
                <span className={styles.preferenceTitle}>Email Notifications</span>
                <span className={styles.preferenceHint}>
                  Receive updates about jobs and activity by email.
                </span>
              </span>
              <input
                type="checkbox"
                id="emailNotifications"
                className={styles.checkbox}
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    emailNotifications: e.target.checked,
                  })
                }
              />
            </label>

            <label className={styles.preferenceRow} htmlFor="invoiceReminders">
              <span className={styles.preferenceTextWrap}>
                <span className={styles.preferenceTitle}>Invoice Reminders</span>
                <span className={styles.preferenceHint}>
                  Get reminder alerts before invoices become overdue.
                </span>
              </span>
              <input
                type="checkbox"
                id="invoiceReminders"
                className={styles.checkbox}
                checked={preferences.invoiceReminders}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    invoiceReminders: e.target.checked,
                  })
                }
              />
            </label>

            <label className={styles.preferenceRow} htmlFor="browserAlerts">
              <span className={styles.preferenceTextWrap}>
                <span className={styles.preferenceTitle}>Browser Alerts</span>
                <span className={styles.preferenceHint}>
                  Show in-browser push alerts while Flowody is open.
                </span>
              </span>
              <input
                type="checkbox"
                id="browserAlerts"
                className={styles.checkbox}
                checked={preferences.browserAlerts}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    browserAlerts: e.target.checked,
                  })
                }
              />
            </label>
          </fieldset>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Display</h2>
            <p className={styles.sectionDesc}>
              Set language and visual preferences.
            </p>
          </div>

          <fieldset className={styles.fieldset}>
            <div className={styles.formGroup}>
              <label htmlFor="language" className={styles.inputLabel}>
                Language
              </label>
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
                <option value="spanish">Espanol</option>
                <option value="french">Francais</option>
                <option value="german">Deutsch</option>
              </select>
            </div>

            <label className={styles.preferenceRow} htmlFor="darkMode">
              <span className={styles.preferenceTextWrap}>
                <span className={styles.preferenceTitle}>Dark Mode (Beta)</span>
                <span className={styles.preferenceHint}>
                  Black &amp; purple theme — changes apply instantly.
                </span>
              </span>
              <input
                type="checkbox"
                id="darkMode"
                className={styles.checkbox}
                checked={isDark}
                onChange={(e) => toggleDark(e.target.checked)}
              />
            </label>
          </fieldset>
        </section>

        <div className={styles.actions}>
          <button
            className={styles.saveButton}
            onClick={() => toggleDark(isDark)}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
