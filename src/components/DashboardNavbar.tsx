import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./DashboardNavbar.module.css";
import CompanySwitcher from "./CompanySwitcher";

type Props = {
  onLogout?: () => void;
  onNewJob?: () => void;
};

const DashboardNavbar: React.FC<Props> = ({ onLogout, onNewJob }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleNewJobClick = () => {
    onNewJob?.();
    setMenuOpen(false);
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

          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
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
