import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi";
import styles from "./DashboardNavbar.module.css";
import CompanySwitcher from "./CompanySwitcher";
import { useAuth } from "../context/AuthContext";

type Props = {
  onLogout?: () => void;
  onNewJob?: () => void;
};

const DashboardNavbar: React.FC<Props> = ({ onLogout, onNewJob }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const closeProfileMenu = () => setProfileMenuOpen(false);

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
        <img src="/bee.png" alt="Honeycomb" className={styles.logo} />
        <span className={styles.brandText}>Honeycomb</span>
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
            to="/dashboard/jobs"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            onClick={closeMenu}
          >
            Jobs
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

          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            onClick={closeMenu}
          >
            Settings
          </NavLink>
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.right}>
          <CompanySwitcher />

          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleNewJobClick}
            type="button"
          >
            <span className={styles.plus}>＋</span>
            New Job
          </button>

          {/* Profile Dropdown Menu */}
          <div className={styles.profileMenu}>
            <button
              type="button"
              className={styles.profileButton}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
            >
              {user?.avatar && (
                <img
                  src={user.avatar}
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
                    {user?.avatar && (
                      <img
                        src={user.avatar}
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
                  <button
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={handleProfile}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={handleSettings}
                  >
                    {FiSettings({ size: 18 })}
                    Settings
                  </button>
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
