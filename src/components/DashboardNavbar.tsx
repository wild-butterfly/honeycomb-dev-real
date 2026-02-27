import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi";
import styles from "./DashboardNavbar.module.css";
import CompanySwitcher from "./CompanySwitcher";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
import { usePermissions } from "../hooks/usePermissions";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

type Props = {
  onLogout?: () => void;
  onNewJob?: () => void;
};

interface ProfileData {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  job_title?: string;
  department?: string;
  address?: string;
  timezone?: string;
  language?: string;
  role?: string;
}

const DashboardNavbar: React.FC<Props> = ({ onLogout, onNewJob }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { companyId } = useCompany();
  const { canCreateJob, canAccessSettings } = usePermissions();
  const { isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [companyAvatar, setCompanyAvatar] = useState<string | null>(null);

  const closeMenu = () => setMenuOpen(false);
  const closeProfileMenu = () => setProfileMenuOpen(false);

  // 🔒 SECURITY: Reload profile when switching companies to get that company's admin avatar
  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        const data = await api.get<ProfileData>("/me/profile");
        if (data?.avatar) {
          // Update the company-scoped avatar display
          const avatarUrl = data.avatar.startsWith("http")
            ? data.avatar
            : `http://localhost:3001${data.avatar}`;
          setCompanyAvatar(avatarUrl);
        } else {
          setCompanyAvatar(null);
        }
      } catch (error) {
        console.error("Failed to load company profile:", error);
        // Avoid showing a stale avatar from another company
        setCompanyAvatar(null);
      }
    };

    loadCompanyProfile();
  }, [companyId]);

  const handleNewJobClick = () => {
    onNewJob?.();
    setMenuOpen(false);
  };

  const handleProfile = () => {
    navigate("/dashboard/settings");
    closeProfileMenu();
  };

  const handleSettings = () => {
    navigate("/dashboard/settings?tab=preferences");
    closeProfileMenu();
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
    closeMenu();
    closeProfileMenu();
    navigate("/login");
  };

  return (
    <nav className={styles.navbar}>
      {/* LEFT: logo + brand */}
      <div className={styles.left}>
        <img
          src={isDark ? "/logo-dark.png" : "/logo.png"}
          alt="Flowody"
          className={styles.logo}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/logo.png";
          }}
        />
        <img
          src={isDark ? "/flowody-dark.png" : "/flowody.png"}
          alt="Flowody"
          className={styles.logoText}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/Flowody.png";
          }}
        />
      </div>

      {/* HAMBURGER */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Open menu"
        aria-expanded={menuOpen}
      >
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ""}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ""}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ""}`} />
      </button>

      {/* MENU */}
      <div className={`${styles.menu} ${menuOpen ? styles.open : ""}`}>
        {/* CENTER LINKS */}
        <div className={styles.center}>
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/dashboard/sites"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            onClick={closeMenu}
          >
            Sites
          </NavLink>

          <NavLink
            to="/dashboard/customers"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            onClick={closeMenu}
          >
            Customers
          </NavLink>

          <NavLink
            to="/dashboard/calendar"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            onClick={closeMenu}
          >
            Calendar
          </NavLink>

          {canAccessSettings && (
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              onClick={closeMenu}
            >
              Settings
            </NavLink>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.right}>
          <CompanySwitcher />

          {canCreateJob && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleNewJobClick}
              type="button"
            >
              <span className={styles.plus}>＋</span>
              New Job
            </button>
          )}

          {/* Profile Dropdown Menu */}
          <div className={styles.profileMenu}>
            <button
              type="button"
              className={styles.profileButton}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
            >
              {companyAvatar && (
                <img
                  src={companyAvatar}
                  alt="User avatar"
                  className={styles.profileAvatar}
                />
              )}
              {FiChevronDown({ size: 16 })}
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className={styles.profileMenuOverlay}
                  onClick={closeProfileMenu}
                  aria-hidden
                />
                <div className={styles.profileDropdown}>
                  <div className={styles.profileHeader}>
                    {companyAvatar && (
                      <img
                        src={companyAvatar}
                        alt="User avatar"
                        className={styles.profileHeaderAvatar}
                      />
                    )}
                    <div className={styles.profileInfo}>
                      <div className={styles.profileName}>
                        {user?.name || "User"}
                      </div>
                      <div className={styles.profileEmail}>{user?.email}</div>
                    </div>
                  </div>
                  <div className={styles.profileMenuDivider} />
                  {canAccessSettings && (
                    <button
                      type="button"
                      className={styles.profileMenuItem}
                      onClick={handleProfile}
                    >
                      Profile
                    </button>
                  )}
                  {canAccessSettings && (
                    <button
                      type="button"
                      className={styles.profileMenuItem}
                      onClick={handleSettings}
                    >
                      {FiSettings({ size: 18 })}
                      Settings
                    </button>
                  )}
                  {canAccessSettings && (
                    <button
                      type="button"
                      className={styles.profileMenuItem}
                      onClick={() => {
                        navigate("/dashboard/settings?tab=preferences");
                        closeProfileMenu();
                      }}
                    >
                      Preferences
                    </button>
                  )}
                  <div className={styles.profileMenuDivider} />
                  <button
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={handleLogout}
                  >
                    {FiLogOut({ size: 18 })}
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY */}
      {menuOpen && (
        <div className={styles.menuOverlay} onClick={closeMenu} aria-hidden />
      )}
    </nav>
  );
};

export default DashboardNavbar;
