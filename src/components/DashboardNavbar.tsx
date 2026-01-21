import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./DashboardNavbar.module.css";

type Props = {
  onLogout?: () => void;
  onNewJob?: () => void;
  searchValue?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const DashboardNavbar: React.FC<Props> = ({
  onLogout,
  onNewJob,
  searchValue = "",
  onSearchChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleNewJobClick = () => {
    // 1️⃣ Önce modal / action tetikle
    onNewJob?.();

    // 2️⃣ Sonra hamburger menüyü kapat
    setMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      {/* LEFT: logo */}
      <div className={styles.left}>
        <img src="/bee.png" alt="Logo" className={styles.logo} />
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
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchValue}
              onChange={onSearchChange}
              className={styles.searchInput}
            />
            <span className={styles.searchIconInside}>
              <svg viewBox="0 0 18 18" width="18" height="18">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="#b99a2a"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="13.2"
                  y1="13.2"
                  x2="17"
                  y2="17"
                  stroke="#b99a2a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          <button
            className={styles.newJobBtn}
            onClick={() => {
              onNewJob?.();
            }}
            type="button"
          >
            <span className={styles.plus}>＋</span>
            New Job
          </button>

          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={() => {
              onLogout?.();
              closeMenu();
            }}
          >
            Log Out
          </button>
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
