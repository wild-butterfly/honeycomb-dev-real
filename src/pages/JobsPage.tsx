import React from "react";
import styles from "./DashboardPage.module.css";

import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { logout } from "../services/api";

const JobsPage: React.FC = () => {
  return (
    <div className={styles.dashboardShell}>
      <div className={styles.dashboardBg}>
        <DashboardNavbar onLogout={logout} />

        <div className={styles.centerPageRow}>
          <div className={`${styles.tableCardModern} ${styles.centerPageCard}`}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderLeft}>
                <div className={styles.tableHeaderTopRow}>
                  <h3 className={styles.tableTitle}>Jobs</h3>
                </div>

                <div className={styles.tableHeaderMetaRow}>
                  <div className={styles.tableSubtitle}>
                    <span className={styles.tablePill}>Jobs overview</span>
                    <span className={styles.tableHint}>
                      View and manage all jobs in one place.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tableTopDivider} />

            <div className={styles.tableScrollWrap}>
              <div style={{ padding: "24px 20px" }}>
                <p style={{ margin: 0 }}>
                  This Jobs dashboard will show your job list and key details
                  using the Honeycomb layout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobsPage;

