import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import SettingsSidebar from "../components/SettingsSidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import LeftSidebar from "../components/LeftSidebar";
import Footer from "../components/Footer";
import InvoiceSettingsPage from "./InvoiceSettingsPage";
import ProfileSettings from "../components/ProfileSettings";
import UserPreferences from "../components/UserPreferences";
import SecuritySettings from "../components/SecuritySettings";
import DataPrivacySettings from "../components/DataPrivacySettings";
import styles from "./SettingsPage.module.css";

const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "profile";

  const currentTab = useMemo(() => {
    switch (tab) {
      case "preferences":
        return { id: "preferences", component: <UserPreferences /> };
      case "invoice-settings":
        return { id: "invoice-settings", component: <InvoiceSettingsPage /> };
      case "security":
        return { id: "security", component: <SecuritySettings /> };
      case "data":
        return { id: "data", component: <DataPrivacySettings /> };
      case "profile":
      default:
        return { id: "profile", component: <ProfileSettings /> };
    }
  }, [tab]);

  return (
    <>
      <DashboardNavbar />
      <div className={styles.pageWrapper}>
        <LeftSidebar />
        <main className={styles.main}>
          <SettingsSidebar />
          <div className={styles.settingsContainer}>
            <div className={styles.content}>
              <div className={styles.contentInner}>{currentTab.component}</div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default SettingsPage;
