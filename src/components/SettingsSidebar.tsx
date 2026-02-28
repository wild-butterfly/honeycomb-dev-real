import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiSettings,
  FiLock,
  FiDatabase,
  FiFileText,
  FiWifi,
  FiCreditCard,
  FiBell,
  FiSliders,
  FiUsers,
  FiTag,
} from "react-icons/fi";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import styles from "./SettingsSidebar.module.css";

interface SettingsItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SettingsCategory {
  title: string;
  items: SettingsItem[];
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    title: "USER PROFILE",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: FiUser({ size: 18 }),
        path: "/dashboard/settings",
      },
      {
        id: "preferences",
        label: "Preferences",
        icon: FiSettings({ size: 18 }),
        path: "/dashboard/settings?tab=preferences",
      },
    ],
  },
  {
    title: "BUSINESS SETUP",
    items: [
      {
        id: "general",
        label: "General",
        icon: FiSliders({ size: 18 }),
        path: "/dashboard/settings?tab=general",
      },
      {
        id: "invoice-settings",
        label: "Invoice Settings",
        icon: FiFileText({ size: 18 }),
        path: "/dashboard/settings?tab=invoice-settings",
      },
      {
        id: "quote-settings",
        label: "Quote Settings",
        icon: <ClipboardDocumentListIcon style={{ width: 18, height: 18 }} />,
        path: "/dashboard/settings?tab=quote-settings",
      },
    ],
  },
  {
    title: "LABOUR",
    items: [
      {
        id: "employees",
        label: "Employees",
        icon: FiUsers({ size: 18 }),
        path: "/dashboard/settings?tab=employees",
      },
      {
        id: "labour-categories",
        label: "Labour Categories",
        icon: FiTag({ size: 18 }),
        path: "/dashboard/settings?tab=labour-categories",
      },
      {
        id: "service-catalogs",
        label: "Service Catalogs",
        icon: FiDatabase({ size: 18 }),
        path: "/dashboard/settings?tab=service-catalogs",
      },
    ],
  },
  {
    title: "SECURITY & PRIVACY",
    items: [
      {
        id: "security",
        label: "Security",
        icon: FiLock({ size: 18 }),
        path: "/dashboard/settings?tab=security",
      },
      {
        id: "data",
        label: "Data & Privacy",
        icon: FiDatabase({ size: 18 }),
        path: "/dashboard/settings?tab=data",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: FiBell({ size: 18 }),
        path: "/dashboard/settings?tab=notifications",
      },
    ],
  },
  {
    title: "INTEGRATIONS",
    items: [
      {
        id: "integrations",
        label: "Integrations",
        icon: FiWifi({ size: 18 }),
        path: "/dashboard/settings?tab=integrations",
      },
      {
        id: "api",
        label: "API Keys",
        icon: FiSettings({ size: 18 }),
        path: "/dashboard/settings?tab=api",
      },
    ],
  },
  {
    title: "ACCOUNT MANAGEMENT",
    items: [
      {
        id: "billing",
        label: "Billing",
        icon: FiCreditCard({ size: 18 }),
        path: "/dashboard/settings?tab=billing",
      },
      {
        id: "users",
        label: "Users & Roles",
        icon: FiUser({ size: 18 }),
        path: "/dashboard/settings?tab=users",
      },
    ],
  },
];

const SettingsSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): string => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "profile";
  };

  const activeTab = getActiveTab();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <h2 className={styles.title}>Settings</h2>
        <nav className={styles.nav}>
          {SETTINGS_CATEGORIES.map((category) => (
            <div key={category.title} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              <div className={styles.categoryItems}>
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    className={`${styles.navItem} ${
                      activeTab === item.id ||
                      (item.id === "profile" && !activeTab)
                        ? styles.active
                        : ""
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default SettingsSidebar;
